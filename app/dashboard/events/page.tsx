// app/events/page.tsx

import EventsTable from "@/components/EventTable";
import AddEventModal from "@/components/modals/AddEventModal";

export default function EventsPage() {
  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Events</h1>
        <AddEventModal />
      </div>
      <EventsTable />
    </main>
  );
}
