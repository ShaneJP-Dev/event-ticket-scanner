// app/components/TicketTable.tsx
"use client";

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Ticket, Users, CheckCircle, XCircle } from "lucide-react";
import { useTickets, useDeleteTicket, useToggleTicketUsage } from "@/hooks/useTickets";
import type { Ticket as TicketType } from "@/lib/types/tickets";

interface TicketsTableProps {
  onEditTicket?: (ticket: TicketType) => void;
}

export default function TicketsTable({ onEditTicket }: TicketsTableProps) {
  const { data: tickets = [], isLoading, error } = useTickets();
  const deleteTicketMutation = useDeleteTicket();
  const toggleUsageMutation = useToggleTicketUsage();

  const handleDelete = (ticket: TicketType) => {
    if (confirm(`Are you sure you want to delete the ticket for "${ticket.name} ${ticket.surname}"?`)) {
      deleteTicketMutation.mutate(ticket.id);
    }
  };

  const handleToggleUsage = (ticket: TicketType) => {
    toggleUsageMutation.mutate({
      id: ticket.id,
      used: !ticket.used
    });
  };

  const handleEdit = (ticket: TicketType) => {
    if (onEditTicket) {
      onEditTicket(ticket);
    } else {
      alert("Edit functionality not implemented yet");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading tickets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <p>Error loading tickets. Please try again.</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Ticket className="h-12 w-12 mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Tickets Yet</h3>
        <p className="text-sm">Create your first ticket to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Surname</TableHead>
            <TableHead>Event</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket: TicketType) => (
            <TableRow key={ticket.id}>
              <TableCell className="font-mono font-medium">
                {ticket.code}
              </TableCell>
              <TableCell>{ticket.name}</TableCell>
              <TableCell>{ticket.surname}</TableCell>
              <TableCell>
                {ticket.event?.name ?? <span className="text-gray-400">No Event</span>}
              </TableCell>
              <TableCell className="text-center">
                <Badge 
                  variant={ticket.used ? "default" : "secondary"}
                  className={ticket.used ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                >
                  {ticket.used ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Used
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Unused
                    </>
                  )}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      disabled={deleteTicketMutation.isPending || toggleUsageMutation.isPending}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(ticket)}>
                      Edit Ticket
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleUsage(ticket)}>
                      Mark as {ticket.used ? 'Unused' : 'Used'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(ticket)}
                      className="text-red-600 focus:text-red-600"
                      disabled={deleteTicketMutation.isPending}
                    >
                      {deleteTicketMutation.isPending ? "Deleting..." : "Delete Ticket"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}