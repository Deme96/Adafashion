// ========== Ada Fashion Orders Page ==========
import { useState, useEffect, useMemo } from 'react';
import api from '../../lib/api';
import { formatCurrency, formatDate, ORDER_STATUS } from '../../lib/utils';
import { Search, Eye, Filter, Pencil, CheckCircle, XCircle } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Custom Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const orders = await api.getAllOrders();
      setOrders((orders || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = 
        o.id.toLowerCase().includes(search.toLowerCase()) || 
        o.customer_name?.toLowerCase().includes(search.toLowerCase());
        
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const oDate = new Date(o.created_at);
        const now = new Date();
        if (dateFilter === 'today') {
          matchesDate = oDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'month') {
          matchesDate = oDate.getMonth() === now.getMonth() && oDate.getFullYear() === now.getFullYear();
        }
      }
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, search, statusFilter, dateFilter]);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.updateOrder(id, { status: newStatus });
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="font-fashion text-3xl font-bold text-rose-500 tracking-tight">Compras</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie as compras online dos clientes</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-pink-100 flex flex-col md:flex-row gap-4">
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
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-4 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-300 outline-none"
          >
            <option value="all">Status: Todos</option>
            {Object.keys(ORDER_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
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

      <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-rose-50/50">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Cliente</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Data</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Total</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-rose-50/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">#{String(order.id ?? '').slice(-6).toUpperCase()}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{order.customer_name || 'Balcão'}</td>
                  <td className="py-3 px-4">
                    <Badge variant={order.status === 'Entregue' ? 'success' : order.status === 'Cancelado' ? 'error' : order.status === 'Enviado' ? 'info' : 'warning'}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{formatDate(order.created_at)}</td>
                  <td className="py-3 px-4 font-bold">{formatCurrency(order.total)}</td>
                  <td className="py-3 px-4 text-right flex items-center justify-end gap-1">
                    <button onClick={() => setSelectedOrder(order)} className="p-2 rounded-lg hover:bg-rose-100 text-gray-400 hover:text-rose-700 transition-colors" title="Ver Detalhes"><Eye size={15} /></button>
                    {order.status !== 'Entregue' && order.status !== 'Cancelado' && (
                      <button
                        onClick={() => updateStatus(order.id, 'Entregue')}
                        className="p-2 rounded-lg hover:bg-green-100 text-gray-400 hover:text-green-700 transition-colors"
                        title="Concluir Entrega"
                      >
                        <CheckCircle size={15} />
                      </button>
                    )}
                    {order.status !== 'Cancelado' && (
                        <button
                          onClick={() => { if(confirm('Tem certeza que deseja anular esta venda?')) updateStatus(order.id, 'Cancelado'); }}
                          className="p-2 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-700 transition-colors"
                          title="Anular Venda"
                        >
                          <XCircle size={15} />
                        </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-400">Nenhuma compra encontrada</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Detalhes da Compra" size="md">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Compra <span className="font-mono text-gray-900">#{String(selectedOrder.id ?? '').slice(-6).toUpperCase()}</span></p>
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
              <p className="font-medium text-gray-900">{selectedOrder.customer_name || 'Balcão'}</p>
              {selectedOrder.customer_email && <p className="text-sm text-gray-500">{selectedOrder.customer_email}</p>}
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Itens da Compra</h3>
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

export default Orders;
