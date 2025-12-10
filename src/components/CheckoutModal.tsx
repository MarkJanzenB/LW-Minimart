import React, { useEffect, useState, useRef } from 'react';
import { Banknote, Printer, QrCode } from 'lucide-react';
import { formatCurrency } from '@/hooks/use-currency';
import { toast } from 'sonner';

interface CheckoutModalProps {
  total: number;
  onConfirm: (amountReceived: number, method: 'cash' | 'qr', referenceNumber?: string) => void;
  onCancel: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ total, onConfirm, onCancel }) => {
  const [method, setMethod] = useState<'cash' | 'qr'>('cash');
  const [cashRecieved, setCashRecieved] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {  
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [method]);

  const change = method === 'cash' ? Math.max(0, parseFloat(cashRecieved || '0') - total) : 0;
  const isCashSufficient = parseFloat(cashRecieved || '0') >= total;
  const isQrReady = referenceNumber.trim().length > 0;
  const isSufficient = method === 'cash' ? isCashSufficient : isQrReady;

  const handlePayment = () => {
    if (!isSufficient) {
      toast.error(method === 'cash' ? 'Cash received is less than total due.' : 'Enter a reference number for QR.', {
        duration: 3000,
      });
      return;
    }

    if (method === 'cash') {
      onConfirm(parseFloat(cashRecieved || '0'), 'cash');
    } else {
      onConfirm(total, 'qr', referenceNumber.trim());
    }
  };

  // Handle keyboard interaction for the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'F1') setMethod('qr');
      if (e.key === 'F5') setMethod('cash');
      if (e.key === 'Enter') {
        e.preventDefault();
        handlePayment();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cashRecieved, referenceNumber, method, total, onConfirm, onCancel, isSufficient]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FDFBF7] w-full max-w-4xl h-auto md:h-[600px] max-h-[95vh] sm:max-h-[90vh] rounded-xl sm:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Summary */}
        <div className="w-full md:w-1/3 bg-[#F5F0EB] p-4 sm:p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-200">
           <div>
             <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mb-2">Checkout</h2>
             <p className="text-sm sm:text-base text-stone-500 mb-4 sm:mb-6 md:mb-8">Total Due</p>
             <div className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-black text-stone-800 tracking-tight break-words">
               {formatCurrency(total)}
             </div>
           </div>
           
           <div className="text-xs sm:text-sm text-stone-400 mt-4 sm:mt-0">
             Press [Enter] to Print, [Esc] to Cancel
           </div>
        </div>

        {/* Right Side: Payment Form */}
        <div className="w-full md:w-2/3 p-4 sm:p-5 md:p-8 flex flex-col md:justify-center gap-3 md:gap-4 overflow-y-auto">
            
            {/* Payment Method Tabs */}
            <div className="flex gap-2 sm:gap-4 mb-4 md:mb-6 bg-stone-100 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
               <button 
                 onClick={() => setMethod('cash')}
                 className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-4 rounded-lg text-sm sm:text-lg font-bold transition-all duration-200 ${method === 'cash' ? 'bg-white shadow-md text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
               >
                 <Banknote className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Cash</span> <span className="text-xs sm:text-sm">(F5)</span>
               </button>
               <button 
                 onClick={() => setMethod('qr')}
                 className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-4 rounded-lg text-sm sm:text-lg font-bold transition-all duration-200 ${method === 'qr' ? 'bg-white shadow-md text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
               >
                 <QrCode className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">QR Code</span> <span className="text-xs sm:text-sm">(F1)</span>
               </button>
            </div>

            {method === 'cash' && (
              <>
                <div className="mb-4 sm:mb-6 animate-in slide-in-from-top-4 duration-300">
                  <label className="block text-sm sm:text-base text-stone-600 font-semibold mb-2">Cash Received</label>
                  <input 
                    ref={inputRef}
                    type="number" 
                    value={cashRecieved}
                    onChange={(e) => setCashRecieved(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-2xl sm:text-3xl md:text-4xl p-4 sm:p-6 bg-white border border-stone-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all font-mono"
                  />
                </div>
                <div
                  className={`rounded-lg sm:rounded-xl mb-4 md:mb-6 transition-colors duration-300 ${
                    isCashSufficient ? 'bg-[#3E5C48] text-white' : 'bg-red-50 text-red-500'
                  } p-4 sm:p-6 md:p-8`}
                >
                  <div className="flex justify-between items-end">
                    <span className="text-base sm:text-lg font-medium opacity-80">
                      Change Due
                    </span>
                    <span className="font-bold font-mono text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                      {formatCurrency(change)}
                    </span>
                  </div>
                </div>
              </>
            )}

            {method === 'qr' && (
              <div className="mb-3 md:mb-4 animate-in slide-in-from-top-4 duration-300 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-5">
                  <div className="p-3 md:p-4 bg-white border border-stone-200 rounded-lg sm:rounded-xl shadow-sm shrink-0">
                    <img
                      src="/qr-code.png"
                      alt="QR code for payment"
                      className="w-32 h-32 sm:w-48 sm:h-48 md:w-52 md:h-52 object-contain"
                    />
                  </div>
                  <div className="text-xs sm:text-sm text-stone-500 max-w-xs text-center sm:text-left">
                    Scan the QR code, then enter the reference number below.
                  </div>
                </div>
                <div>
                  <label className="block text-sm sm:text-base text-stone-600 font-semibold mb-1 md:mb-2">
                    Reference Number
                  </label>
                  <input 
                    ref={inputRef}
                    type="text" 
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Reference number from QR payment"
                    className="w-full text-sm sm:text-base p-2.5 sm:p-3 bg-white border border-stone-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all font-mono"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4 md:mt-auto">
               <button 
                 onClick={onCancel}
                 className="flex-1 py-3 sm:py-4 bg-white border border-stone-200 text-stone-600 font-bold rounded-lg hover:bg-stone-50 transition-colors text-sm sm:text-base"
               >
                 Cancel
               </button>
               <button 
                 onClick={handlePayment}
                 disabled={!isSufficient}
                 className={`flex-1 py-3 sm:py-4 font-bold rounded-lg text-white shadow-lg flex items-center justify-center gap-2 transition-all text-sm sm:text-base ${isSufficient ? 'bg-orange-500 hover:bg-orange-600 active:scale-95' : 'bg-stone-300 cursor-not-allowed'}`}
               >
                 <Printer className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Print Receipt</span><span className="sm:hidden">Print</span>
               </button>
            </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
