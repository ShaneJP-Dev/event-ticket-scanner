// app/components/modals/TicketModal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  User, 
  Calendar, 
  Hash, 
  Clock,
  Zap,
  Search,
  Loader2
} from "lucide-react";
import type { Ticket } from "@/lib/types/tickets";

interface TicketModalProps {
  ticket?: Ticket;
  isLoading: boolean;
  error?: any;
  activeCode: string;
  onClose: () => void;
  onMarkAsUsed: () => void;
  onMarkAsUnused?: () => void;
  isMarkingAsUsed: boolean;
  isScanned?: boolean;
  autoProcessed?: boolean;
}

export default function TicketModal({
  ticket,
  isLoading,
  error,
  activeCode,
  onClose,
  onMarkAsUsed,
  onMarkAsUnused,
  isMarkingAsUsed,
  isScanned = false,
  autoProcessed = false
}: TicketModalProps) {
  
  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {isScanned ? "Processing Scanned Ticket..." : "Searching Ticket..."}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">
                {isScanned ? "Auto-processing ticket..." : `Looking up ticket ${activeCode}...`}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !ticket) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Ticket Not Found
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No ticket found
              </h3>
              <p className="text-gray-600 mb-1">
                Ticket code: <span className="font-mono font-bold">{activeCode}</span>
              </p>
              <p className="text-sm text-gray-500">
                Please check the code and try again
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={onClose} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isTicketUsed = ticket.used;
  const wasAutoProcessed = isScanned && isTicketUsed;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {wasAutoProcessed ? (
              <>
                <Zap className="w-5 h-5 text-green-600" />
                <span className="text-green-600">Auto-Processed</span>
              </>
            ) : isScanned ? (
              <>
                <Zap className="w-5 h-5 text-blue-600" />
                Scanned Ticket
              </>
            ) : (
              <>
                <Search className="w-5 h-5 text-gray-600" />
                Manual Search
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Auto-processing success banner */}
          {wasAutoProcessed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Successfully Processed!</h4>
                  <p className="text-sm text-green-700 mt-1">
                    This ticket has been automatically marked as used.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Already used warning */}
          {isScanned && isTicketUsed && !wasAutoProcessed && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Ticket Already Used</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This ticket was previously scanned and marked as used.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ticket Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            {/* Status Badge */}
            <div className="flex justify-between items-start">
              <Badge 
                variant={isTicketUsed ? "default" : "secondary"}
                className={`${isTicketUsed 
                  ? "bg-green-100 text-green-800 border-green-200" 
                  : "bg-gray-100 text-gray-800 border-gray-200"
                } text-sm px-3 py-1`}
              >
                {isTicketUsed ? (
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
              
              {isScanned && (
                <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  <Zap className="w-3 h-3" />
                  Scanned
                </div>
              )}
            </div>

            {/* Ticket Details */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3">
                <Hash className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Ticket Code</p>
                  <p className="font-mono font-bold text-lg">{ticket.code}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Attendee</p>
                  <p className="font-medium">{ticket.name} {ticket.surname}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Event</p>
                  <p className="font-medium">
                    {ticket.event?.name || (
                      <span className="text-gray-400 italic">No Event Assigned</span>
                    )}
                  </p>
                </div>
              </div>

              {isTicketUsed && ticket.usedAt && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Used At</p>
                    <p className="font-medium text-sm">
                      {new Date(ticket.usedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="flex-1"
            >
              Close
            </Button>
            
            {/* Show different actions based on ticket status and context */}
            {!isTicketUsed && !wasAutoProcessed && (
              <Button 
                onClick={onMarkAsUsed}
                disabled={isMarkingAsUsed}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isMarkingAsUsed ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Marking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Used
                  </>
                )}
              </Button>
            )}
            
            {isTicketUsed && onMarkAsUnused && (
              <Button 
                onClick={onMarkAsUnused}
                disabled={isMarkingAsUsed}
                variant="outline"
                className="flex-1 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                {isMarkingAsUsed ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Mark as Unused
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Processing method indicator */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              {isScanned ? (
                <>
                  <Zap className="w-3 h-3 inline mr-1" />
                  Processed via QR Scanner
                </>
              ) : (
                <>
                  <Search className="w-3 h-3 inline mr-1" />
                  Processed via Manual Search
                </>
              )}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}