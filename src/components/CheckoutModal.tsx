import React, { useEffect, useState, useRef } from 'react';
import { CreditCard, Banknote, Printer, X } from 'lucide-react';
import { CartItem } from '../types';

interface CheckoutModalProps {
  total: number;
  onConfirm: (amountReceived: number, method: 'cash' | 'card') => void;
  onCancel: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ total, onConfirm, onCancel }) => {
  const [method, setMethod] = useState<'cash' | 'card'>('cash');
  const [cashRecieved, setCashRecieved] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [method]);

  // Handle keyboard interaction for the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'F1') setMethod('card');
      if (e.key === 'F5') setMethod('cash');
      if (e.key === 'Enter') {
        handlePayment();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cashRecieved, method, total]);

  const change = method === 'cash' ? Math.max(0, parseFloat(cashRecieved || '0') - total) : 0;
  const isSufficient = method === 'card' || (parseFloat(cashRecieved || '0') >= total);

  const handlePayment = () => {
    if (isSufficient) {
      onConfirm(parseFloat(cashRecieved || '0'), method);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FDFBF7] w-full max-w-4xl h-[600px] rounded-2xl shadow-2xl flex overflow-hidden">
        
        {/* Left Side: Summary */}
        <div className="w-1/3 bg-[#F5F0EB] p-8 flex flex-col justify-between border-r border-stone-200">
           <div>
             <h2 className="text-3xl font-extrabold text-stone-900 mb-2">Checkout</h2>
             <p className="text-stone-500 mb-8">Total Due</p>
             <div className="text-6xl font-black text-stone-800 tracking-tight">
               ₱{total.toFixed(2)}
             </div>
           </div>
           
           <div className="text-xs text-stone-400">
             Press [Enter] to Print, [Esc] to Cancel
           </div>
        </div>

        {/* Right Side: Payment Form */}
        <div className="w-2/3 p-12 flex flex-col justify-center">
            
            {/* Payment Method Tabs */}
            <div className="flex gap-4 mb-8 bg-stone-100 p-2 rounded-xl">
               <button 
                 onClick={() => setMethod('cash')}
                 className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-lg text-lg font-bold transition-all duration-200 ${method === 'cash' ? 'bg-white shadow-md text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
               >
                 <Banknote /> Cash (F5)
               </button>
               <button 
                 onClick={() => setMethod('card')}
                 className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-lg text-lg font-bold transition-all duration-200 ${method === 'card' ? 'bg-white shadow-md text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
               >
                 <CreditCard /> Card (F1)
               </button>
            </div>

            {method === 'cash' && (
              <div className="mb-8 animate-in slide-in-from-top-4 duration-300">
                <label className="block text-stone-600 font-semibold mb-2">Cash Received</label>
                <input 
                  ref={inputRef}
                  type="number" 
                  value={cashRecieved}
                  onChange={(e) => setCashRecieved(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-4xl p-6 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all font-mono"
                />
              </div>
            )}

            <div className={`p-8 rounded-xl mb-8 transition-colors duration-300 ${isSufficient ? 'bg-[#3E5C48] text-white' : 'bg-red-50 text-red-500'}`}>
              <div className="flex justify-between items-end">
                <span className="text-lg font-medium opacity-80">
                  {method === 'cash' ? 'Change Due' : 'Status'}
                </span>
                <span className="text-5xl font-bold font-mono">
                  {method === 'cash' ? `₱${change.toFixed(2)}` : 'Ready'}
                </span>
              </div>
            </div>

            <div className="flex gap-4 mt-auto">
               <button 
                 onClick={onCancel}
                 className="flex-1 py-4 bg-white border border-stone-200 text-stone-600 font-bold rounded-lg hover:bg-stone-50 transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={handlePayment}
                 disabled={!isSufficient}
                 className={`flex-1 py-4 font-bold rounded-lg text-white shadow-lg flex items-center justify-center gap-2 transition-all ${isSufficient ? 'bg-orange-500 hover:bg-orange-600 active:scale-95' : 'bg-stone-300 cursor-not-allowed'}`}
               >
                 <Printer size={20} /> Print Receipt
               </button>
            </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
