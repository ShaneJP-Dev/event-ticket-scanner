// lib/types/ticket.ts
export interface Ticket {
  id: string;
  code: string;
  name: string;
  surname: string;
  used: boolean;
  usedAt: string | null;
  eventId: string | null;
  event?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
  createdAt: string;
}

export interface CreateTicketData {
  name: string;
  surname: string;
  eventId: string;
}

export interface UpdateTicketData {
  name?: string;
  surname?: string;
  eventId?: string;
  used?: boolean;
}