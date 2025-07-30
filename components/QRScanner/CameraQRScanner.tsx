"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Dynamic import for QrScanner
let QrScanner: any = null;

interface QRScannerComponentProps {
  onScan: (code: string) => void;
  isActive: boolean;
  onToggleCamera: () => void;
}

export default function QRScannerComponent({ onScan, isActive, onToggleCamera }: QRScannerComponentProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load QR Scanner library
  useEffect(() => {
    const loadQrScanner = async () => {
      try {
        const QrScannerModule = await import('qr-scanner');
        QrScanner = QrScannerModule.default;
        
        // Set worker path
        QrScanner.WORKER_PATH = 'https://cdnjs.cloudflare.com/ajax/libs/qr-scanner/1.4.2/qr-scanner-worker.min.js';
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load QR Scanner:', err);
        setError('Failed to load QR scanning library');
        setIsLoading(false);
      }
    };

    loadQrScanner();
  }, []);

  // Initialize scanner
  useEffect(() => {
    if (!QrScanner || !videoRef.current || scanner) return;

    const initScanner = async () => {
      try {
        const newScanner = new QrScanner(
          videoRef.current,
          (result: any) => {
            console.log('QR Code detected:', result.data);
            onScan(result.data);
            // Stop scanning after successful scan
            newScanner.stop();
            setIsScanning(false);
            toast.success(`QR Code scanned: ${result.data}`);
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            returnDetailedScanResult: true,
          }
        );

        setScanner(newScanner);

        // Auto-select back camera
        try {
          const availableCameras = await QrScanner.listCameras();
          
          // Prefer environment camera (back camera)
          const backCamera = availableCameras.find((camera: any) => 
            camera.label.toLowerCase().includes('back') || 
            camera.label.toLowerCase().includes('environment') ||
            camera.label.toLowerCase().includes('rear')
          );
          
          const preferredCamera = backCamera || availableCameras[0];
          if (preferredCamera) {
            await newScanner.setCamera(preferredCamera.id);
          }
        } catch (err) {
          console.warn('Could not list cameras:', err);
        }

      } catch (err) {
        console.error('Failed to initialize scanner:', err);
        setError('Failed to initialize camera scanner');
      }
    };

    initScanner();

    return () => {
      if (scanner) {
        scanner.destroy();
      }
    };
  }, [QrScanner, videoRef.current]);

  const startScanning = async () => {
    if (!scanner) {
      setError('Scanner not initialized');
      return;
    }

    try {
      setError('');
      await scanner.start();
      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start scanning:', err);
      setError(`Failed to start camera: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.stop();
      setIsScanning(false);
      setError('');
    }
  };

  useEffect(() => {
    if (isActive && !isScanning && scanner) {
      startScanning();
    } else if (!isActive && isScanning) {
      stopScanning();
    }
  }, [isActive, scanner]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="w-full">
          <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p>Loading scanner...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="w-full">
          <div className="h-[400px] bg-red-50 rounded-lg flex items-center justify-center border-2 border-red-200">
            <div className="text-center text-red-600 p-4">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Scanner Error</p>
              <p className="text-xs mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => {
                  setError('');
                  if (isActive && scanner) startScanning();
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="w-full">
        <div className="relative w-full">
          <video
            ref={videoRef}
            className="w-full rounded-lg bg-black object-cover"
            style={{ 
              height: '400px',
              width: '100%'
            }}
            playsInline
            muted
          />
          
          {!scanner && (
            <div className="absolute inset-0 w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Initializing camera...</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Button 
        onClick={onToggleCamera}
        variant={isActive ? "destructive" : "default"}
        className="w-full"
      >
        {isActive ? (
          <>
            <CameraOff className="w-4 h-4 mr-2" />
            Stop Camera
          </>
        ) : (
          <>
            <Camera className="w-4 h-4 mr-2" />
            Start Camera
          </>
        )}
      </Button>

      {isScanning && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            <Camera className="w-3 h-3" />
            Scanner active - point camera at QR code
          </div>
        </div>
      )}

      <div className="text-center text-sm text-gray-500">
        <p>Point camera at QR code to scan</p>
        <p className="text-xs mt-1">Camera will stop after successful scan</p>
      </div>
    </div>
  );
}