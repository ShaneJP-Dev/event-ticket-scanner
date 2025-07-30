// app/components/forms/AddTicketForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTicket } from "@/hooks/useTickets";
import { useEvents } from "@/hooks/useEvents";
import { User, Users } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  surname: z.string().min(2, "Surname must be at least 2 characters"),
  eventId: z.string().min(1, "Please select an event"),
});

type FormData = z.infer<typeof schema>;

interface AddTicketFormProps {
  onSuccess?: () => void;
}

export default function AddTicketForm({ onSuccess }: AddTicketFormProps) {
  const createTicketMutation = useCreateTicket();
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      surname: "",
      eventId: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createTicketMutation.mutateAsync(data);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          First Name
        </Label>
        <div className="relative">
          <Input
            id="name"
            placeholder="Enter first name"
            {...form.register("name")}
            className={form.formState.errors.name ? "border-red-500" : ""}
          />
          <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="surname" className="text-sm font-medium">
          Last Name
        </Label>
        <div className="relative">
          <Input
            id="surname"
            placeholder="Enter last name"
            {...form.register("surname")}
            className={form.formState.errors.surname ? "border-red-500" : ""}
          />
          <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {form.formState.errors.surname && (
          <p className="text-sm text-red-500">
            {form.formState.errors.surname.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventId" className="text-sm font-medium">
          Event
        </Label>
        <Select
          value={form.watch("eventId")}
          onValueChange={(value) => form.setValue("eventId", value)}
        >
          <SelectTrigger className={form.formState.errors.eventId ? "border-red-500" : ""}>
            <SelectValue placeholder={eventsLoading ? "Loading events..." : "Select an event"} />
          </SelectTrigger>
          <SelectContent>
            {events.length === 0 && !eventsLoading ? (
              <SelectItem value="" disabled>
                No events available
              </SelectItem>
            ) : (
              events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {form.formState.errors.eventId && (
          <p className="text-sm text-red-500">
            {form.formState.errors.eventId.message}
          </p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={createTicketMutation.isPending || eventsLoading || events.length === 0}
      >
        {createTicketMutation.isPending ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Creating Ticket...
          </>
        ) : (
          "Create Ticket"
        )}
      </Button>

      {events.length === 0 && !eventsLoading && (
        <p className="text-sm text-amber-600 text-center">
          ⚠️ You need to create an event first before adding tickets.
        </p>
      )}
    </form>
  );
}
