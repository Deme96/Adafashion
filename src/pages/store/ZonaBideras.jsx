// ========== Ada Fashion Zona di Bideras ==========
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, AlertCircle, Search, X } from 'lucide-react';
import api from '../../lib/api';
import { CATEGORIES } from '../../lib/utils';
import { getLoggedCustomer } from '../../lib/customerAuth';
import StoreNavbar from '../../components/store/StoreNavbar';
import Footer from '../../components/store/Footer';
import WholesaleProductCard from '../../components/store/WholesaleProductCard';

const ZonaBideras = () => {
  const [products, setProducts] = useState([]);
  const customer = getLoggedCustomer();
  const navigate = useNavigate();
  const isGrossista = customer?.account_type === 'grossista';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    if (!customer) {
      navigate('/login', { state: { from: '/zona-bideras' }, replace: true });
      return;
    }

    if (isGrossista) {
      const loadProducts = async () => {
        try {
          const allProducts = await api.getAllProducts();
          const wholesale = (allProducts || []).filter(p => p.is_active && p.wholesale_price);
          
          const wholesaleProducts = wholesale.map(p => ({
            ...p,
            original_price: p.price,
            original_sale_price: p.sale_price,
            price: p.wholesale_price,
            sale_price: null,
            is_wholesale: true
          }));
          
          setProducts(wholesaleProducts);
        } catch (error) {
          console.error('Error loading wholesale products:', error);
        }
      };
      loadProducts();
    }
  }, [customer, isGrossista, navigate]);

  const filtered = products.filter(p => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.category?.toLowerCase().includes(q)) return false;
    }
    if (category && p.category !== category) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setSortBy('recent');
  };

  const hasFilters = search || category || sortBy !== 'recent';

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <StoreNavbar />

      <div className="pt-24 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-rose-400 rounded-3xl p-8 sm:p-12 text-center text-white mb-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-pink-500 opacity-90" />
            <div className="relative z-10">
              <h1 className="font-fashion text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                Zona di Bideras
              </h1>
              <p className="text-rose-100 max-w-2xl mx-auto text-lg">
                Área exclusiva para grossistas. Aproveite os nossos preços especiais de revenda.
              </p>
            </div>
          </div>

          {isGrossista && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 mb-8">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou categoria..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white"
              >
                <option value="">Todas as categorias</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white"
              >
                <option value="recent">Mais recentes</option>
                <option value="price-asc">Menor preço</option>
                <option value="price-desc">Maior preço</option>
              </select>
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-rose-700 hover:bg-rose-50 transition-colors">
                  <X size={16} /> Limpar
                </button>
              )}
            </div>
          )}

          {!isGrossista ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Esta área é exclusiva para clientes com conta de grossista. Se você é um revendedor, crie uma conta de grossista para ter acesso aos preços especiais.
              </p>
              <Link to="/cadastro" className="inline-flex items-center gap-2 bg-rose-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-rose-600 transition-colors">
                Criar Conta Grossista
              </Link>
            </div>
          ) : (
            <>
              {filtered.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Package size={32} className="text-gray-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum produto encontrado</h2>
                  <p className="text-gray-500">
                    Não encontramos produtos correspondentes aos seus filtros.
                  </p>
                  {hasFilters && (
                    <button onClick={clearFilters} className="mt-4 text-sm font-medium text-rose-700 underline hover:no-underline">
                      Limpar filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {filtered.map(product => (
                    <WholesaleProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ZonaBideras;
