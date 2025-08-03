"use client";

import React, { useState, useMemo } from "react";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { MoreHorizontal, Calendar, Users, Search } from "lucide-react";
import { useEvents, useDeleteEvent } from "@/hooks/useEvents";
import type { Event } from "@/lib/types/event";
import { format } from "date-fns";


interface EventsTableProps {
  onEditEvent?: (event: Event) => void;
}

export default function EventsTable({ onEditEvent }: EventsTableProps) {
  const { data: events = [], isLoading, error } = useEvents();
  const deleteEventMutation = useDeleteEvent();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Filtered & paginated events
  const filteredEvents = useMemo(() => {
    return events.filter(event =>
      event.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [events, search]);

  const totalPages = Math.ceil(filteredEvents.length / perPage);

  const paginatedEvents = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredEvents.slice(start, start + perPage);
  }, [filteredEvents, page]);

  const handleDelete = (event: Event) => {
    if (event.ticketCount > 0) {
      alert(`Cannot delete "${event.name}" because it has ${event.ticketCount} ticket(s). Please remove all tickets first.`);
      return;
    }
    if (confirm(`Are you sure you want to delete "${event.name}"?`)) {
      deleteEventMutation.mutate(event.id);
    }
  };

  const handleEdit = (event: Event) => {
    if (onEditEvent) {
      onEditEvent(event);
    } else {
      alert("Edit functionality not implemented yet");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading events...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <p>Error loading events. Please try again.</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Calendar className="h-12 w-12 mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Events Yet</h3>
        <p className="text-sm">Create your first event to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Date Range</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Tickets</span>
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.name}</TableCell>
                <TableCell className="text-gray-600">
  {format(new Date(event.startDate), "MMM d, yyyy")} - {format(new Date(event.endDate), "MMM d, yyyy")}
</TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {event.ticketCount}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={deleteEventMutation.isPending}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(event)}>
                        Edit Event
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(event)}
                        className="text-red-600 focus:text-red-600"
                        disabled={deleteEventMutation.isPending}
                      >
                        {deleteEventMutation.isPending ? "Deleting..." : "Delete Event"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                <PaginationPrevious className="h-4 w-4 mr-1" /> Previous
              </Button>
            </PaginationItem>
            <PaginationItem className="flex items-center px-2 text-sm text-gray-600">
              Page {page} of {totalPages}
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
              >
                Next <PaginationNext className="h-4 w-4 ml-1" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
