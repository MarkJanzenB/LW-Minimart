import React from 'react';
import { Product } from '../types';
import { Package } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const isLowStock = product.stock < 5;
  
  return (
    <button
      onClick={() => onClick(product)}
      className="flex flex-col p-4 bg-white rounded-xl shadow-sm border border-stone-200 hover:shadow-md hover:border-orange-300 transition-all duration-200 text-left group h-full relative overflow-hidden"
    >
      <div className={`h-32 w-full ${product.color || 'bg-stone-100'} rounded-lg mb-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
         {/* Placeholder for actual image */}
         <Package className="w-12 h-12 text-stone-400 opacity-50" />
      </div>
      
      <div className="flex-1 w-full">
        <h3 className="font-bold text-stone-800 text-sm leading-tight mb-1 truncate w-full" title={product.name}>
          {product.name}
        </h3>
        <p className="text-xs text-stone-400 mb-2">{product.code}</p>
      </div>

      <div className="flex items-end justify-between w-full mt-2">
        <span className="font-bold text-lg text-stone-800">
          ₱{product.price.toFixed(2)}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full ${isLowStock ? 'bg-orange-100 text-orange-700 font-medium' : 'bg-stone-100 text-stone-500'}`}>
          {product.stock} left
        </span>
      </div>
    </button>
  );
};

export default ProductCard;
