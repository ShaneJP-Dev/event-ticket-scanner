"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addEvent(data: { name: string; startDate: string; endDate: string }) {
  await prisma.event.create({
    data: {
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    },
  });
  revalidatePath("/dashboard/events");
}

export async function addTicket(data: { name: string; surname: string; eventId: string }) {
  const uniqueCode = Math.random().toString(36).substring(2, 10).toUpperCase(); // simple code
  await prisma.ticket.create({
    data: {
      name: data.name,
      surname: data.surname,
      code: uniqueCode,
      eventId: data.eventId,
    },
  });
  revalidatePath("/dashboard/tickets");
}
