// hooks/useTickets.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Ticket, CreateTicketData, UpdateTicketData } from "@/lib/types/tickets";

// Fetch all tickets with shorter stale time for real-time updates
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
    staleTime: 30 * 1000, // 30 seconds - refresh more frequently
    refetchInterval: 60 * 1000, // Auto-refetch every minute
    refetchOnWindowFocus: true, // Refetch when user returns to tab
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
    staleTime: 30 * 1000,
  });
}

// Check ticket by code with optimizations for scanning
export function useTicketByCode(code: string) {
  return useQuery<Ticket>({
    queryKey: ["tickets", "code", code],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/check/${code}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Ticket not found");
      }
      return res.json();
    },
    enabled: !!code && code.length >= 3,
    staleTime: 0, // Always fresh for scanner
    retry: 1, // Don't retry failed lookups too much
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
      
      // Invalidate and refetch tickets
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      
      // Optimistically add the new ticket to the cache
      queryClient.setQueryData<Ticket[]>(["tickets"], (old) => {
        if (!old) return [data];
        return [data, ...old];
      });
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
      
      // Update all related queries
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["tickets", data.id] });
      queryClient.invalidateQueries({ queryKey: ["tickets", "code", data.code] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      
      // Optimistically update the ticket in the list
      queryClient.setQueryData<Ticket[]>(["tickets"], (old) => {
        if (!old) return [data];
        return old.map(ticket => ticket.id === data.id ? data : ticket);
      });
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
    onSuccess: (_, deletedId) => {
      toast.success("✅ Ticket deleted successfully");
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      
      // Optimistically remove from cache
      queryClient.setQueryData<Ticket[]>(["tickets"], (old) => {
        if (!old) return [];
        return old.filter(ticket => ticket.id !== deletedId);
      });
      
      // Remove individual ticket query
      queryClient.removeQueries({ queryKey: ["tickets", deletedId] });
    },
    onError: (error) => {
      toast.error(`❌ ${error.message}`);
    },
  });
}

// Enhanced toggle ticket usage with optimistic updates
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
    // Optimistic updates for immediate UI feedback
    onMutate: async ({ id, used }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tickets"] });
      await queryClient.cancelQueries({ queryKey: ["tickets", id] });

      // Snapshot previous values
      const previousTickets = queryClient.getQueryData<Ticket[]>(["tickets"]);
      const previousTicket = queryClient.getQueryData<Ticket>(["tickets", id]);

      // Optimistically update tickets list
      queryClient.setQueryData<Ticket[]>(["tickets"], (old) => {
        if (!old) return [];
        return old.map(ticket => 
          ticket.id === id 
            ? { 
                ...ticket, 
                used, 
                usedAt: used ? new Date().toISOString() : null 
              }
            : ticket
        );
      });

      // Optimistically update individual ticket
      if (previousTicket) {
        queryClient.setQueryData<Ticket>(["tickets", id], {
          ...previousTicket,
          used,
          usedAt: used ? new Date().toISOString() : null
        });
      }

      // Return context for rollback
      return { previousTickets, previousTicket, id };
    },
    onSuccess: (data) => {
      // Update with server response
      queryClient.setQueryData<Ticket[]>(["tickets"], (old) => {
        if (!old) return [data];
        return old.map(ticket => ticket.id === data.id ? data : ticket);
      });
      
      // Update individual ticket cache
      queryClient.setQueryData<Ticket>(["tickets", data.id], data);
      
      // Update code-based cache if it exists
      queryClient.setQueryData<Ticket>(["tickets", "code", data.code], data);
      
      // Success message handled by caller for custom messages
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousTickets) {
        queryClient.setQueryData(["tickets"], context.previousTickets);
      }
      if (context?.previousTicket && context?.id) {
        queryClient.setQueryData(["tickets", context.id], context.previousTicket);
      }
      
      toast.error(`❌ ${error.message}`);
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

// Bulk operations hook for multiple tickets
export function useBulkTicketOperations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketIds, operation }: { 
      ticketIds: string[], 
      operation: { used?: boolean } 
    }) => {
      const results = await Promise.allSettled(
        ticketIds.map(id => 
          fetch(`/api/tickets/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(operation)
          }).then(res => res.json())
        )
      );

      const successful = results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value);

      const failed = results
        .filter(result => result.status === 'rejected')
        .length;

      return { successful, failed, total: ticketIds.length };
    },
    onSuccess: ({ successful, failed, total }) => {
      if (successful.length > 0) {
        toast.success(`✅ Updated ${successful.length} tickets successfully`);
      }
      if (failed > 0) {
        toast.error(`❌ Failed to update ${failed} tickets`);
      }
      
      // Refresh all ticket data
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (error) => {
      toast.error(`❌ Bulk operation failed: ${error.message}`);
    },
  });
}