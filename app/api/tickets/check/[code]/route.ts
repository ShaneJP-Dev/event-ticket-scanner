// app/api/tickets/check/[code]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/tickets/check/[code] - Check ticket by code
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.toUpperCase();

    if (!code || code.length < 3) {
      return NextResponse.json(
        { error: "Invalid ticket code" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { code },
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
    console.error("Error checking ticket:", error);
    return NextResponse.json(
      { error: "Failed to check ticket" },
      { status: 500 }
    );
  }
}