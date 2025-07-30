// app/components/modals/AddTicketModal.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AddTicketForm from "@/components/forms/AddTicketForm";

export default function AddTicketModal() {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
          <DialogDescription>
            Create a new ticket for an attendee. A unique ticket code will be generated automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <AddTicketForm onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}