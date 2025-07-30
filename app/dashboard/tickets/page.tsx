// app/tickets/page.tsx

import AddTicketModal from "@/components/modals/AddTicketModal";
import TicketsTable from "@/components/TicketTable";

export default function TicketsPage() {
  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <AddTicketModal />
      </div>
      <TicketsTable />
    </main>
  );
}
