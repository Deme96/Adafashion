// ========== Ada Fashion Stock Control Page ==========
import { useState, useEffect, useMemo } from 'react';
import { Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Warehouse, Search } from 'lucide-react';
import api from '../../lib/api';
import Badge from '../../components/ui/Badge';

const Stock = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const prods = await api.getAllProducts();
        const orders = await api.getAllOrders();
        setProducts(prods || []);
        setOrders(orders || []);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // Calculate flow for each product
  const stockFlow = useMemo(() => {
    return products.map(product => {
      // Calculate total sold
      let totalSold = 0;
      orders.forEach(order => {
        if (order.status !== 'cancelled') {
          order.items?.forEach(item => {
            if (item.id === product.id || item.product_id === product.id) {
              totalSold += item.quantity;
            }
          });
        }
      });

      // Calculate theoretical total bought (Entradas) based on current stock + sold
      const currentStock = parseInt(product.stock) || 0;
      const totalBought = currentStock + totalSold;
      
      let status = 'ok';
      if (currentStock === 0) status = 'esgotado';
      else if (currentStock <= 5) status = 'critico';
      else if (currentStock <= 10) status = 'baixo';

      return {
        ...product,
        currentStock,
        totalSold,
        totalBought,
        status
      };
    }).sort((a, b) => a.currentStock - b.currentStock);
  }, [products, orders]);

  const filteredFlow = useMemo(() => {
    return stockFlow.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || 
                           (filter === 'alerts' && (p.status === 'esgotado' || p.status === 'critico')) ||
                           p.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [stockFlow, search, filter]);

  // Metrics
  const totalProducts = products.length;
  const totalItemsInStock = stockFlow.reduce((acc, p) => acc + p.currentStock, 0);
  const lowStockCount = stockFlow.filter(p => p.status === 'baixo' || p.status === 'critico').length;
  const outOfStockCount = stockFlow.filter(p => p.status === 'esgotado').length;
  
  const criticalItems = stockFlow.filter(p => p.status === 'critico' || p.status === 'esgotado');

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="font-fashion text-3xl font-bold text-rose-500 tracking-tight">Controle de Estoque</h1>
        <p className="text-gray-500 text-sm mt-1">Monitore o fluxo de mercadorias e reabastecimento</p>
      </div>

      {/* Alerts Section */}
      {criticalItems.length > 0 && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-4 items-start">
          <div className="bg-red-100 text-red-600 p-2 rounded-xl shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-red-800">Atenção Necessária</h3>
            <p className="text-sm text-red-600 mt-1">
              Você possui <strong>{criticalItems.length}</strong> produto(s) com estoque crítico ou esgotado que precisam de reabastecimento imediato.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <Package size={18} />
            <h3 className="text-sm font-semibold">Total de Produtos</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <Warehouse size={18} />
            <h3 className="text-sm font-semibold">Total de Peças</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalItemsInStock}</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm">
          <div className="flex items-center gap-3 text-orange-600 mb-2">
            <AlertTriangle size={18} />
            <h3 className="text-sm font-semibold">Estoque Baixo</h3>
          </div>
          <p className="text-3xl font-bold text-orange-700">{lowStockCount}</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <AlertTriangle size={18} />
            <h3 className="text-sm font-semibold">Esgotados</h3>
          </div>
          <p className="text-3xl font-bold text-red-700">{outOfStockCount}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-pink-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-300"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-4 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-300 outline-none"
          >
            <option value="all">Todos os Produtos</option>
            <option value="alerts">Com Alertas (Baixo/Crítico)</option>
            <option value="ok">Estoque OK</option>
            <option value="baixo">Estoque Baixo</option>
            <option value="critico">Estoque Crítico</option>
            <option value="esgotado">Esgotados</option>
          </select>
        </div>
      </div>

      {/* Flow Table */}
      <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-rose-50/50">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Produto</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Entradas (Histórico)</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Saídas (Vendas)</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Saldo (Físico)</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredFlow.map(p => (
                <tr key={p.id} className="hover:bg-rose-50/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center text-rose-300 shrink-0">
                        {p.image ? <img src={p.image} className="w-full h-full object-cover rounded-lg" alt="" /> : <Package size={16} />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400 font-mono">#{String(p.id ?? '').slice(-6).toUpperCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg font-medium">
                      <ArrowDownRight size={14} /> {p.totalBought}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-lg font-medium">
                      <ArrowUpRight size={14} /> {p.totalSold}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-gray-900 text-lg">{p.currentStock}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {p.status === 'esgotado' ? (
                      <Badge variant="error">Esgotado</Badge>
                    ) : p.status === 'critico' ? (
                      <Badge variant="error">Crítico</Badge>
                    ) : p.status === 'baixo' ? (
                      <Badge variant="warning">Baixo</Badge>
                    ) : (
                      <Badge variant="success">OK</Badge>
                    )}
                  </td>
                </tr>
              ))}
              {filteredFlow.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    Nenhum produto atende a este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Stock;
