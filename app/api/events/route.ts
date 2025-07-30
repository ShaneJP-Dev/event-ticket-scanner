// app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/events - Fetch all events
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        _count: {
          select: { tickets: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format dates for frontend display
    const formattedEvents = events.map(event => ({
      ...event,
      date: `${event.startDate.toLocaleDateString()} - ${event.endDate.toLocaleDateString()}`,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      ticketCount: event._count.tickets
    }));

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, startDate, endDate } = body;

    // Validate required fields
    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Name, start date, and end date are required" },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        name,
        startDate: start,
        endDate: end,
      },
      include: {
        _count: {
          select: { tickets: true }
        }
      }
    });

    const formattedEvent = {
      ...event,
      date: `${event.startDate.toLocaleDateString()} - ${event.endDate.toLocaleDateString()}`,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      ticketCount: event._count.tickets
    };

    return NextResponse.json(formattedEvent, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}