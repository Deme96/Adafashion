// ========== Ada Fashion Products Page ==========
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import api from '../../lib/api';
import { CATEGORIES } from '../../lib/utils';
import StoreNavbar from '../../components/store/StoreNavbar';
import ProductCard from '../../components/store/ProductCard';
import Footer from '../../components/store/Footer';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState(searchParams.get('busca') || '');
  const [category, setCategory] = useState(searchParams.get('categoria') || '');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    const q = searchParams.get('busca');
    if (q !== null) {
      setSearch(q);
    }
  }, [searchParams]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const allProducts = await api.getAllProducts();
      setProducts((allProducts || []).filter(p => p.is_active));
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const filtered = useMemo(() => {
    let result = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }
    if (category) {
      result = result.filter(p => p.category === category);
    }
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
        break;
      case 'recent':
      default:
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }
    return result;
  }, [products, search, category, sortBy]);

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setSortBy('recent');
    setSearchParams({});
  };

  const hasFilters = search || category || sortBy !== 'recent';

  return (
    <div className="min-h-screen bg-white">
      <StoreNavbar />

      {/* Header */}
      <div className="bg-gradient-to-b from-rose-900 to-rose-800 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-fashion text-4xl sm:text-5xl font-bold italic text-white tracking-tight">Produtos</h1>
          <p className="text-rose-300/60 mt-2">Explore nossa coleção completa</p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 lg:top-20 z-20 bg-white/95 backdrop-blur-md border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar produtos..."
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
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
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
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-sm text-gray-500 mb-6">
          {filtered.length} {filtered.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
        </p>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 stagger-children">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <SlidersHorizontal size={24} className="text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhum produto encontrado</h3>
            <p className="text-sm text-gray-500 mb-4">Tente ajustar os filtros ou a busca</p>
            <button onClick={clearFilters} className="text-sm font-medium text-rose-700 underline hover:no-underline">
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Products;
