import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

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
  const [manualValue, setManualValue] = useState("");
  const [scannedValue, setScannedValue] = useState<string>("");

  // When opening, focus manual input so typing works immediately
  useEffect(() => {
    if (!isOpen) return;
    const id = window.requestAnimationFrame(() => manualInputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [isOpen]);

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
    <div ref={wrapperRef} className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000] pointer-events-auto">
      <div className="bg-card p-4 rounded-lg shadow-xl relative w-full max-w-md" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-center mb-4">Scan Barcode</h2>

        <div className="mb-3 text-sm text-muted-foreground bg-muted/40 border border-border rounded-md p-3 space-y-1">
          <p className="font-medium">Camera scanning disabled</p>
          <p>
            Please use a USB barcode scanner or the Barcode to PC mobile app. You can also type the barcode manually below.
          </p>
        </div>

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

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            className="px-3 py-2 rounded-md bg-primary text-primary-foreground"
            onClick={() => {
              if (!currentValue) return;
              if (onAdd) onAdd(currentValue); else if (onScan) onScan(currentValue);
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
              if (!currentValue) return;
              if (onSearch) onSearch(currentValue); else if (onScan) onScan(currentValue);
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
        <p className="text-center text-sm text-muted-foreground mt-2">
          Staff note: camera scanning is disabled. Use a USB scanner or the Barcode to PC mobile app, or type the barcode manually.
        </p>
      </div>
    </div>,
    document.body
  );
};

export default BarcodeScannerModal;
