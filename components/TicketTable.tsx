// app/components/TicketsTable.tsx
"use client";

import { useState, useEffect } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MoreHorizontal, 
  Ticket, 
  CheckCircle, 
  XCircle, 
  QrCode, 
  Copy, 
  Search,
  Filter,
  RefreshCw,
  Zap,
  Clock,
  TrendingUp
} from "lucide-react";
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
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const svg = document.querySelector('#qr-code-svg');
                if (svg) {
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
  const { data: tickets = [], isLoading, error, refetch } = useTickets();
  const deleteTicketMutation = useDeleteTicket();
  const toggleUsageMutation = useToggleTicketUsage();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "used" | "unused">("all");
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());

  // Track recently updated tickets for visual feedback
  useEffect(() => {
    const updatedTickets = new Set<string>();
    tickets.forEach(ticket => {
      if (ticket.usedAt) {
        const usedTime = new Date(ticket.usedAt).getTime();
        const now = new Date().getTime();
        const fiveMinutesAgo = now - (5 * 60 * 1000); // 5 minutes
        
        if (usedTime > fiveMinutesAgo) {
          updatedTickets.add(ticket.id);
        }
      }
    });
    setRecentlyUpdated(updatedTickets);
  }, [tickets]);

  // Filter tickets based on search and status
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !searchTerm || 
      ticket.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.event?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "used" && ticket.used) ||
      (statusFilter === "unused" && !ticket.used);

    return matchesSearch && matchesStatus;
  });

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
      toast.info("Edit functionality not implemented yet");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Ticket code copied to clipboard!");
  };

  const usedCount = tickets.filter(t => t.used).length;
  const unusedCount = tickets.filter(t => !t.used).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading tickets...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <p>Error loading tickets. Please try again.</p>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="ml-2">
          <RefreshCw className="w-4 h-4 mr-1" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Used: {usedCount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span>Unused: {unusedCount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <TrendingUp className="w-3 h-3" />
            <span>Total: {tickets.length}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search tickets (code, name, event)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="used">Used Only</SelectItem>
            <SelectItem value="unused">Unused Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Summary */}
      {searchTerm || statusFilter !== "all" ? (
        <p className="text-sm text-gray-600">
          Showing {filteredTickets.length} of {tickets.length} tickets
          {searchTerm && <span> matching "{searchTerm}"</span>}
          {statusFilter !== "all" && <span> (status: {statusFilter})</span>}
        </p>
      ) : null}

      {filteredTickets.length === 0 && tickets.length > 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <Search className="h-8 w-8 mb-2 opacity-50" />
          <p>No tickets match your search criteria</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}
            className="mt-2"
          >
            Clear Filters
          </Button>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Ticket className="h-12 w-12 mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Tickets Yet</h3>
          <p className="text-sm">Create your first ticket to get started.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Surname</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Used At</TableHead>
                <TableHead className="text-center">QR Code</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket: TicketType) => {
                const isRecentlyUpdated = recentlyUpdated.has(ticket.id);
                
                return (
                  <TableRow 
                    key={ticket.id}
                    className={isRecentlyUpdated ? "bg-green-50 border-green-200" : ""}
                  >
                    <TableCell className="font-mono font-medium">
                      <div className="flex items-center gap-2">
                        <span>{ticket.code}</span>
                        {isRecentlyUpdated && (
                          <Zap className="w-3 h-3 text-green-600" title="Recently updated" />
                        )}
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
                    <TableCell className="text-center text-sm">
                      {ticket.used && ticket.usedAt ? (
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{new Date(ticket.usedAt).toLocaleDateString()}</span>
                          <span className="text-gray-400">
                            {new Date(ticket.usedAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
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
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}