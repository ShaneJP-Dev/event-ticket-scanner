// app/components/CameraQRScanner.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Pre-load QR Scanner library
let QrScanner: any = null;
let qrScannerPromise: Promise<any> | null = null;

// Initialize QR Scanner loading immediately
const initQrScanner = () => {
  if (!qrScannerPromise) {
    qrScannerPromise = import('qr-scanner').then((QrScannerModule) => {
      QrScanner = QrScannerModule.default;
      QrScanner.WORKER_PATH = 'https://cdnjs.cloudflare.com/ajax/libs/qr-scanner/1.4.2/qr-scanner-worker.min.js';
      return QrScanner;
    });
  }
  return qrScannerPromise;
};

// Start loading immediately when module loads
initQrScanner();

interface QRScannerComponentProps {
  onScan: (code: string) => void;
  isActive: boolean;
  onToggleCamera: () => void;
  paused: boolean;
}

export default function QRScannerComponent({ onScan, isActive, onToggleCamera, paused }: QRScannerComponentProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [preferredCameraId, setPreferredCameraId] = useState<string>('');
  const [availableCameras, setAvailableCameras] = useState<any[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

  // Pre-select back camera and cache the ID
  useEffect(() => {
    const setupCamera = async () => {
      try {
        await initQrScanner();
        
        // Get available cameras and prefer back/environment camera
        const cameras = await QrScanner.listCameras();
        setAvailableCameras(cameras);
        console.log('Available cameras:', cameras);
        
        // More aggressive back camera detection - ONLY use rear camera
        let backCamera = null;
        let backCameraIndex = 0;
        
        // First try: Look for explicit back/environment/rear keywords
        backCamera = cameras.find((camera: any, index: number) => {
          const label = camera.label.toLowerCase();
          const isBack = label.includes('back') || 
                        label.includes('environment') ||
                        label.includes('rear') ||
                        label.includes('world');
          if (isBack) backCameraIndex = index;
          return isBack;
        });
        
        // Second try: Look for cameras with facingMode or id patterns
        if (!backCamera) {
          backCamera = cameras.find((camera: any, index: number) => {
            const label = camera.label.toLowerCase();
            const id = camera.id.toLowerCase();
            // Many devices have back camera as camera 0 or camera 1
            const isBack = label.includes('camera 0') || 
                          label.includes('camera 1') ||
                          id.includes('back') ||
                          id.includes('environment');
            if (isBack) backCameraIndex = index;
            return isBack;
          });
        }
        
        // Third try: If we have multiple cameras, avoid front-facing ones
        if (!backCamera && cameras.length > 1) {
          backCamera = cameras.find((camera: any, index: number) => {
            const label = camera.label.toLowerCase();
            const isNotFront = !label.includes('front') && 
                              !label.includes('user') && 
                              !label.includes('face') &&
                              !label.includes('selfie');
            if (isNotFront) backCameraIndex = index;
            return isNotFront;
          });
        }
        
        // ONLY use back camera - if no back camera found, show error
        if (!backCamera) {
          setError('No rear camera found. Please ensure device has a back camera.');
          setIsLoading(false);
          return;
        }
        
        const selectedCamera = backCamera;
        
        if (selectedCamera) {
          setPreferredCameraId(selectedCamera.id);
          setCurrentCameraIndex(backCameraIndex);
          console.log('Selected REAR camera:', selectedCamera.label, 'ID:', selectedCamera.id, 'Index:', backCameraIndex);
        } else {
          setError('No rear camera available on this device');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to setup camera:', err);
        setError('Failed to access camera');
        setIsLoading(false);
      }
    };

    setupCamera();
  }, []);

  // Initialize scanner once QR library and camera are ready
  useEffect(() => {
    if (!QrScanner || !videoRef.current || scanner || isLoading) return;

    const initScanner = async () => {
      try {
        const scannerConfig = {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
        };

        const newScanner = new QrScanner(
          videoRef.current,
          (result: any) => {
            console.log('QR Code detected:', result.data);
            
            // Trigger callback and pause scanner immediately
            onScan(result.data);
            toast.success(`QR Code scanned: ${result.data}`);
          },
          scannerConfig
        );

        // Set preferred camera AFTER scanner is created but BEFORE starting
        if (preferredCameraId) {
          try {
            console.log('Setting camera to:', preferredCameraId);
            await newScanner.setCamera(preferredCameraId);
            console.log('Successfully set camera to back camera');
          } catch (err) {
            console.warn('Could not set preferred camera:', err);
            // Try to set environment facing mode as fallback
            try {
              await newScanner.setCamera('environment');
              console.log('Fallback: Set camera to environment mode');
            } catch (fallbackErr) {
              console.warn('Environment mode also failed:', fallbackErr);
            }
          }
        } else {
          // Try environment mode if no specific camera ID
          try {
            await newScanner.setCamera('environment');
            console.log('No preferred camera, using environment mode');
          } catch (err) {
            console.warn('Environment mode failed:', err);
          }
        }

        setScanner(newScanner);
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
  }, [QrScanner, videoRef.current, isLoading, preferredCameraId, onScan]);

  const startScanning = async () => {
    if (!scanner) {
      setError('Scanner not initialized');
      return;
    }

    try {
      setError('');
      console.log('Starting scanner...');
      await scanner.start();
      setIsScanning(true);
      console.log('Scanner started successfully');
    } catch (err) {
      console.error('Failed to start scanning:', err);
      setError(`Failed to start camera: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const stopScanning = () => {
    if (scanner && isScanning) {
      console.log('Stopping scanner...');
      scanner.stop();
      setIsScanning(false);
      setError('');
      console.log('Scanner stopped');
    }
  };

  const pauseScanning = () => {
    if (scanner && isScanning) {
      console.log('Pausing scanner...');
      scanner.stop();
      setIsScanning(false);
      console.log('Scanner paused');
    }
  };

  const resumeScanning = async () => {
    if (scanner && !isScanning) {
      console.log('Resuming scanner...');
      try {
        await scanner.start();
        setIsScanning(true);
        console.log('Scanner resumed');
      } catch (err) {
        console.error('Failed to resume scanning:', err);
        setError(`Failed to resume camera: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  // Handle pause/resume based on paused prop
  useEffect(() => {
    if (!scanner) return;

    if (paused && isScanning) {
      pauseScanning();
    } else if (!paused && isActive && !isScanning) {
      resumeScanning();
    }
  }, [paused, scanner, isActive]);

  // Handle camera toggle
  useEffect(() => {
    if (!scanner) return;

    if (isActive && !paused && !isScanning) {
      startScanning();
    } else if (!isActive && isScanning) {
      stopScanning();
    }
  }, [isActive, scanner, paused]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="w-full">
          <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p>Initializing camera...</p>
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
                  if (isActive && scanner && !paused) startScanning();
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
                <p>Preparing scanner...</p>
              </div>
            </div>
          )}

          {/* Status indicators */}
          {paused && (
            <div className="absolute top-4 left-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-1 rounded-full text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                Scanner Paused
              </div>
            </div>
          )}

          {isScanning && !paused && (
            <div className="absolute top-4 left-4 bg-green-100 border border-green-300 text-green-800 px-3 py-1 rounded-full text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                Scanning Active
              </div>
            </div>
          )}

          {!isScanning && !paused && isActive && (
            <div className="absolute top-4 left-4 bg-red-100 border border-red-300 text-red-800 px-3 py-1 rounded-full text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                Scanner Stopped
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button 
          onClick={onToggleCamera}
          variant={isActive ? "destructive" : "default"}
          className="flex-1"
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
      </div>

      <div className="text-center">
        {isScanning && !paused && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            <Camera className="w-3 h-3" />
            Ready to scan - point at QR code
          </div>
        )}
        
        {paused && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
            <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
            Processing ticket - scanner paused
          </div>
        )}

        {!isScanning && !paused && isActive && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
            <AlertCircle className="w-3 h-3" />
            Scanner not active
          </div>
        )}
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>Point rear camera at QR code to scan</p>
        <p className="text-xs mt-1">
          {paused ? 'Scanner will resume when modal closes' : 'Scanner will pause after successful scan'}
        </p>
        {availableCameras.length > 0 && (
          <p className="text-xs mt-1 text-green-600">
            Rear Camera: {availableCameras[currentCameraIndex]?.label || 'Unknown'}
          </p>
        )}
      </div>
    </div>
  );
}