// ========== MODARE Product Detail Page ==========
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Check, Minus, Plus, Package, ChevronRight } from 'lucide-react';
import api from '../../lib/api';
import { formatCurrency, calcDiscount } from '../../lib/utils';
import { getLoggedCustomer } from '../../lib/customerAuth';
import { useCart } from '../../hooks/useCart';
import StoreNavbar from '../../components/store/StoreNavbar';
import Footer from '../../components/store/Footer';
import Modal from '../../components/ui/Modal';
import { notify } from '../../lib/notifications';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [minQuantity, setMinQuantity] = useState(1);
  const [isWholesaleMode, setIsWholesaleMode] = useState(false);
  const [added, setAdded] = useState(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [isSubmittingReserve, setIsSubmittingReserve] = useState(false);
  const [reserveForm, setReserveForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    reservation_date: '',
  });
  const { addItem } = useCart();
  const navigate = useNavigate();
  const customer = getLoggedCustomer();
  const isGrossista = customer?.account_type === 'grossista';

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const p = await api.getProduct(id);
        if (p) {
          if (isGrossista && p.wholesale_price) {
            p.original_price = p.price;
            p.price = p.wholesale_price;
            p.sale_price = null;
            const minQ = p.wholesale_min_qty ? parseInt(p.wholesale_min_qty) : 1;
            setMinQuantity(minQ);
            setQuantity(minQ);
            setIsWholesaleMode(true);
          }
          setProduct(p);
          if (p.sizes?.length) setSelectedSize(p.sizes[0]);
          if (p.colors?.length) setSelectedColor(p.colors[0]);
        }
      } catch (error) {
        console.error('Error loading product:', error);
        navigate('/produtos');
      }
    };
    loadProduct();
  }, [id, isGrossista, navigate]);

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <StoreNavbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Produto não encontrado</h2>
            <Link to="/produtos" className="text-sm text-gray-500 hover:text-gray-900 underline">
              Voltar aos produtos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const discount = calcDiscount(product.price, product.sale_price);
  const isOutOfStock = product.stock <= 0;
  const displayPrice = product.sale_price && product.sale_price < product.price
    ? product.sale_price : product.price;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, selectedSize, selectedColor, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleReserveSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingReserve(true);
    try {
      const price = product.sale_price || product.price;
      const orderData = {
        customer_name: reserveForm.customer_name,
        customer_phone: reserveForm.customer_phone,
        customer_email: reserveForm.customer_email,
        payment_method: 'Reserva na Loja',
        status: 'Pendente',
        notes: `Data da visita: ${reserveForm.reservation_date}`,
        total: price * quantity,
        items: [
          {
            product_id: product.id,
            name: product.name,
            quantity: quantity,
            price: price,
            size: selectedSize,
            color: selectedColor,
            image: product.images?.[0]
          }
        ]
      };
      
      await api.createOrder(orderData);
      notify('Reserva realizada com sucesso! Te esperamos na loja.', 'success', 4000);
      setIsReserveModalOpen(false);
      setReserveForm({ customer_name: '', customer_phone: '', customer_email: '', reservation_date: '' });
    } catch (error) {
      notify('Erro ao realizar reserva.', 'error');
    } finally {
      setIsSubmittingReserve(false);
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(product, selectedSize, selectedColor, quantity);
    navigate('/carrinho');
  };

  return (
    <div className="min-h-screen bg-white">
      <StoreNavbar />

      <div className="pt-20 lg:pt-24">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <Link to="/" className="hover:text-gray-600 transition-colors">Início</Link>
            <ChevronRight size={14} />
            <Link to="/produtos" className="hover:text-gray-600 transition-colors">Produtos</Link>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>

        {/* Product */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Images */}
            <div className="space-y-4">
              {/* Main image */}
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50">
                <img
                  src={product.images?.[selectedImage] || 'https://via.placeholder.com/600x800?text=Sem+Imagem'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Thumbnails */}
              {product.images?.length > 1 && (
                <div className="flex gap-3">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-20 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImage === i
                          ? 'border-gray-900 ring-2 ring-gray-900/20'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="lg:py-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">
                {product.category}
              </p>
              <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight mb-4">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex flex-col gap-1 mb-6">
                <div className="flex items-center gap-3">
                  <span className={`text-3xl font-bold ${discount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatCurrency(displayPrice * quantity)}
                  </span>
                  {discount > 0 && !isWholesaleMode && (
                    <>
                      <span className="text-lg text-gray-400 line-through">{formatCurrency(product.price * quantity)}</span>
                      <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        -{discount}%
                      </span>
                    </>
                  )}
                </div>
                {isWholesaleMode && (
                  <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md w-fit">
                    Preço Exclusivo Grossista
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-500 leading-relaxed mb-8">
                {product.description}
                {selectedColor && (() => {
                  const colorMap = {
                    'preto': '#000000', 'branco': '#888888', 'cinza': '#6b7280',
                    'azul': '#2563eb', 'azul escuro': '#1e3a5f', 'azul claro': '#60a5fa',
                    'vermelho': '#dc2626', 'verde': '#16a34a', 'amarelo': '#ca8a04',
                    'rosa': '#ec4899', 'roxo': '#9333ea', 'laranja': '#ea580c',
                    'marrom': '#78350f', 'bege': '#a8926e', 'caramelo': '#b5651d',
                    'dourado': '#b8860b', 'prateado': '#a0a0a0', 'prata': '#a0a0a0',
                    'nude': '#c2a68c', 'bordô': '#800020', 'vinho': '#722f37',
                    'coral': '#ff6f61', 'turquesa': '#40e0d0', 'lilás': '#c8a2c8',
                    'creme': '#fffdd0', 'off-white': '#f5f0e1', 'mostarda': '#d4a017',
                    'floral azul': '#4a90d9', 'floral rosa': '#f472b6',
                  };
                  const key = selectedColor.toLowerCase();
                  const cssColor = colorMap[key] || '#374151';
                  return (
                    <span className="block mt-2 font-semibold" style={{ color: cssColor }}>
                      ● Cor selecionada: {selectedColor}
                    </span>
                  );
                })()}
              </p>

              {/* Stock badge */}
              <div className="flex items-center gap-2 mb-6">
                <Package size={16} className={isOutOfStock ? 'text-red-500' : 'text-green-500'} />
                <span className={`text-sm font-medium ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
                  {isOutOfStock ? 'Esgotado' : `${product.stock} em estoque`}
                </span>
              </div>

              {/* Sizes */}
              {product.sizes?.length > 0 && (
                <div className="mb-6">
                  <label className="text-sm font-semibold text-gray-900 mb-3 block">
                    Tamanho
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                          selectedSize === size
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {product.colors?.length > 0 && (
                <div className="mb-8">
                  <label className="text-sm font-semibold text-gray-900 mb-3 block">
                    Cor: <span className="font-normal text-gray-500">{selectedColor}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                          selectedColor === color
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity + Buttons */}
              <div className="space-y-3">
                {/* Quantity selector */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden w-fit">
                    <button
                      onClick={() => setQuantity(q => Math.max(minQuantity, q - 1))}
                      className="p-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      disabled={isOutOfStock || quantity <= minQuantity}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="px-4 text-sm font-semibold min-w-[40px] text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="p-3 hover:bg-gray-50 transition-colors"
                      disabled={isOutOfStock}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {isWholesaleMode && minQuantity > 1 && (
                    <span className="text-xs text-rose-500 font-medium">Pedido mínimo: {minQuantity} unidades</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    {/* Buy Now */}
                    <button
                      onClick={handleBuyNow}
                      disabled={isOutOfStock}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all ${
                        isOutOfStock
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-rose-400 text-white hover:bg-rose-500 active:scale-[0.98] shadow-sm shadow-rose-400/20'
                      }`}
                    >
                      {isOutOfStock ? 'Esgotado' : 'Comprar'}
                    </button>

                    {/* Add to Cart */}
                    <button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all border ${
                        isOutOfStock
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : added
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-gray-900 border-gray-300 hover:border-gray-900 hover:bg-gray-50 active:scale-[0.98]'
                      }`}
                    >
                      {added ? (
                        <>
                          <Check size={18} />
                          Adicionado!
                        </>
                      ) : isOutOfStock ? (
                        'Esgotado'
                      ) : (
                        <>
                          <ShoppingBag size={18} />
                          Adicionar à Cesta
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Reserve in Store */}
                  <button
                    onClick={() => setIsReserveModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-white text-gray-900 border border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-all active:scale-[0.98]"
                  >
                    Reservar na Loja
                  </button>
                </div>
              </div>

              {/* SKU */}
              {product.sku && (
                <p className="text-xs text-gray-400 mt-6">SKU: {product.sku}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <Modal isOpen={isReserveModalOpen} onClose={() => setIsReserveModalOpen(false)} title="Reservar na Loja" size="md">
        <form onSubmit={handleReserveSubmit} className="space-y-4 text-left">
          <p className="text-sm text-gray-600 bg-rose-50 p-3 rounded-lg border border-rose-100">
            A reserva é válida por 48 horas. Você pode experimentar e pagar o produto diretamente na loja física.
          </p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Seu Nome *</label>
            <input type="text" required className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400"
                   value={reserveForm.customer_name} onChange={(e) => setReserveForm({...reserveForm, customer_name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Telefone / WhatsApp *</label>
            <input type="tel" required className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400"
                   value={reserveForm.customer_phone} onChange={(e) => setReserveForm({...reserveForm, customer_phone: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail</label>
            <input type="email" className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400"
                   value={reserveForm.customer_email} onChange={(e) => setReserveForm({...reserveForm, customer_email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Data da Visita *</label>
            <input type="date" required className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400"
                   value={reserveForm.reservation_date} onChange={(e) => setReserveForm({...reserveForm, reservation_date: e.target.value})} />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={() => setIsReserveModalOpen(false)} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl">Cancelar</button>
            <button type="submit" disabled={isSubmittingReserve} className="px-5 py-2 bg-rose-400 font-bold text-white rounded-xl hover:bg-rose-500 disabled:opacity-50">
              {isSubmittingReserve ? 'Aguarde...' : 'Confirmar Reserva'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductDetail;
