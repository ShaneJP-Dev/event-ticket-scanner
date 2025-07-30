// hooks/useTickets.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Ticket, CreateTicketData, UpdateTicketData } from "@/lib/types/tickets";

// Fetch all tickets
export function useTickets() {
  return useQuery<Ticket[]>({
    queryKey: ["tickets"],
    queryFn: async () => {
      const res = await fetch("/api/tickets");
      if (!res.ok) {
        throw new Error("Failed to fetch tickets");
      }
      return res.json();
    },
  });
}

// Fetch single ticket
export function useTicket(id: string) {
  return useQuery<Ticket>({
    queryKey: ["tickets", id],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch ticket");
      }
      return res.json();
    },
    enabled: !!id,
  });
}

// Check ticket by code
export function useTicketByCode(code: string) {
  return useQuery<Ticket>({
    queryKey: ["tickets", "code", code],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/check/${code}`);
      if (!res.ok) {
        throw new Error("Ticket not found");
      }
      return res.json();
    },
    enabled: !!code && code.length >= 3,
  });
}

// Create ticket mutation
export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTicketData) => {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create ticket");
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`✅ Ticket created successfully (Code: ${data.code})`);
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["events"] }); // Update event ticket counts
    },
    onError: (error) => {
      toast.error(`❌ ${error.message}`);
    },
  });
}

// Update ticket mutation
export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTicketData }) => {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update ticket");
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast.success("✅ Ticket updated successfully");
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["tickets", data.id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error) => {
      toast.error(`❌ ${error.message}`);
    },
  });
}

// Delete ticket mutation
export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete ticket");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("✅ Ticket deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["events"] }); // Update event ticket counts
    },
    onError: (error) => {
      toast.error(`❌ ${error.message}`);
    },
  });
}

// Mark ticket as used/unused
export function useToggleTicketUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, used }: { id: string; used: boolean }) => {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ used }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update ticket status");
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`✅ Ticket ${data.used ? 'marked as used' : 'marked as unused'}`);
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["tickets", data.id] });
    },
    onError: (error) => {
      toast.error(`❌ ${error.message}`);
    },
  });
}