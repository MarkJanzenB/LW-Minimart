import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, CameraOff } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (barcode: string) => void;
  onSearch?: (barcode: string) => void;
  onScan?: (barcode: string) => void; // fallback single-action usage
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onAdd, onSearch, onScan }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [manualValue, setManualValue] = useState("");
  const [scannedValue, setScannedValue] = useState<string>("");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Initialize camera when modal opens
  useEffect(() => {
    if (!isOpen) {
      // Stop camera when modal closes
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setCameraEnabled(false);
      setCameraError(null);
      return;
    }

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use back camera on mobile
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setCameraEnabled(true);
          setCameraError(null);
        }
      } catch (error: any) {
        console.error('Camera access error:', error);
        setCameraEnabled(false);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setCameraError('No camera found. Please use a USB barcode scanner or type manually.');
        } else {
          setCameraError('Camera access failed. Please use a USB barcode scanner or type manually.');
        }
        // Focus manual input if camera fails
        setTimeout(() => manualInputRef.current?.focus(), 100);
      }
    };

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  // When opening, focus manual input so typing works immediately (if camera is disabled)
  useEffect(() => {
    if (!isOpen || cameraEnabled) return;
    const id = window.requestAnimationFrame(() => manualInputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [isOpen, cameraEnabled]);

  // Trap pointer/keyboard events inside the modal
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDownCapture = (ev: Event) => {
      if (wrapperRef.current && ev.target instanceof Node && wrapperRef.current.contains(ev.target)) {
        ev.stopPropagation();
      }
    };
    const handleKeyDownCapture = (ev: KeyboardEvent) => {
      if (!wrapperRef.current) return;
      const active = document.activeElement as Node | null;
      const isInside = active && wrapperRef.current.contains(active);
      if (isInside && ev.key === 'Escape') {
        ev.stopPropagation();
        ev.preventDefault();
        onClose();
      } else if (isInside) {
        ev.stopPropagation();
      }
    };
    document.addEventListener('pointerdown', handlePointerDownCapture, true);
    document.addEventListener('keydown', handleKeyDownCapture, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDownCapture, true);
      document.removeEventListener('keydown', handleKeyDownCapture, true);
    };
  }, [isOpen, onClose]);

  // POS auto-add: when used with onScan (and no onAdd/onSearch),
  // automatically fire onScan shortly after the input has a value,
  // then clear and refocus so staff can keep scanning.
  useEffect(() => {
    if (!isOpen) return;
    if (!onScan || onAdd || onSearch) return;

    const value = (scannedValue || manualValue).trim();
    if (!value) return;

    const timeoutId = window.setTimeout(() => {
      const latest = (scannedValue || manualValue).trim();
      if (!latest) return;
      onScan(latest);
      setManualValue("");
      setScannedValue("");
      setTimeout(() => manualInputRef.current?.focus(), 0);
    }, 200);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, onScan, onAdd, onSearch, scannedValue, manualValue]);

  if (!isOpen) return null;

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const value = (scannedValue || manualValue).trim();
    if (!value) return;

    if (onAdd) {
      onAdd(value);
      onClose();
    } else if (onSearch) {
      onSearch(value);
      onClose();
    } else if (onScan) {
      onScan(value);
      // Keep modal open for continuous scanning in POS
    }

    setManualValue("");
    setScannedValue("");
    setTimeout(() => manualInputRef.current?.focus(), 0);
  };

  const currentValue = (scannedValue || manualValue).trim();

  return createPortal(
    <div ref={wrapperRef} className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000] pointer-events-auto" style={{ zIndex: 1000 }}>
      <div className="bg-card p-4 rounded-lg shadow-xl relative w-full max-w-md" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-center mb-4">Scan Barcode</h2>

        {cameraEnabled && videoRef.current ? (
          <div className="mb-3 relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-2 border-primary/50 rounded-lg pointer-events-none" />
          </div>
        ) : (
          <div className="mb-3 text-sm text-muted-foreground bg-muted/40 border border-border rounded-md p-3 space-y-1">
            <p className="font-medium flex items-center gap-2">
              {cameraError ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              {cameraError ? 'Camera unavailable' : 'Camera scanning disabled'}
            </p>
            <p>
              {cameraError || 'Please use a USB barcode scanner or the Barcode to PC mobile app. You can also type the barcode manually below.'}
            </p>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            ref={manualInputRef}
            value={scannedValue || manualValue}
            onKeyDown={handleInputKeyDown}
            onChange={(e) => {
              setScannedValue("");
              setManualValue(e.target.value);
            }}
            placeholder="Type barcode manually"
            className="flex-1 border border-border rounded-md px-3 py-2 bg-background"
          />
          <button
            className="px-3 py-2 rounded-md bg-secondary"
            onMouseDown={(e) => { e.preventDefault(); }}
            onClick={() => {
              // Clear and focus manual input for a new entry
              setScannedValue("");
              setManualValue("");
              setTimeout(() => manualInputRef.current?.focus(), 0);
            }}
          >
            Rescan
          </button>
        </div>

        {/* Only show action buttons if not in POS mode (onScan only) */}
        {onAdd || onSearch ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {onAdd && (
              <button
                className="px-3 py-2 rounded-md bg-primary text-primary-foreground"
                onClick={() => {
                  if (!currentValue) return;
                  onAdd(currentValue);
                  onClose();
                  setManualValue("");
                  setScannedValue("");
                }}
              >
                Add Product
              </button>
            )}
            {onSearch && (
              <button
                className="px-3 py-2 rounded-md bg-muted"
                onClick={() => {
                  if (!currentValue) return;
                  onSearch(currentValue);
                  onClose();
                  setManualValue("");
                  setScannedValue("");
                }}
              >
                Search Product
              </button>
            )}
          </div>
        ) : null}
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 bg-card/50 p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
        >
          <X size={20} />
        </button>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Staff note: camera scanning is disabled. Use a USB scanner or the Barcode to PC mobile app, or type the barcode manually.
        </p>
      </div>
    </div>,
    document.body
  );
};

export default BarcodeScannerModal;
