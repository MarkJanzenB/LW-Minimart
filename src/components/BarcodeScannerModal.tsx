import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { X } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (barcode: string) => void;
  onSearch?: (barcode: string) => void;
  onScan?: (barcode: string) => void; // fallback single-action usage
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onAdd, onSearch, onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const codeReader = new BrowserMultiFormatReader();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [manualValue, setManualValue] = useState("");
  const [scannedValue, setScannedValue] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const manualInputRef = useRef<HTMLInputElement>(null);
  const [isManualEditing, setIsManualEditing] = useState(false);
  const isManualEditingRef = useRef(false);
  useEffect(() => {
    isManualEditingRef.current = isManualEditing;
  }, [isManualEditing]);

  useEffect(() => {
    if (isOpen) {
      void initDevices();
    } else {
      codeReader.reset();
    }

    return () => {
      codeReader.reset();
    };
  }, [isOpen]);

  // When opening, focus manual input so typing works immediately
  useEffect(() => {
    if (!isOpen) return;
    const id = window.requestAnimationFrame(() => manualInputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (selectedDeviceId) {
      startScanner(selectedDeviceId);
    }
  }, [selectedDeviceId, isOpen]);
  const initDevices = async () => {
    try {
      let videoInputDevices = await codeReader.listVideoInputDevices();
      // If devices list is empty or DroidCam likely just started, warm up permissions and retry
      if (!videoInputDevices.length) {
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
          videoInputDevices = await codeReader.listVideoInputDevices();
        } catch {
          // ignore, we'll surface the error below
        }
      }
      setDevices(videoInputDevices);
      const saved = localStorage.getItem('scannerDeviceId') || undefined;
      const droid = videoInputDevices.find(d => /droidcam/i.test(d.label));
      const initial =
        videoInputDevices.find(d => d.deviceId === saved)?.deviceId ||
        droid?.deviceId ||
        videoInputDevices[0]?.deviceId;
      setSelectedDeviceId(initial);
      if (!videoInputDevices.length) {
        setErrorMsg('No camera found. Start your webcam or DroidCam, then reopen the scanner.');
      } else {
        setErrorMsg('');
      }
    } catch (err) {
      console.error('Error initializing scanner:', err);
      setErrorMsg('Failed to initialize camera. Please allow camera permissions.');
    }
  };

  // When open, react to system camera changes (e.g., DroidCam connects)
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => { void initDevices(); };
    if (navigator.mediaDevices && 'addEventListener' in navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', handler);
    } else if (navigator.mediaDevices && 'ondevicechange' in navigator.mediaDevices) {
      // @ts-ignore legacy
      navigator.mediaDevices.ondevicechange = handler;
    }
    return () => {
      if (navigator.mediaDevices && 'removeEventListener' in navigator.mediaDevices) {
        navigator.mediaDevices.removeEventListener('devicechange', handler);
      } else if (navigator.mediaDevices && 'ondevicechange' in navigator.mediaDevices) {
        // @ts-ignore legacy
        navigator.mediaDevices.ondevicechange = null;
      }
    };
  }, [isOpen]);

  const startScanner = async (deviceId: string) => {
    try {
      codeReader.reset();
      localStorage.setItem('scannerDeviceId', deviceId);
      const target = videoRef.current;
      if (target) {
        target.setAttribute('playsinline', 'true');
        // @ts-ignore
        target.autoplay = true;
        // @ts-ignore
        target.muted = true;
      }
      codeReader.decodeFromVideoDevice(deviceId || undefined, target, (result, err) => {
        if (result) {
          if (!isManualEditingRef.current) {
            const text = result.getText();
            setScannedValue(text);
            codeReader.reset();
          }
        }
        if (err && !(err instanceof NotFoundException)) {
          console.error('Barcode scan error:', err);
        }
      });
    } catch (err) {
      console.error('Error starting scanner:', err);
      setErrorMsg('Unable to start camera. Try a different device in the dropdown.');
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDownCapture = (ev: Event) => {
      if (wrapperRef.current && ev.target instanceof Node && wrapperRef.current.contains(ev.target)) {
        ev.stopPropagation();
      }
    };
    const handleKeyDownCapture = (ev: KeyboardEvent) => {
      if (!wrapperRef.current) return;
      // If focus is within scanner modal
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

  if (!isOpen) return null;

  return createPortal(
    <div ref={wrapperRef} className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000] pointer-events-auto">
      <div className="bg-card p-4 rounded-lg shadow-xl relative w-full max-w-md" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-center mb-4">Scan Barcode</h2>
        <div className="mb-3 flex gap-2 items-center">
          <select
            className="flex-1 border border-border rounded-md px-3 py-2 bg-background"
            value={selectedDeviceId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedDeviceId(id);
              localStorage.setItem('scannerDeviceId', id);
            }}
            disabled={!devices.length}
          >
            {devices.length === 0 ? (
              <option>Select camera (none found)</option>
            ) : (
              devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera'}</option>
              ))
            )}
          </select>
          <button
            type="button"
            className="px-3 py-2 rounded-md border border-border bg-background"
            title="Refresh cameras"
            onClick={() => { void initDevices(); }}
          >
            Refresh
          </button>
        </div>
        <div className="relative">
          <video ref={videoRef} className="w-full rounded-md bg-black" playsInline autoPlay muted />
          {/* Scan guide overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative w-[85%] max-w-[520px] h-28 sm:h-32 md:h-36 border-2 border-primary/60 rounded-md">
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary/70 rounded-tl"></div>
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary/70 rounded-tr"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary/70 rounded-bl"></div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary/70 rounded-br"></div>
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-primary/60"></div>
            </div>
          </div>
        </div>
        {errorMsg && (
          <p className="mt-2 text-sm text-destructive">{errorMsg}</p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            ref={manualInputRef}
            value={scannedValue || manualValue}
            onFocus={() => { setIsManualEditing(true); codeReader.reset(); }}
            onBlur={() => { setIsManualEditing(false); if (selectedDeviceId) startScanner(selectedDeviceId); }}
            onChange={(e) => { setScannedValue(""); setManualValue(e.target.value); }}
            placeholder="Type barcode manually"
            className="flex-1 border border-border rounded-md px-3 py-2 bg-background"
          />
          <button
            className="px-3 py-2 rounded-md bg-secondary"
            onMouseDown={(e) => { e.preventDefault(); }}
            onClick={() => {
              // Enter manual-edit mode: keep manual input, clear scanned value, pause camera
              setScannedValue("");
              setIsManualEditing(true);
              codeReader.reset();
              // Return focus to manual input for immediate typing
              setTimeout(() => manualInputRef.current?.focus(), 0);
            }}
          >
            Rescan
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            className="px-3 py-2 rounded-md bg-primary text-primary-foreground"
            onClick={() => {
              const v = (scannedValue || manualValue).trim();
              if (!v) return;
              if (onAdd) onAdd(v); else if (onScan) onScan(v);
              onClose();
              setManualValue("");
              setScannedValue("");
            }}
          >
            Add Product
          </button>
          <button
            className="px-3 py-2 rounded-md bg-muted"
            onClick={() => {
              const v = (scannedValue || manualValue).trim();
              if (!v) return;
              if (onSearch) onSearch(v); else if (onScan) onScan(v);
              onClose();
              setManualValue("");
              setScannedValue("");
            }}
          >
            Search Product
          </button>
        </div>
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 bg-card/50 p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
        >
          <X size={20} />
        </button>
        <p className="text-center text-sm text-muted-foreground mt-2">Align the barcode inside the box. Choose DroidCam in the dropdown if needed.</p>
      </div>
    </div>,
    document.body
  );
};

export default BarcodeScannerModal;
