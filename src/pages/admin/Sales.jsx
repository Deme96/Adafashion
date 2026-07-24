// ========== Ada Fashion Sales Page ==========
import { useState, useEffect, useMemo } from 'react';
import api from '../../lib/api';
import { formatCurrency, formatDate, ORDER_STATUS } from '../../lib/utils';
import { DollarSign, Search, Filter, Download, Printer, ShoppingBag, Package, Plus, Eye, CheckCircle, XCircle } from 'lucide-react';
import StatsCard from '../../components/admin/StatsCard';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import PrintDateModal from '../../components/ui/PrintDateModal';

const Sales = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  
  // Custom Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Print State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDateRange, setPrintDateRange] = useState({ start: '', end: '' });
  const [printStatus, setPrintStatus] = useState('all');
  
  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New manual sale state
  const [newSale, setNewSale] = useState({
    customer_name: '',
    customer_email: '',
    payment_method: 'Orange Money',
    product_id: '',
    quantity: 1,
    total: 0
  });

  useEffect(() => {
    loadSales();
    loadProducts();
  }, []);

  const loadSales = async () => {
    const orders = await api.getAllOrders();
    setOrders((orders || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  };

  const loadProducts = async () => {
    const prods = await api.getAllProducts();
    setProducts((prods || []).filter(p => p.is_active));
  };

  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (String(order.payment_method).startsWith('Reserva') && order.payment_status !== 'paid' && order.status !== 'Entregue' && order.status !== 'delivered' && order.status !== 'Concluído') return false;
      const matchesSearch = 
        order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        String(order.id ?? '').toLowerCase().includes(search.toLowerCase());
        
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || order.payment_method === paymentFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.created_at);
        const now = new Date();
        if (dateFilter === 'today') {
          matchesDate = orderDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'month') {
          matchesDate = orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        }
      }

      if (printDateRange.start && printDateRange.end) {
        const orderDate = new Date(order.created_at);
        const startDate = new Date(printDateRange.start);
        const endDate = new Date(printDateRange.end);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        if (orderDate < startDate || orderDate > endDate) {
          matchesDate = false;
        }
      }

      const matchesPrintStatus = printStatus === 'all' || order.status === printStatus;

      return matchesSearch && matchesStatus && matchesPayment && matchesDate && matchesPrintStatus;
    });
  }, [orders, search, statusFilter, paymentFilter, dateFilter, printDateRange, printStatus]);

  // Consider only finalized orders for stats (Entregue, Concluído, or Paid Reservations)
  const validOrders = filteredOrders.filter(o => 
    o.status !== 'Cancelado' && o.status !== 'cancelled' && 
    (o.status === 'Entregue' || o.status === 'delivered' || o.status === 'Concluído' || o.payment_status === 'paid')
  );
  const totalRevenue = useMemo(() => validOrders.reduce((s, o) => s + (o.total || 0), 0), [validOrders]);
  const totalItems = useMemo(() => validOrders.reduce((s, o) => s + (o.items || []).reduce((si, i) => si + (i.quantity || 1), 0), 0), [validOrders]);

  // Auto calculate total for manual sales
  useEffect(() => {
    if (newSale.product_id) {
      const prod = products.find(p => p.id === newSale.product_id);
      if (prod) {
        const price = prod.sale_price || prod.price;
        setNewSale(prev => ({ ...prev, total: price * prev.quantity }));
      }
    }
  }, [newSale.product_id, newSale.quantity, products]);

  const handleSaveSale = async (e) => {
    e.preventDefault();
    let items = [];
    
    if (newSale.product_id) {
       const prod = products.find(p => p.id === newSale.product_id);
       if (prod) {
         const price = prod.sale_price || prod.price;
         items = [{ product_id: prod.id, name: prod.name, quantity: Number(newSale.quantity), price }];
         // Reduce stock
         await api.updateProduct(prod.id, { stock: Math.max(0, prod.stock - Number(newSale.quantity)) });
       }
    } else {
       items = [{ name: 'Venda Manual Avulsa', quantity: 1, price: Number(newSale.total) }];
    }
    
    const saleData = {
      customer_name: newSale.customer_name,
      customer_email: newSale.customer_email,
      payment_method: newSale.payment_method,
      status: 'Entregue',
      items,
      total: Number(newSale.total)
    };
    await api.createOrder(saleData);
    setIsModalOpen(false);
    setNewSale({ customer_name: '', customer_email: '', payment_method: 'Orange Money', product_id: '', quantity: 1, total: 0 });
    await loadSales();
  };

  const updateStatus = async (id, newStatus) => {
    await api.updateOrder(id, { status: newStatus });
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    await loadSales();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print-hide">
        <div>
          <h1 className="font-fashion text-3xl font-bold text-rose-500 tracking-tight">Vendas</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie as compras online e vendas manuais</p>
        </div>
        <div className="flex items-center gap-3 print-hide">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
          >
            <Printer size={16} />
            Imprimir
          </button>
          <button
            onClick={() => {
              setNewSale({ customer_name: '', customer_email: '', payment_method: 'Orange Money', product_id: '', quantity: 1, total: 0 });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-rose-400 text-white rounded-xl hover:bg-rose-500 transition-colors text-sm font-medium shadow-sm shadow-rose-400/20"
          >
            <Plus size={16} />
            Nova Venda
          </button>
        </div>
      </div>

      {/* Filters (Hidden in print) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-pink-100 flex flex-col md:flex-row gap-4 print-hide">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-300"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-4 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-300 outline-none"
          >
            <option value="all">Status: Todos</option>
            {Object.keys(ORDER_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="pl-4 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-300 outline-none"
          >
            <option value="all">Pagamento: Todos</option>
            <option value="Orange Money">Orange Money</option>
            <option value="Teletacu">Teletacu</option>
            <option value="Visa">Visa</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-4 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-300 outline-none"
          >
            <option value="all">Data: Todas</option>
            <option value="today">Hoje</option>
            <option value="month">Este Mês</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print-hide">
        <StatsCard icon={ShoppingBag} label="Vendas Ativas" value={validOrders.length} color="green" />
        <StatsCard icon={DollarSign} label="Receita Estimada" value={formatCurrency(totalRevenue)} color="blue" />
        <StatsCard icon={Package} label="Itens Vendidos" value={totalItems} color="purple" />
      </div>

      {/* Print Area — only this block prints */}
      <div className="print-area">
        {/* Print Header (hidden on screen, visible on print) */}
        <div className="print-header hidden">
          <h1>Ada Fashion — Relatório de Vendas</h1>
          <p>
            {printDateRange.start && printDateRange.end
              ? `Período: ${printDateRange.start} a ${printDateRange.end}`
              : 'Todas as datas'}
            {printStatus !== 'all' ? ` | Status: ${printStatus}` : ''}
          </p>
        </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-rose-50/50">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Cliente</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden sm:table-cell">Pagamento</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Total</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden md:table-cell">Data</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600 print-hide">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-rose-50/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">#{String(order.id ?? '').slice(-6).toUpperCase()}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{order.customer_name || 'Cliente Balcão'}</td>
                  <td className="py-3 px-4">
                    <Badge variant={order.status === 'Entregue' ? 'success' : order.status === 'Cancelado' ? 'error' : order.status === 'Enviado' ? 'info' : 'warning'}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell text-gray-600">
                    {order.payment_method}
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-900">{formatCurrency(order.total)}</td>
                  <td className="py-3 px-4 text-gray-500 hidden md:table-cell">{formatDate(order.created_at)}</td>
                  <td className="py-3 px-4 text-right print-hide flex items-center justify-end gap-1">
                    <button onClick={() => setSelectedOrder(order)} className="p-2 rounded-lg hover:bg-rose-100 text-gray-400 hover:text-rose-700 transition-colors" title="Ver Detalhes">
                      <Eye size={16} />
                    </button>
                    {order.status !== 'Entregue' && order.status !== 'Cancelado' && (
                        <button
                          onClick={() => updateStatus(order.id, 'Entregue')}
                          className="p-2 rounded-lg hover:bg-green-100 text-gray-400 hover:text-green-700 transition-colors"
                          title="Concluir Entrega"
                        >
                          <CheckCircle size={16} />
                        </button>
                    )}
                    {order.status !== 'Cancelado' && (
                        <button
                          onClick={() => { if(confirm('Tem certeza que deseja anular esta venda?')) updateStatus(order.id, 'Cancelado'); }}
                          className="p-2 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-700 transition-colors"
                          title="Anular Venda"
                        >
                          <XCircle size={16} />
                        </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">Nenhuma venda encontrada</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Manual Sale Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Lançar Venda Manual">
        <form onSubmit={handleSaveSale} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nome do Cliente</label>
              <input type="text" required className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-300" value={newSale.customer_name} onChange={e => setNewSale({...newSale, customer_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail do Cliente (Opcional)</label>
              <input type="email" className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-300" value={newSale.customer_email} onChange={e => setNewSale({...newSale, customer_email: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Produto (Opcional)</label>
              <select className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-300 bg-white" value={newSale.product_id} onChange={e => setNewSale({...newSale, product_id: e.target.value})}>
                <option value="">-- Venda Avulsa (Sem produto) --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.sale_price || p.price)} (Estoque: {p.stock})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Peças / Qtd</label>
              <input type="number" min="1" required className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-300" value={newSale.quantity} onChange={e => setNewSale({...newSale, quantity: Number(e.target.value)})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Método de Pagamento</label>
              <select className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-300 bg-white" value={newSale.payment_method} onChange={e => setNewSale({...newSale, payment_method: e.target.value})}>
                <option value="Orange Money">Orange Money</option>
                <option value="Teletacu">Teletacu</option>
                <option value="Visa">Visa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Total da Venda (XOF)</label>
              <input type="number" step="0.01" required min="0" className="w-full p-2.5 border border-rose-300 rounded-xl bg-rose-50 text-rose-500 font-bold focus:outline-none focus:border-rose-400" value={newSale.total} onChange={e => setNewSale({...newSale, total: Number(e.target.value)})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl">Cancelar</button>
            <button type="submit" className="px-5 py-2 bg-rose-400 font-bold text-white rounded-xl hover:bg-rose-500">Concluir Venda</button>
          </div>
        </form>
      </Modal>

      {/* Print Date Modal */}
      <PrintDateModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        statusOptions={Object.keys(ORDER_STATUS)}
        onConfirm={(start, end, status) => {
          setPrintDateRange({ start, end });
          setPrintStatus(status);
          setIsPrintModalOpen(false);
          setTimeout(() => {
            window.print();
            // setPrintDateRange({ start: '', end: '' }); // Optional reset
          }, 100);
        }}
      />

      {/* Order Details Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Detalhes da Venda" size="md">
        {selectedOrder && (
          <div className="space-y-6 text-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Venda <span className="font-mono text-gray-900">#{String(selectedOrder.id ?? '').slice(-6).toUpperCase()}</span></p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <select
                value={selectedOrder.status}
                onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:border-rose-400"
              >
                {Object.keys(ORDER_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Cliente</h3>
              <p className="font-medium text-gray-900">{selectedOrder.customer_name || 'Cliente Balcão'}</p>
              {selectedOrder.customer_email && <p className="text-sm text-gray-500">{selectedOrder.customer_email}</p>}
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Itens</h3>
              <div className="space-y-3">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center text-rose-300">
                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" /> : <Package size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.quantity}x {formatCurrency(item.price)}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Pagamento</p>
                <p className="font-semibold text-gray-900">{selectedOrder.payment_method}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase">Total</p>
                <span className="text-xl font-bold text-rose-500">{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>

            {selectedOrder.status !== 'Cancelado' && (
              <div className="mt-4 flex gap-3">
                {selectedOrder.status !== 'Entregue' && (
                  <button
                    onClick={() => { updateStatus(selectedOrder.id, 'Entregue'); setSelectedOrder(null); }}
                    className="flex-1 py-2.5 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} /> Concluir Entrega
                  </button>
                )}
                <button
                  onClick={() => { if(confirm('Tem certeza que deseja anular esta venda?')) { updateStatus(selectedOrder.id, 'Cancelado'); setSelectedOrder(null); } }}
                  className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle size={16} /> Anular Venda
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Sales;
