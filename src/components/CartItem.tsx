import React from 'react';
import { CartItem as CartItemType } from '@/integrations/supabase/types';
import { Plus, Minus, Trash2, Package } from 'lucide-react';

interface CartItemProps {
  item: CartItemType;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
  isSelected: boolean;
}

const CartItem: React.FC<CartItemProps> = ({ item, onIncrement, onDecrement, onRemove, isSelected }) => {
  return (
    <div className={`flex items-center p-3 rounded-lg border mb-2 shadow-sm transition-all duration-200 ${isSelected ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-300' : 'bg-white border-stone-100'}`}>
      <div className={`w-12 h-12 ${item.color || 'bg-stone-100'} rounded-md flex items-center justify-center mr-3 shrink-0`}>
         <Package className="w-6 h-6 text-stone-400 opacity-50" />
      </div>
      
      <div className="flex-1 min-w-0 mr-4">
        <h4 className="font-semibold text-stone-800 text-sm truncate">{item.name}</h4>
        <p className="text-xs text-stone-500">₱{item.price.toFixed(2)} each</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-stone-50 rounded-lg p-1">
          <button 
            onClick={() => onDecrement(item.id)}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-white shadow-sm text-stone-600 hover:text-orange-600 hover:bg-orange-50 active:scale-95 transition-all"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center font-bold text-stone-700 text-sm">{item.quantity}</span>
          <button 
            onClick={() => onIncrement(item.id)}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-white shadow-sm text-stone-600 hover:text-green-600 hover:bg-green-50 active:scale-95 transition-all"
          >
            <Plus size={14} />
          </button>
        </div>
        
        <div className="text-right min-w-[60px]">
          <div className="font-bold text-stone-800">₱{(item.price * item.quantity).toFixed(2)}</div>
          <button 
            onClick={() => onRemove(item.id)}
            className="text-red-400 hover:text-red-600 text-xs flex items-center justify-end w-full mt-1 gap-1"
          >
             <Trash2 size={10} /> Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
