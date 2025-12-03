import React, { useEffect } from 'react';
import { Transaction } from '@/integrations/supabase/types';
import { Printer, CheckCircle, Download } from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction;
  onClose: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') {
         window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FDFBF7] animate-in fade-in duration-300 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 p-6 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div>
           <h1 className="text-2xl font-bold text-stone-800">Print Receipt Preview</h1>
           <p className="text-stone-500">Review the receipt before printing. [Esc] to go back.</p>
        </div>
        <div className="flex items-center gap-2 font-bold text-xl text-stone-800">
           <span className="text-orange-500">◆</span> lifewood
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[600px]">
        
        {/* Paper Receipt */}
        <div className="bg-white p-8 w-[380px] shadow-xl rounded-sm border-t-8 border-orange-200 relative">
          <div className="flex flex-col items-center mb-6">
             <span className="text-orange-500 mb-2">◆</span>
             <h2 className="font-bold text-xl uppercase tracking-widest text-stone-900">lifewood</h2>
             <h3 className="font-mono font-bold text-lg mt-1">LW Mini Mart</h3>
             <p className="font-mono text-xs text-stone-500 text-center mt-1">
               123 Market St, Commerce City<br/>
               Date: {transaction.date.toLocaleString()}
             </p>
          </div>

          <div className="border-t border-b border-dashed border-stone-300 py-4 mb-4 font-mono text-xs space-y-2">
            {transaction.items.map(item => (
              <div key={item.id} className="flex justify-between">
                <span className="truncate w-32">{item.quantity}x {item.name}</span>
                <span>₱{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="font-mono text-sm space-y-2 mb-6">
             <div className="flex justify-between font-bold">
               <span>Total Due</span>
               <span>₱{transaction.total.toFixed(2)}</span>
             </div>
             {transaction.paymentMethod === 'cash' && (
               <>
                <div className="flex justify-between text-stone-500">
                  <span>Cash Received</span>
                  <span>₱{(transaction.cashReceived || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-stone-100">
                  <span>Change</span>
                  <span>₱{(transaction.change || 0).toFixed(2)}</span>
                </div>
               </>
             )}
             {transaction.paymentMethod === 'card' && (
                <div className="flex justify-between text-stone-500">
                   <span>Payment Method</span>
                   <span>CARD ****</span>
                </div>
             )}
          </div>

          <div className="text-center font-mono text-xs text-stone-400 mb-4">
             Thank you for shopping with us!
          </div>
          
          <div className="absolute -bottom-3 left-0 w-full h-4 bg-[radial-gradient(circle,transparent_50%,#fff_50%)] bg-[length:10px_20px] rotate-180"></div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
           <button 
             onClick={() => window.print()}
             className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95"
           >
             <Printer size={18} /> Print
           </button>
           <button className="bg-white border border-stone-300 text-stone-700 px-8 py-3 rounded-lg font-bold shadow-sm hover:bg-stone-50 flex items-center gap-2 transition-all">
             <Download size={18} /> Save as PDF
           </button>
        </div>

        <div className="mt-6 text-stone-400 text-sm">
           Use <kbd className="bg-stone-200 px-2 py-1 rounded text-stone-600 font-bold mx-1">Enter</kbd> to print
        </div>

      </div>
    </div>
  );
};

export default ReceiptModal;
