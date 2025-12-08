import React, { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { X } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = new BrowserMultiFormatReader();

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      codeReader.reset();
    }

    return () => {
      codeReader.reset();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      const videoInputDevices = await codeReader.listVideoInputDevices();
      const selectedDeviceId = videoInputDevices[0].deviceId;

      codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
        if (result) {
          onScan(result.getText());
          onClose();
        }
        if (err && !(err instanceof NotFoundException)) {
          console.error('Barcode scan error:', err);
        }
      });
    } catch (err) {
      console.error('Error initializing scanner:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-card p-4 rounded-lg shadow-xl relative w-full max-w-md">
        <h2 className="text-lg font-bold text-center mb-4">Scan Barcode</h2>
        <video ref={videoRef} className="w-full rounded-md" />
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 bg-card/50 p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
        >
          <X size={20} />
        </button>
        <p className="text-center text-sm text-muted-foreground mt-2">Place a barcode inside the frame</p>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;
