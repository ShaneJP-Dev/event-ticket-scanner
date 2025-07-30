"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCreateEvent } from "@/hooks/useEvents";
import { CalendarDays } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Event name must be at least 2 characters"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start < end;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type FormData = z.infer<typeof schema>;

interface AddEventFormProps {
  onSuccess?: () => void;
}

export default function AddEventForm({ onSuccess }: AddEventFormProps) {
  const createEventMutation = useCreateEvent();
  
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createEventMutation.mutateAsync(data);
      form.reset();
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the hook
      console.error("Form submission error:", error);
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Event Name
        </Label>
        <Input
          id="name"
          placeholder="Enter event name"
          {...form.register("name")}
          className={form.formState.errors.name ? "border-red-500" : ""}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate" className="text-sm font-medium">
          Start Date
        </Label>
        <div className="relative">
          <Input
            id="startDate"
            type="date"
            min={today}
            {...form.register("startDate")}
            className={form.formState.errors.startDate ? "border-red-500" : ""}
          />
          <CalendarDays className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {form.formState.errors.startDate && (
          <p className="text-sm text-red-500">
            {form.formState.errors.startDate.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="endDate" className="text-sm font-medium">
          End Date
        </Label>
        <div className="relative">
          <Input
            id="endDate"
            type="date"
            min={form.watch("startDate") || today}
            {...form.register("endDate")}
            className={form.formState.errors.endDate ? "border-red-500" : ""}
          />
          <CalendarDays className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {form.formState.errors.endDate && (
          <p className="text-sm text-red-500">
            {form.formState.errors.endDate.message}
          </p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={createEventMutation.isPending}
      >
        {createEventMutation.isPending ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Creating Event...
          </>
        ) : (
          "Create Event"
        )}
      </Button>
    </form>
  );
}