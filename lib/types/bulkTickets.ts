// lib/type/bulkTickets.ts
interface BulkTicketData {
  name: string;
  surname: string;
  email?: string;
  code: string;
  used?: boolean;
  eventId?: string;
}

interface BulkCreateResponse {
  success: boolean;
  created: number;
  failed: number;
  tickets: Array<{
    id: string;
    code: string;
    name: string;
    surname: string;
    email?: string;
    used: boolean;
    eventId?: string;
    createdAt: string;
  }>;
  errors?: Array<{
    index: number;
    error: string;
    data: BulkTicketData;
  }>;
}