// app/api/tickets/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface BulkTicketData {
  name: string;
  surname: string;
  email?: string;
  eventId: string;
}

interface BulkCreateRequest {
  tickets: BulkTicketData[];
  eventId: string;
}

// Generate a unique ticket code
function generateTicketCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// POST /api/tickets/bulk - Create multiple tickets
export async function POST(request: NextRequest) {
  try {
    const body: BulkCreateRequest = await request.json();
    const { tickets, eventId } = body;

    // Validate request
    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return NextResponse.json(
        { error: "No tickets provided" },
        { status: 400 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Verify the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Validate each ticket and collect errors
    const validTickets: Array<BulkTicketData & { code: string }> = [];
    const errors: Array<{ index: number; error: string; data: BulkTicketData }> = [];

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const ticketErrors: string[] = [];

      // Validate required fields
      if (!ticket.name || ticket.name.trim() === '') {
        ticketErrors.push('Name is required');
      }

      if (!ticket.surname || ticket.surname.trim() === '') {
        ticketErrors.push('Surname is required');
      }

      if (ticketErrors.length > 0) {
        errors.push({
          index: i,
          error: ticketErrors.join(', '),
          data: ticket
        });
      } else {
        // Generate unique ticket code
        let code = generateTicketCode();
        let attempts = 0;
        const maxAttempts = 10;

        // Ensure ticket code is unique
        while (attempts < maxAttempts) {
          const existingTicket = await prisma.ticket.findUnique({
            where: { code }
          });

          if (!existingTicket) {
            break;
          }

          code = generateTicketCode();
          attempts++;
        }

        if (attempts === maxAttempts) {
          errors.push({
            index: i,
            error: 'Failed to generate unique ticket code',
            data: ticket
          });
        } else {
          validTickets.push({
            ...ticket,
            code,
            eventId: eventId
          });
        }
      }
    }

    // Create valid tickets in bulk
    const createdTickets = [];
    let created = 0;
    let failed = errors.length;

    if (validTickets.length > 0) {
      try {
        // Use createMany for bulk insert
        const createResult = await prisma.ticket.createMany({
          data: validTickets.map(ticket => ({
            name: ticket.name.trim(),
            surname: ticket.surname.trim(),
            code: ticket.code,
            eventId: ticket.eventId,
            used: false
          })),
          skipDuplicates: true // Skip any duplicates
        });

        created = createResult.count;

        // Fetch the created tickets to return them
        const fetchedTickets = await prisma.ticket.findMany({
          where: {
            code: {
              in: validTickets.map(t => t.code)
            }
          },
          include: {
            event: {
              select: {
                name: true
              }
            }
          }
        });

        createdTickets.push(...fetchedTickets.map(ticket => ({
          id: ticket.id,
          code: ticket.code,
          name: ticket.name,
          surname: ticket.surname,
          used: ticket.used,
          eventId: ticket.eventId,
          createdAt: ticket.createdAt.toISOString(),
          eventName: ticket.event?.name
        })));

      } catch (createError) {
        console.error("Error creating tickets:", createError);
        
        // If bulk create fails, try individual creates to get more specific errors
        for (const ticket of validTickets) {
          try {
            const createdTicket = await prisma.ticket.create({
              data: {
                name: ticket.name.trim(),
                surname: ticket.surname.trim(),
                code: ticket.code,
                eventId: ticket.eventId,
                used: false
              },
              include: {
                event: {
                  select: {
                    name: true
                  }
                }
              }
            });

            createdTickets.push({
              id: createdTicket.id,
              code: createdTicket.code,
              name: createdTicket.name,
              surname: createdTicket.surname,
              used: createdTicket.used,
              eventId: createdTicket.eventId,
              createdAt: createdTicket.createdAt.toISOString(),
              eventName: createdTicket.event?.name
            });

            created++;
          } catch (individualError) {
            const ticketIndex = validTickets.findIndex(t => t.code === ticket.code);
            errors.push({
              index: ticketIndex,
              error: individualError instanceof Error ? individualError.message : 'Failed to create ticket',
              data: ticket
            });
            failed++;
          }
        }
      }
    }

    // Return response
    const response = {
      success: created > 0,
      created,
      failed,
      tickets: createdTickets,
      ...(errors.length > 0 && { errors })
    };

    console.log('Bulk ticket creation result:', response);

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error("Error in bulk ticket creation:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to create tickets",
        success: false,
        created: 0,
        failed: 0,
        tickets: []
      },
      { status: 500 }
    );
  }
}