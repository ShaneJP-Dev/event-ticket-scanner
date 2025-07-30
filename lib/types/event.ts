// lib/types/event.ts
export interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  date: string; // Formatted date range for display
  ticketCount: number;
  createdAt: string;
}

export interface CreateEventData {
  name: string;
  startDate: string;
  endDate: string;
}

export interface UpdateEventData {
  name?: string;
  startDate?: string;
  endDate?: string;
}