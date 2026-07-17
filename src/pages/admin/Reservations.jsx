// ========== Ada Fashion Reservations Page ==========
import { useState, useEffect, useMemo } from 'react';
import api from '../../lib/api';
import { formatCurrency, formatDate, formatDateTime, ORDER_STATUS } from '../../lib/utils';
import { Search, Printer, Trash2, Eye, CalendarClock, Clock, CheckCircle, Package } from 'lucide-react';
import StatsCard from '../../components/admin/StatsCard';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import PrintDateModal from '../../components/ui/PrintDateModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const getDisplayId = (value) => String(value ?? '').slice(-6).toUpperCase();
const getStatusValue = (value) => String(value ?? '').trim();

const Reservations = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  
  // Custom Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Print State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDateRange, setPrintDateRange] = useState({ start: '', end: '' });
  const [printStatus, setPrintStatus] = useState('all');
  
  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState(null);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const allOrders = await api.getAllOrders();
      const reservations = (allOrders || []).filter(o => o.payment_method === 'Reserva na Loja')
                                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(reservations);
    } catch (error) {
      console.error('Error loading reservations:', error);
    }
  };

  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        String(order.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
        String(order.id ?? '').toLowerCase().includes(search.toLowerCase());
        
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
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

      return matchesSearch && matchesStatus && matchesDate && matchesPrintStatus;
    });
  }, [orders, search, statusFilter, dateFilter, printDateRange, printStatus]);

  // Stats
  const validOrders = filteredOrders.filter(o => getStatusValue(o.status) !== 'Cancelado');
  const pendingReservations = validOrders.filter(o => getStatusValue(o.status) === 'Pendente');
  const completedReservations = validOrders.filter(o => ['Entregue', 'Enviado'].includes(getStatusValue(o.status)));
  const totalValue = useMemo(() => pendingReservations.reduce((s, o) => s + Number(o.total || 0), 0), [pendingReservations]);

  const updateStatus = async (id, newStatus) => {
    try {
      const normalizedId = String(id);
      await api.updateOrder(normalizedId, { status: newStatus });
      if (selectedOrder && String(selectedOrder.id) === normalizedId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      await api.createActivityLog({
        action: 'Status da Reserva Atualizado',
        details: `Reserva #${getDisplayId(id)} para ${newStatus}`,
        user_name: null,
        entity_type: 'order',
        entity_id: normalizedId,
      });
      loadReservations();
    } catch (error) {
      console.error('Error updating reservation status:', error);
    }
  };

  const removeReservation = async (id) => {
    try {
      const normalizedId = String(id);
      await api.deleteOrder(normalizedId);
      await api.createActivityLog({
        action: 'Reserva Removida',
        details: `Reserva #${getDisplayId(id)} removida`,
        user_name: null,
        entity_type: 'order',
        entity_id: normalizedId,
      });
      if (selectedOrder && String(selectedOrder.id) === normalizedId) {
        setSelectedOrder(null);
      }
      loadReservations();
    } catch (error) {
      console.error('Error removing reservation:', error);
    }
  };

  const confirmRemoveReservation = (order) => {
    setReservationToDelete(order);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmed = () => {
    if (!reservationToDelete) return;
    removeReservation(reservationToDelete.id);
    setReservationToDelete(null);
    setDeleteConfirmOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print-hide">
        <div>
          <h1 className="font-fashion text-3xl font-bold text-rose-500 tracking-tight">Reservas</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie os pedidos reservados para pagamento na loja</p>
        </div>
        <div className="flex items-center gap-3 print-hide">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
          >
            <Printer size={16} />
            Imprimir
          </button>
        </div>
      </div>

      {/* Filters (Hidden in print) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-pink-100 flex flex-col md:flex-row gap-4 print-hide">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar reserva por cliente ou ID..."
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
        <StatsCard icon={Clock} label="Reservas Pendentes" value={pendingReservations.length} color="blue" />
        <StatsCard icon={CalendarClock} label="Valor em Espera" value={formatCurrency(totalValue)} color="yellow" />
        <StatsCard icon={CheckCircle} label="Reservas Concluídas" value={completedReservations.length} color="green" />
      </div>

      {/* Print Area — only this block prints */}
      <div className="print-area">
        {/* Print Header (hidden on screen, visible on print) */}
        <div className="print-header hidden">
          <h1>Ada Fashion — Relatório de Reservas</h1>
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
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Itens</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Total a Pagar</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden md:table-cell">Data</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 print-hide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">#{getDisplayId(order.id)}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{order.customer_name || 'Cliente Balcão'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={order.status === 'Entregue' ? 'success' : order.status === 'Cancelado' ? 'error' : order.status === 'Enviado' ? 'info' : 'warning'}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {order.items?.length || 0}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">{formatCurrency(order.total)}</td>
                    <td className="py-3 px-4 text-gray-500 hidden md:table-cell">{formatDate(order.created_at)}</td>
                    <td className="py-3 px-4 text-right print-hide space-x-1">
                      <button onClick={() => setSelectedOrder(order)} className="p-2 rounded-lg hover:bg-rose-100 text-gray-400 hover:text-rose-700 transition-colors" title="Ver Detalhes">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => confirmRemoveReservation(order)} className="p-2 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors" title="Remover Reserva">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">Nenhuma reserva encontrada</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
          }, 100);
        }}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirmed}
        title="Remover Reserva"
        message={reservationToDelete ? `Tem certeza que deseja remover a reserva de ${reservationToDelete.customer_name || 'Cliente Balcão'} (ID #${getDisplayId(reservationToDelete.id)})?` : 'Tem certeza que deseja remover esta reserva?'}
      />

      {/* Order Details Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Detalhes da Reserva" size="md">
        {selectedOrder && (
          <div className="space-y-6 text-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Reserva <span className="font-mono text-gray-900">#{getDisplayId(selectedOrder.id)}</span></p>
                <p className="text-xs text-gray-400 mt-1">{formatDateTime ? formatDateTime(selectedOrder.created_at) : formatDate(selectedOrder.created_at)}</p>
                {selectedOrder.customer_address && (
                  <p className="text-xs text-gray-400 mt-1">Endereço: {selectedOrder.customer_address}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Pagamento</p>
                  <p className="text-sm font-semibold">{selectedOrder.payment_method || 'Reserva na Loja'}</p>
                </div>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:border-rose-400"
                >
                  {Object.keys(ORDER_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Cliente</h3>
              <p className="font-medium text-gray-900">{selectedOrder.customer_name || 'Cliente Balcão'}</p>
              {selectedOrder.customer_email && <p className="text-sm text-gray-500">{selectedOrder.customer_email}</p>}
              {selectedOrder.customer_phone && <p className="text-sm text-gray-500">{selectedOrder.customer_phone}</p>}
              {selectedOrder.customer_id && <p className="text-sm text-gray-500">Cliente ID: {selectedOrder.customer_id}</p>}
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Itens Reservados</h3>
              <div className="space-y-3">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-rose-50 rounded-lg flex items-center justify-center text-rose-300 shrink-0 overflow-hidden">
                        {item.image
                          ? <img src={item.image} alt={item.name || item.product_name} className="w-full h-full object-cover" />
                          : <Package size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.name || item.product_name}</p>
                        <p className="text-xs text-gray-500">
                          Qtd: {item.quantity} × {formatCurrency(item.price)}
                          {item.size ? ` · ${item.size}` : ''}
                          {item.color ? ` · ${item.color}` : ''}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

              <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Atenção</p>
                  <p className="font-semibold text-rose-600">Pagar na Retirada</p>
                </div>
                <button
                  onClick={() => confirmRemoveReservation(selectedOrder)}
                  className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors"
                >
                  Remover Reserva
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Notas</p>
                  <p className="text-sm text-gray-700">{selectedOrder.notes || '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase">Total a Receber</p>
                  <span className="text-xl font-bold text-rose-500">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reservations;
