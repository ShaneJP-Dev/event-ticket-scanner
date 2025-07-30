// app/api/tickets/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/tickets/[id] - Fetch single ticket
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

// PUT /api/tickets/[id] - Update ticket
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, surname, eventId, used } = body;

    // Check if ticket exists
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: params.id }
    });

    if (!existingTicket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (surname !== undefined) updateData.surname = surname;
    if (eventId !== undefined) updateData.eventId = eventId;
    
    if (used !== undefined) {
      updateData.used = used;
      // Set usedAt timestamp when marking as used
      if (used && !existingTicket.used) {
        updateData.usedAt = new Date();
      }
      // Clear usedAt when marking as unused
      if (!used && existingTicket.used) {
        updateData.usedAt = null;
      }
    }

    // If eventId is provided, verify the event exists
    if (eventId) {
      const event = await prisma.event.findUnique({
        where: { id: eventId }
      });

      if (!event) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: params.id },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true
          }
        }
      }
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}

// DELETE /api/tickets/[id] - Delete ticket
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if ticket exists
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: params.id }
    });

    if (!existingTicket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    await prisma.ticket.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      message: "Ticket deleted successfully",
      deletedTicket: existingTicket 
    });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json(
      { error: "Failed to delete ticket" },
      { status: 500 }
    );
  }
}