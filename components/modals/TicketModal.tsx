// app/components/TicketModal.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, User, Calendar, Clock, X } from "lucide-react";

interface TicketModalProps {
  ticket: any;
  isLoading: boolean;
  error: any;
  activeCode: string;
  onClose: () => void;
  onMarkAsUsed: () => void;
  isMarkingAsUsed: boolean;
}

export default function TicketModal({ 
  ticket, 
  isLoading, 
  error, 
  activeCode, 
  onClose, 
  onMarkAsUsed, 
  isMarkingAsUsed 
}: TicketModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Ticket Information</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Searching for ticket...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-medium text-red-600 mb-2">Ticket Not Found</h3>
              <p className="text-gray-600">
                No ticket found with code: <span className="font-mono font-bold">{activeCode}</span>
              </p>
            </div>
          )}

          {ticket && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-semibold">
                  {ticket.name} {ticket.surname}
                </h3>
                <p className="text-gray-600 font-mono text-sm">Code: {ticket.code}</p>
                <div className="mt-3">
                  <Badge 
                    variant={ticket.used ? "default" : "secondary"}
                    className={`text-lg px-4 py-2 ${
                      ticket.used 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {ticket.used ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        USED
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        UNUSED
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Ticket Holder</span>
                  </div>
                  <p className="font-medium">{ticket.name} {ticket.surname}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Event</span>
                  </div>
                  <p className="font-medium">
                    {ticket.event?.name || "No Event Assigned"}
                  </p>
                </div>

                {ticket.used && ticket.usedAt && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Used At</span>
                    </div>
                    <p className="font-medium">
                      {new Date(ticket.usedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {!ticket.used && (
                <div className="pt-4">
                  <Button
                    onClick={onMarkAsUsed}
                    disabled={isMarkingAsUsed}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {isMarkingAsUsed ? (
                      "Marking as Used..."
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Mark Ticket as Used
                      </>
                    )}
                  </Button>
                </div>
              )}

              {ticket.used && (
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="text-green-800 font-medium">
                    This ticket has already been used
                  </p>
                  {ticket.usedAt && (
                    <p className="text-green-600 text-sm mt-1">
                      Used on {new Date(ticket.usedAt).toLocaleDateString()} at{' '}
                      {new Date(ticket.usedAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}