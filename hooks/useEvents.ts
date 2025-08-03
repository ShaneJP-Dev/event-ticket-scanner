// hooks/useEvents.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Event, CreateEventData, UpdateEventData } from "@/lib/types/event";

// Fetch all events
export function useEvents() {
  return useQuery<Event[], Error>({
    queryKey: ["events"],
    queryFn: async (): Promise<Event[]> => {
      const res = await fetch("/api/events");
      if (!res.ok) {
        throw new Error("Failed to fetch events");
      }
      return res.json();
    },
  });
}

// Fetch single event
export function useEvent(id: string) {
  return useQuery<Event, Error>({
    queryKey: ["events", id],
    queryFn: async (): Promise<Event> => {
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch event");
      }
      return res.json();
    },
    enabled: !!id,
  });
}

// Create event mutation
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation<Event, Error, CreateEventData>({
    mutationFn: async (data: CreateEventData): Promise<Event> => {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create event");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("✅ Event created successfully");
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error: Error) => {
      toast.error(`❌ ${error.message}`);
    },
  });
}

// Update event mutation
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation<Event, Error, { id: string; data: UpdateEventData }>({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEventData }): Promise<Event> => {
      const res = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update event");
      }

      return res.json();
    },
    onSuccess: (data: Event) => {
      toast.success("✅ Event updated successfully");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events", data.id] });
    },
    onError: (error: Error) => {
      toast.error(`❌ ${error.message}`);
    },
  });
}

// Delete event mutation
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete event");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("✅ Event deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error: Error) => {
      toast.error(`❌ ${error.message}`);
    },
  });
}