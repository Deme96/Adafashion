// ========== Ada Fashion Dashboard ==========
import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Package,
  Users, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import api from '../../lib/api';
import { formatCurrency, getLastMonths, PAYMENT_METHODS } from '../../lib/utils';
import StatsCard from '../../components/admin/StatsCard';

const COLORS = ['#be185d', '#ec4899', '#f472b6', '#f9a8d4', '#fce7f3', '#9f1239', '#e11d48', '#fb7185'];

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const orders = await api.getAllOrders();
        const products = await api.getAllProducts();
        setOrders(orders || []);
        setPurchases(products || []); // Link purchases to products (stock purchases)
        setProducts(products || []);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };
    loadData();
  }, []);

  // ---- Stats ----
  const stats = useMemo(() => {
    const delivered = orders.filter(o => o.status === 'Entregue' || o.status === 'Concluído' || o.payment_status === 'paid');
    const pending = orders.filter(o => o.status === 'Pendente');
    const totalRevenue = delivered.reduce((s, o) => s + (o.total || 0), 0);
    const totalExpenses = purchases
      .filter(p => p.status !== 'Cancelado')
      .reduce((s, p) => s + (parseFloat(p.total_cost) || 0), 0);
    const totalProducts = products.length;
    const lowStock = products.filter(p => p.stock <= 5 && p.stock > 0).length;

    return { delivered: delivered.length, pending: pending.length, totalRevenue, totalExpenses, totalProducts, lowStock };
  }, [orders, purchases, products]);

  // ---- Sales vs Purchases by Day (Last 7 Days) ----
  const dailyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = i === 0 ? 'Hoje' : i === 1 ? 'Ontem' : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      days.push({ key, label });
    }

    return days.map(d => {
      const dayOrders = orders.filter(o => {
        if (o.status === 'Cancelado') return false;
        const date = new Date(o.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return key === d.key;
      });
      
      const dayPurchases = purchases.filter(p => {
        if (p.status === 'Cancelado') return false;
        const dateStr = p.purchase_date || p.created_at;
        const date = new Date(dateStr);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return key === d.key;
      });

      return {
        name: d.label,
        Vendas: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
        Compras: dayPurchases.reduce((s, p) => s + (parseFloat(p.total_cost) || 0), 0),
      };
    });
  }, [orders, purchases]);

  // ---- Most/Least ordered products (horizontal bar chart) ----
  const productOrderData = useMemo(() => {
    const productCounts = {};

    orders.forEach(order => {
      if (order.status === 'Cancelado') return;
      (order.items || []).forEach(item => {
        const name = item.product_name || item.name || 'Desconhecido';
        productCounts[name] = (productCounts[name] || 0) + (Number(item.quantity) || 1);
      });
    });

    // Also include products with zero orders
    products.forEach(p => {
      if (!productCounts[p.name]) {
        productCounts[p.name] = 0;
      }
    });

    const sorted = Object.entries(productCounts)
      .map(([name, qty]) => ({ name: name.length > 20 ? name.substring(0, 20) + '...' : name, fullName: name, Pedidos: qty }))
      .sort((a, b) => b.Pedidos - a.Pedidos);

    return sorted;
  }, [orders, products]);

  // Split into most and least ordered
  const mostOrdered = productOrderData.slice(0, 5);
  const leastOrdered = [...productOrderData].sort((a, b) => a.Pedidos - b.Pedidos).slice(0, 5);

  // ---- Payment methods pie chart ----
  const paymentData = useMemo(() => {
    const counts = {};
    PAYMENT_METHODS.forEach(m => counts[m] = 0);
    
    orders.filter(o => o.status !== 'Cancelado').forEach(o => {
      let method = o.payment_method || 'Outro';
      if (!PAYMENT_METHODS.includes(method)) method = 'Outro';
      counts[method] = (counts[method] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-xl shadow-lg border border-pink-100 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
          {payload.map((entry, i) => (
            <p key={i} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' && entry.name !== 'Pedidos'
                ? formatCurrency(entry.value)
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="font-fashion text-3xl font-bold text-rose-500 tracking-tight">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral do seu negócio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={DollarSign}
          label="Receita Total"
          value={formatCurrency(stats.totalRevenue)}
          color="green"
        />
        <StatsCard
          icon={ShoppingBag}
          label="Vendas Concluídas"
          value={stats.delivered}
          sublabel={`${stats.pending} pendentes`}
          color="blue"
        />
        <StatsCard
          icon={Package}
          label="Produtos"
          value={stats.totalProducts}
          sublabel={stats.lowStock > 0 ? `${stats.lowStock} com estoque baixo` : 'Estoque OK'}
          color="purple"
        />
        <StatsCard
          icon={TrendingDown}
          label="Despesas"
          value={formatCurrency(stats.totalExpenses)}
          color="red"
        />
      </div>

      {/* Charts Row 1: Sales vs Purchases */}
      <div className="bg-white rounded-2xl border border-pink-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Vendas vs Compras (Últimos 7 dias)</h2>
            <p className="text-xs text-gray-500">Dados diários em tempo real</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-600" />
              <span className="text-gray-500">Vendas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-pink-300" />
              <span className="text-gray-500">Compras</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `XOF${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="Vendas" stroke="#be185d" strokeWidth={3} dot={{ fill: '#be185d', r: 5 }} activeDot={{ r: 7 }} />
            <Line type="monotone" dataKey="Compras" stroke="#f9a8d4" strokeWidth={3} dot={{ fill: '#f9a8d4', r: 5 }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Row 2: Most/Least Ordered + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Ordered Products */}
        <div className="bg-white rounded-2xl border border-pink-100 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ArrowUpRight size={18} className="text-green-500" />
              Produtos Mais Pedidos
            </h2>
            <p className="text-xs text-gray-500">Top 5 produtos por quantidade pedida</p>
          </div>
          {mostOrdered.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mostOrdered} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Pedidos" fill="#be185d" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">
              Sem dados de pedidos ainda
            </div>
          )}
        </div>

        {/* Least Ordered Products */}
        <div className="bg-white rounded-2xl border border-pink-100 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ArrowDownRight size={18} className="text-red-500" />
              Produtos Menos Pedidos
            </h2>
            <p className="text-xs text-gray-500">5 produtos com menor demanda</p>
          </div>
          {leastOrdered.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={leastOrdered} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Pedidos" fill="#f9a8d4" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">
              Sem dados de pedidos ainda
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods Pie */}
      <div className="bg-white rounded-2xl border border-pink-100 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Métodos de Pagamento</h2>
          <p className="text-xs text-gray-500">Distribuição por forma de pagamento</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-8">
          {paymentData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250} className="max-w-[300px]">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentData.map((entry, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-4">
                {paymentData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-gray-600">{entry.name}</span>
                    <span className="text-sm font-bold text-gray-900">({entry.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="w-full h-[250px] flex items-center justify-center text-sm text-gray-400">
              Sem dados de pagamento ainda
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
