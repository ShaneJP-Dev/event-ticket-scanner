// app/components/TicketTable.tsx
"use client";

import { useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Ticket, Users, CheckCircle, XCircle, QrCode, Eye, Copy } from "lucide-react";
import { useTickets, useDeleteTicket, useToggleTicketUsage } from "@/hooks/useTickets";
import type { Ticket as TicketType } from "@/lib/types/tickets";
import QRCode from "react-qr-code";
import { toast } from "sonner";

interface TicketsTableProps {
  onEditTicket?: (ticket: TicketType) => void;
}

function TicketQRDialog({ ticket }: { ticket: TicketType }) {
  const [isOpen, setIsOpen] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <QrCode className="w-4 h-4" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ticket QR Code</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* QR Code */}
          <div className="flex justify-center p-4 bg-white rounded-lg border">
            <QRCode 
              value={ticket.code} 
              size={200}
              level="M"
              //includeMargin={true}
            />
          </div>
          
          {/* Ticket Details */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Ticket Code:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold">{ticket.code}</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => copyToClipboard(ticket.code)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Name:</span>
              <span className="font-medium">{ticket.name} {ticket.surname}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Event:</span>
              <span className="font-medium">
                {ticket.event?.name || "No Event"}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Status:</span>
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
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={() => copyToClipboard(ticket.code)}
              variant="outline"
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Code
            </Button>
            <Button 
              onClick={() => {
                // Create a canvas to convert QR code to image
                const svg = document.querySelector('svg');
                if (svg) {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const data = new XMLSerializer().serializeToString(svg);
                  const img = new Image();
                  img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx?.drawImage(img, 0, 0);
                    const url = canvas.toDataURL();
                    const a = document.createElement('a');
                    a.download = `ticket-${ticket.code}.png`;
                    a.href = url;
                    a.click();
                  };
                  img.src = 'data:image/svg+xml;base64,' + btoa(data);
                }
              }}
              variant="outline"
              className="flex-1"
            >
              Download QR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Ticket code copied to clipboard!");
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
            <TableHead className="text-center">QR Code</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket: TicketType) => (
            <TableRow key={ticket.id}>
              <TableCell className="font-mono font-medium">
                <div className="flex items-center gap-2">
                  <span>{ticket.code}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard(ticket.code)}
                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
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
              <TableCell className="text-center">
                <TicketQRDialog ticket={ticket} />
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
                    <DropdownMenuItem onClick={() => copyToClipboard(ticket.code)}>
                      Copy Ticket Code
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