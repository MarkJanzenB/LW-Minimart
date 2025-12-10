import { create } from 'zustand';

interface ScannerState {
  lastScannedBarcode: string;
  setLastScannedBarcode: (code: string) => void;
  clear: () => void;
}

export const useScannerStore = create<ScannerState>((set) => ({
  lastScannedBarcode: '',
  setLastScannedBarcode: (code: string) => set({ lastScannedBarcode: code }),
  clear: () => set({ lastScannedBarcode: '' }),
}));
