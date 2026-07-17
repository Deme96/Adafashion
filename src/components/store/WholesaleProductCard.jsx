import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useCart } from '../../hooks/useCart';

const WholesaleProductCard = ({ product }) => {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const minQty = product.wholesale_min_qty ? parseInt(product.wholesale_min_qty) : 1;
  
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '');
  const [quantity, setQuantity] = useState(minQty);

  const isOutOfStock = product.stock <= 0;

  const handleProceedToReserve = () => {
    if (isOutOfStock) return;
    // add item and navigate, then dispatch a cart-update event after navigation so
    // the Cart page (which may mount after navigation) receives the latest cart
    // data even if it missed the original event.
    addItem(product, selectedSize, selectedColor, quantity);
    navigate('/carrinho?step=checkout&action=reserve');
    // ensure Cart gets notified after navigation — dispatch both update and refresh
    setTimeout(() => {
      try {
        const raw = localStorage.getItem('modare_cart');
        const detail = raw ? JSON.parse(raw) : [];
        window.dispatchEvent(new CustomEvent('cart-update', { detail }));
        window.dispatchEvent(new CustomEvent('cart-refresh'));
      } catch (e) {
        // ignore
      }
    }, 120);
  };

  return (
      <div
        onClick={handleProceedToReserve}
        className="bg-white rounded-2xl overflow-hidden border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow cursor-pointer"
      >
        {/* Image Container */}
        <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden bg-gray-50">
          <img
            src={product.images?.[0] || 'https://via.placeholder.com/400x500?text=Sem+Imagem'}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-gray-900 text-sm font-bold px-4 py-2 rounded-full">
                Esgotado
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">
            {product.category}
          </p>
          <h3 className="text-sm font-bold text-gray-900 tracking-tight line-clamp-1 mb-2">
            {product.name}
          </h3>
          
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-black text-rose-500">
              {formatCurrency(product.price)}
            </span>
            {product.original_price && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(product.original_price)}
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-3 mt-auto">
            <div className="grid grid-cols-2 gap-2">
              {product.sizes?.length > 0 && (
                <select
                  value={selectedSize}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="" disabled>Tamanho</option>
                  {product.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              
              {product.colors?.length > 0 && (
                <select
                  value={selectedColor}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="" disabled>Cor</option>
                  {product.colors.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Qtd (Mín: {minQty}):</span>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuantity(q => Math.max(minQty, q - 1));
                  }}
                  className="p-1.5 hover:bg-gray-50 disabled:opacity-50"
                  disabled={isOutOfStock || quantity <= minQty}
                >
                  <Minus size={12} />
                </button>
                <span className="px-2 text-xs font-semibold min-w-[24px] text-center">{quantity}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuantity(q => q + 1);
                  }}
                  className="p-1.5 hover:bg-gray-50 disabled:opacity-50"
                  disabled={isOutOfStock}
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default WholesaleProductCard;
