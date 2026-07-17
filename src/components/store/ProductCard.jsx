// ========== MODARE Product Card ==========
import { Link } from 'react-router-dom';
import { formatCurrency, calcDiscount } from '../../lib/utils';
import { useLanguage } from '../../hooks/useLanguage';

const ProductCard = ({ product }) => {
  const { t } = useLanguage();
  const discount = calcDiscount(product.price, product.sale_price);
  const isOutOfStock = product.stock <= 0;
  const displayPrice = product.sale_price && product.sale_price < product.price
    ? product.sale_price
    : product.price;

  return (
    <Link
      to={`/produto/${product.id}`}
      className="group product-card block bg-white rounded-2xl overflow-hidden border border-gray-100"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/400x500?text=Sem+Imagem'}
          alt={product.name}
          className="w-full h-full object-cover product-image"
          loading="lazy"
        />

        {/* Discount badge */}
        {discount > 0 && !isOutOfStock && (
          <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            -{discount}%
          </div>
        )}

        {/* Featured badge */}
        {product.is_featured && (
          <div className="absolute top-3 right-3 bg-black text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
            {t('featured')}
          </div>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-900 text-sm font-bold px-4 py-2 rounded-full">
              {t('outOfStock')}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">
          {product.category}
        </p>
        <h3 className="text-sm font-semibold text-gray-900 tracking-tight line-clamp-1 mb-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className={`text-base font-bold ${discount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {formatCurrency(displayPrice)}
          </span>
          {discount > 0 && (
            <span className="text-sm text-gray-400 line-through">
              {formatCurrency(product.price)}
            </span>
          )}
        </div>

        {/* Sizes preview */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="flex gap-1 mt-3 flex-wrap">
            {product.sizes.slice(0, 4).map(size => (
              <span key={size} className="text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                {size}
              </span>
            ))}
            {product.sizes.length > 4 && (
              <span className="text-[10px] text-gray-400">+{product.sizes.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
