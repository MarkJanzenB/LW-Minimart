import React from 'react';
import { Product } from '@/integrations/supabase/types';
import { Package } from 'lucide-react';
import { formatCurrency } from '@/hooks/use-currency';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const isLowStock = product.stock < 5;
  
  return (
    <button
      onClick={() => onClick(product)}
      className="flex flex-col p-4 bg-card rounded-xl shadow-sm border-2 border-border hover:shadow-lg hover:border-primary transition-all duration-200 text-left group h-full relative overflow-hidden"
    >
      <div className={`h-32 w-full ${product.color || 'bg-muted'} rounded-lg mb-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
         {/* Placeholder for actual image */}
         <Package className="w-12 h-12 text-muted-foreground opacity-50" />
      </div>
      
      <div className="flex-1 w-full">
        <h3 className="font-bold text-foreground text-sm leading-tight mb-1 truncate w-full" title={product.name}>
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">{product.code}</p>
      </div>

      <div className="flex items-end justify-between w-full mt-2">
        <span className="font-bold text-lg text-foreground">
          {formatCurrency(product.price)}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full ${isLowStock ? 'bg-destructive/10 text-destructive font-medium' : 'bg-muted text-muted-foreground'}`}>
          {product.stock} left
        </span>
      </div>
    </button>
  );
};

export default ProductCard;
