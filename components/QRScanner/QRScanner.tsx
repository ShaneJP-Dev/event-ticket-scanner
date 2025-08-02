// app/components/QRScanner.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Camera, Search, CheckCircle, AlertCircle } from "lucide-react";
import { useTicketByCode, useToggleTicketUsage } from "@/hooks/useTickets";
import { toast } from "sonner";
import QRScannerComponent from "./CameraQRScanner";
import ManualSearchComponent from "./ManualSearch";
import TicketModal from "../modals/TicketModal";

export default function WorkingQRScanner() {
  const [manualCode, setManualCode] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [searchCode, setSearchCode] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [autoProcessing, setAutoProcessing] = useState(false);
  const [isScannerPaused, setIsScannerPaused] = useState(false);
  
  const toggleUsageMutation = useToggleTicketUsage();
  
  // Use the code from either manual input or scanned QR
  const activeCode = searchCode || scannedCode;
  const { data: ticket, isLoading, error } = useTicketByCode(activeCode);

  // Auto-process scanned tickets (mark as used automatically)
  useEffect(() => {
    if (scannedCode && ticket && !ticket.used && !autoProcessing) {
      setAutoProcessing(true);
      
      // Automatically mark scanned tickets as used
      toggleUsageMutation.mutate({
        id: ticket.id,
        used: true
      }, {
        onSuccess: () => {
          toast.success(`✅ Ticket ${ticket.code} automatically marked as used!`, {
            description: `${ticket.name} ${ticket.surname} - ${ticket.event?.name || 'No Event'}`
          });
          
          // Show success modal briefly, then auto-close
          setShowModal(true);
          setTimeout(() => {
            handleCloseModal();
          }, 10000); // Auto-close after 10 seconds
        },
        onError: (error) => {
          toast.error(`❌ Failed to process ticket: ${error.message}`);
          setShowModal(true); // Show modal for manual processing
          setAutoProcessing(false);
        },
        onSettled: () => {
          setAutoProcessing(false);
        }
      });
    } else if (scannedCode && ticket && ticket.used) {
      // Ticket already used - show warning
      toast.warning(`⚠️ Ticket ${ticket.code} is already used!`, {
        description: `${ticket.name} ${ticket.surname} - Used on ${ticket.usedAt ? new Date(ticket.usedAt).toLocaleString() : 'Unknown date'}`
      });
      setShowModal(true);
    } else if (scannedCode && error) {
      // Ticket not found
      toast.error(`❌ Ticket ${scannedCode} not found!`);
      setShowModal(true);
    }
  }, [scannedCode, ticket, error, autoProcessing, toggleUsageMutation]);

  // Show modal for manual searches or errors
  useEffect(() => {
    if (searchCode && (ticket || error)) {
      setShowModal(true);
    }
  }, [searchCode, ticket, error]);

  const handleManualSearch = () => {
    if (manualCode.trim()) {
      setSearchCode(manualCode.trim().toUpperCase());
      setScannedCode("");
    }
  };

 const handleQRScan = (code: string) => {
  if (isScannerPaused) return;
  
  const upperCode = code.toUpperCase();
  console.log('QR Code scanned:', upperCode);
  
  setIsScannerPaused(true); // Pause scanner
  setSearchCode("");
  setManualCode("");
  setShowModal(false);
  setAutoProcessing(false);
  setScannedCode(upperCode);
};

  const handleMarkAsUsed = () => {
    if (ticket && !ticket.used) {
      toggleUsageMutation.mutate({
        id: ticket.id,
        used: true
      }, {
        onSuccess: () => {
          toast.success("✅ Ticket marked as used!");
          setTimeout(() => {
            handleCloseModal();
          }, 10000); // Auto-close after 10 seconds
        }
      });
    }
  };

  const handleMarkAsUnused = () => {
    if (ticket && ticket.used) {
      toggleUsageMutation.mutate({
        id: ticket.id,
        used: false
      }, {
        onSuccess: () => {
          toast.success("✅ Ticket marked as unused!");
          setTimeout(() => {
            handleCloseModal();
          }, 1500);
        }
      });
    }
  };

  const handleClearSearch = () => {
    setSearchCode("");
    setScannedCode("");
    setManualCode("");
    setShowModal(false);
    setAutoProcessing(false);
  };

const handleCloseModal = () => {
  setShowModal(false);
  setSearchCode("");
  setScannedCode("");
  setManualCode("");
  setAutoProcessing(false);
  setIsScannerPaused(false); // Resume scanner
  setIsCameraActive(true);
};

  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Ticket Scanner</h1>
        <p className="text-gray-600">Scan QR codes for automatic processing or search manually</p>
        
        {/* Auto-processing indicator */}
        {autoProcessing && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            Auto-processing ticket...
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              QR Code Scanner
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-2">
                Continuous Scan
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QRScannerComponent
              onScan={handleQRScan} 
              isActive={isCameraActive}
              onToggleCamera={toggleCamera}
              paused={isScannerPaused} 
            />
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">Continuous Scanning Mode</p>
                  <p className="text-xs mt-1">Camera stays active for multiple scans. Tickets auto-process in 10 seconds.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Manual Search
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full ml-2">
                Manual
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ManualSearchComponent
              manualCode={manualCode}
              setManualCode={setManualCode}
              onSearch={handleManualSearch}
              activeCode={activeCode}
              scannedCode={scannedCode}
              showModal={showModal}
              onClearSearch={handleClearSearch}
            />
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Manual Processing</p>
                  <p className="text-xs mt-1">Requires manual confirmation to mark as used</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Modal for Ticket Results */}
      {showModal && (
        <TicketModal
          ticket={ticket}
          isLoading={isLoading || autoProcessing}
          error={error}
          activeCode={activeCode}
          onClose={handleCloseModal}
          onMarkAsUsed={handleMarkAsUsed}
          onMarkAsUnused={handleMarkAsUnused}
          isMarkingAsUsed={toggleUsageMutation.isPending}
          isScanned={!!scannedCode}
          autoProcessed={scannedCode && ticket?.used}
        />
      )}
    </div>
  );
}