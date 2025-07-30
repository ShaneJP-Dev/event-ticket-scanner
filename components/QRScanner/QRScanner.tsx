// app/components/QRScanner.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Camera, Search } from "lucide-react";
import { useTicketByCode, useToggleTicketUsage } from "@/hooks/useTickets";
import { toast } from "sonner";
import QRScannerComponent from "./CameraQRScanner";
import ManualSearchComponent from "./ManualSearch";
import TicketModal from "../modals/TicketModal";



export default function WorkingQRScanner() {
  const [manualCode, setManualCode] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [searchCode, setSearchCode] = useState("");
  const [showModal, setShowModal] = useState(false);
  
  const toggleUsageMutation = useToggleTicketUsage();
  
  // Use the code from either manual input or scanned QR
  const activeCode = searchCode || scannedCode;
  const { data: ticket, isLoading, error } = useTicketByCode(activeCode);

  // Show modal when ticket is found or error occurs
  useEffect(() => {
    if (activeCode && (ticket || error)) {
      setShowModal(true);
    }
  }, [activeCode, ticket, error]);

  const handleManualSearch = () => {
    if (manualCode.trim()) {
      setSearchCode(manualCode.trim().toUpperCase());
      setScannedCode("");
    }
  };

  const handleQRScan = (code: string) => {
    setScannedCode(code.toUpperCase());
    setSearchCode("");
    setManualCode("");
    // Stop camera after scan
    setIsCameraActive(false);
  };

  const handleMarkAsUsed = () => {
    if (ticket && !ticket.used) {
      toggleUsageMutation.mutate({
        id: ticket.id,
        used: true
      }, {
        onSuccess: () => {
          toast.success("Ticket marked as used!");
          // Auto-dismiss modal after marking as used
          setTimeout(() => {
            handleCloseModal();
          }, 1500); // Wait 1.5 seconds to show success message
        }
      });
    }
  };

  const handleClearSearch = () => {
    setSearchCode("");
    setScannedCode("");
    setManualCode("");
    setShowModal(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    handleClearSearch();
  };

  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Ticket Scanner</h1>
        <p className="text-gray-600">Scan QR codes or enter ticket codes manually</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              QR Code Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QRScannerComponent
              onScan={handleQRScan} 
              isActive={isCameraActive}
              onToggleCamera={toggleCamera}
            />
          </CardContent>
        </Card>

        {/* Manual Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Manual Search
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
          </CardContent>
        </Card>
      </div>

      {/* Modal for Ticket Results */}
      {showModal && (
        <TicketModal
          ticket={ticket}
          isLoading={isLoading}
          error={error}
          activeCode={activeCode}
          onClose={handleCloseModal}
          onMarkAsUsed={handleMarkAsUsed}
          isMarkingAsUsed={toggleUsageMutation.isPending}
        />
      )}
    </div>
  );
}