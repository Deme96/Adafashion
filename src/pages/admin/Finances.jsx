// ========== Ada Fashion Finances Page ==========
import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Plus, Trash2, Pencil, Search, FileText, Truck, Users, Home } from 'lucide-react';
import api from '../../lib/api';
import { formatCurrency, formatDate, getLastMonths, PAYMENT_METHODS } from '../../lib/utils';
import StatsCard from '../../components/admin/StatsCard';
import Modal from '../../components/ui/Modal';
import PrintDateModal from '../../components/ui/PrintDateModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Printer } from 'lucide-react';

const COLORS = ['#be185d', '#ec4899', '#f472b6', '#f9a8d4', '#fce7f3'];
const FINANCE_TABS = ['Resumo', 'Relatório Financeiro'];
const REPORT_TABS = ['Movimentações de Caixa', 'Despesas c/ Pessoal', 'Logística', 'Renda da Loja'];

const emptyEntry = { description: '', amount: '', date: '', category: '', notes: '' };

const Finances = () => {
  const [orders, setOrders] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [activeTab, setActiveTab] = useState('Resumo');
  const [reportTab, setReportTab] = useState('Movimentações de Caixa');

  // CRUD for financial entries
  const [cashFlows, setCashFlows] = useState([]);
  const [staffExpenses, setStaffExpenses] = useState([]);
  const [logistics, setLogistics] = useState([]);
  const [storeRent, setStoreRent] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyEntry);

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDateRange, setPrintDateRange] = useState({ start: '', end: '' });

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersData, productsData] = await Promise.all([
          api.getAllOrders(),
          api.getAllProducts()
        ]);
        setOrders(ordersData || []);
        setPurchases(productsData || []); // Link purchases to products
        loadReportData();
      } catch (error) {
        console.error('Error loading finances:', error);
      }
    };
    loadData();
  }, []);

  const loadReportData = async () => {
    try {
      const entries = await api.getAllFinanceEntries();
      if (entries) {
        setStaffExpenses(entries.filter(e => e.type === 'finance_staff'));
        setLogistics(entries.filter(e => e.type === 'finance_logistics'));
        setStoreRent(entries.filter(e => e.type === 'finance_rent'));
        setCashFlows(entries.filter(e => e.type === 'finance_cash_flows'));
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    }
  };

  // Generate Daily Cash Flow automatically
  const dailyCashFlows = useMemo(() => {
    const dailyData = {};
    
    // Add Orders (Revenue)
    orders.filter(o => o.status !== 'Cancelado').forEach(o => {
      const date = o.created_at.split('T')[0];
      if (!dailyData[date]) dailyData[date] = { date, revenue: 0, expenses: 0 };
      dailyData[date].revenue += o.total || 0;
    });

    // Add Purchases (Expenses)
    purchases.filter(p => p.status !== 'Cancelado').forEach(p => {
      const date = (p.purchase_date || p.created_at).split('T')[0];
      if (!dailyData[date]) dailyData[date] = { date, revenue: 0, expenses: 0 };
      dailyData[date].expenses += p.total_cost || 0;
    });

    return Object.values(dailyData)
      .map(day => ({
        id: `cashflow-${day.date}`,
        date: day.date,
        description: `Balanço do dia ${formatDate(day.date)}`,
        category: 'Diário',
        revenue: day.revenue,
        expenses: day.expenses,
        amount: day.revenue - day.expenses,
        notes: `Receita: ${formatCurrency(day.revenue)} | Despesa: ${formatCurrency(day.expenses)}`
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [orders, purchases]);

  const getCollection = () => {
    switch (reportTab) {
      case 'Movimentações de Caixa': return 'finance_cash_flows';
      case 'Despesas c/ Pessoal': return 'finance_staff';
      case 'Logística': return 'finance_logistics';
      case 'Renda da Loja': return 'finance_rent';
      default: return 'finance_cash_flows';
    }
  };

  const getCurrentData = () => {
    let data = [];
    switch (reportTab) {
      case 'Movimentações de Caixa': 
        data = [...dailyCashFlows, ...cashFlows].sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at)); 
        break;
      case 'Despesas c/ Pessoal': data = staffExpenses; break;
      case 'Logística': data = logistics; break;
      case 'Renda da Loja': data = storeRent; break;
      default: data = []; break;
    }

    if (printDateRange.start && printDateRange.end) {
      data = data.filter(item => {
        const itemDate = new Date(item.date || item.created_at);
        const startDate = new Date(printDateRange.start);
        const endDate = new Date(printDateRange.end);
        // Normalize time for inclusive day filtering
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    return data;
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyEntry, date: new Date().toISOString().slice(0, 10) });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ description: item.description, amount: item.amount, date: item.date || '', category: item.category || '', notes: item.notes || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const type = getCollection();
    const data = { 
      ...form, 
      amount: parseFloat(form.amount) || 0, 
      date: form.date || new Date().toISOString().slice(0, 10),
      type 
    };
    if (editing) {
      await api.updateFinanceEntry(editing.id, data);
    } else {
      await api.createFinanceEntry(data);
    }
    setModalOpen(false);
    loadReportData();
  };

  const handleDelete = (id) => {
    setItemToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (itemToDelete) {
      await api.deleteFinanceEntry(itemToDelete);
      loadReportData();
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  // ---- Financial Summary Calculations ----
  const revenue = useMemo(() =>
    orders.filter(o => o.status !== 'Cancelado').reduce((s, o) => s + (o.total || 0), 0),
  [orders]);

  const expenses = useMemo(() =>
    purchases.filter(p => p.status !== 'Cancelado').reduce((s, p) => s + (parseFloat(p.total_cost) || 0), 0),
  [purchases]);

  const profit = revenue - expenses;

  const monthlyData = useMemo(() => {
    const months = getLastMonths(6);
    return months.map(m => {
      const rev = orders.filter(o => {
        if (o.status === 'Cancelado') return false;
        const d = new Date(o.created_at);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === m.key;
      }).reduce((s, o) => s + (o.total || 0), 0);

      const exp = purchases.filter(p => {
        if (p.status === 'Cancelado') return false;
        const d = new Date(p.purchase_date || p.created_at);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === m.key;
      }).reduce((s, p) => s + (parseFloat(p.total_cost) || 0), 0);

      return { name: m.label, Receita: rev, Despesas: exp };
    });
  }, [orders, purchases]);

  const paymentData = useMemo(() => {
    const counts = {};
    PAYMENT_METHODS.forEach(m => counts[m] = 0);
    
    orders.filter(o => o.status !== 'Cancelado').forEach(o => {
      let m = o.payment_method || 'Outro';
      if (!PAYMENT_METHODS.includes(m)) m = 'Outro';
      counts[m] = (counts[m] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white rounded-xl shadow-lg border border-pink-100 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
          {payload.map((e, i) => (
            <p key={i} className="text-xs" style={{ color: e.color }}>{e.name}: {formatCurrency(e.value)}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  const reportTotal = getCurrentData().reduce((s, item) => s + (parseFloat(item.amount) || 0), 0);

  const getReportIcon = () => {
    switch (reportTab) {
      case 'Movimentações de Caixa': return DollarSign;
      case 'Despesas c/ Pessoal': return Users;
      case 'Logística': return Truck;
      case 'Renda da Loja': return Home;
      default: return FileText;
    }
  };

  const ReportIcon = getReportIcon();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="print-hide">
        <h1 className="font-fashion text-3xl font-bold text-rose-500 tracking-tight">Finanças</h1>
        <p className="text-gray-500 text-sm mt-1">Dashboard financeiro</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-white rounded-xl p-1 border border-pink-100 w-fit print-hide">
        {FINANCE_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab
                ? 'bg-rose-400 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ===== RESUMO TAB ===== */}
      {activeTab === 'Resumo' && (
        <div className="print-hide space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard icon={TrendingUp} label="Receita" value={formatCurrency(revenue)} color="green" />
            <StatsCard icon={TrendingDown} label="Despesas" value={formatCurrency(expenses)} color="red" />
            <StatsCard icon={DollarSign} label="Lucro"
              value={formatCurrency(profit)}
              color={profit >= 0 ? 'green' : 'red'} />
          </div>

          {/* Revenue vs Expenses Chart */}
          <div className="bg-white rounded-2xl border border-pink-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Receita vs Despesas</h2>
            <p className="text-xs text-gray-500 mb-6">Últimos 6 meses</p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthlyData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Receita" fill="#16a34a" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Despesas" fill="#dc2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-2xl border border-pink-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Métodos de Pagamento</h2>
            <p className="text-xs text-gray-500 mb-6">Distribuição por forma de pagamento</p>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {paymentData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250} className="max-w-[300px]">
                    <PieChart>
                      <Pie data={paymentData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                        {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-4">
                    {paymentData.map((e, i) => (
                      <div key={e.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-gray-600">{e.name}</span>
                        <span className="text-sm font-bold text-gray-900">({e.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full h-[250px] flex items-center justify-center text-sm text-gray-400">Sem dados</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== RELATÓRIO FINANCEIRO TAB ===== */}
      {activeTab === 'Relatório Financeiro' && (
        <>
          {/* Report Sub-tabs */}
          <div className="flex flex-wrap gap-2 print-hide">
            {REPORT_TABS.map(tab => {
              const icons = {
                'Movimentações de Caixa': DollarSign,
                'Despesas c/ Pessoal': Users,
                'Logística': Truck,
                'Renda da Loja': Home,
              };
              const Icon = icons[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setReportTab(tab)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                    reportTab === tab
                      ? 'bg-rose-50 text-rose-500 border-rose-200 shadow-sm'
                      : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200 hover:text-gray-700'
                  }`}
                >
                  <Icon size={16} />
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print-hide">
            <div className="bg-white rounded-2xl border border-pink-100 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
                <ReportIcon size={22} className="text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{reportTab}</p>
                <p className="text-xl font-bold text-gray-900">{getCurrentData().length} registros</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-pink-100 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <DollarSign size={22} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Acumulado</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(reportTotal)}</p>
              </div>
            </div>
          </div>

          {/* Actions & Print */}
          <div className="flex justify-end gap-3 print-hide">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Printer size={16} /> Imprimir
            </button>
            {reportTab !== 'Movimentações de Caixa' && (
              <button onClick={openNew} className="inline-flex items-center gap-2 bg-rose-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-rose-500 transition-colors shadow-sm shadow-rose-400/20">
                <Plus size={16} /> Novo Registro
              </button>
            )}
          </div>

          {/* Print Area — only this block prints */}
          <div className="print-area">
            {/* Print Header */}
            <div className="print-header hidden">
              <h1>Ada Fashion — Relatório Financeiro: {reportTab}</h1>
              <p>
                {printDateRange.start && printDateRange.end
                  ? `Período: ${printDateRange.start} a ${printDateRange.end}`
                  : 'Todas as datas'}
              </p>
            </div>

          {/* Data Table */}
          <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-rose-50/50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Descrição</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Categoria</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Data</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Valor</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Notas</th>
                    {reportTab !== 'Movimentações de Caixa' && (
                      <th className="text-center py-3 px-4 font-semibold text-gray-600 print-hide">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {getCurrentData().map(item => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-rose-50/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{item.description}</td>
                      <td className="py-3 px-4 text-gray-500">{item.category || '—'}</td>
                      <td className="py-3 px-4 text-gray-500">{formatDate(item.date || item.created_at)}</td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        {reportTab === 'Movimentações de Caixa' ? (
                          <span className={item.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(item.amount)}
                          </span>
                        ) : (
                          formatCurrency(item.amount)
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs max-w-[200px] truncate">{item.notes || '—'}</td>
                      {reportTab !== 'Movimentações de Caixa' && (
                        <td className="py-3 px-4 print-hide">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-rose-100 text-gray-400 hover:text-rose-700 transition-colors">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {getCurrentData().length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                        Nenhum registro encontrado. Clique em "Novo Registro" para adicionar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </>
      )}

      {/* ===== MODAL FORM ===== */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Registro' : `Novo Registro — ${reportTab}`} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição *</label>
            <input type="text" required value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder={reportTab === 'Despesas c/ Pessoal' ? 'Ex: Salário - João' : reportTab === 'Logística' ? 'Ex: Transporte Dakar-Bissau' : reportTab === 'Renda da Loja' ? 'Ex: Aluguel Mensal' : 'Ex: Venda do dia'} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Valor *</label>
              <input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Data</label>
              <input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria</label>
            <input type="text" value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder={reportTab === 'Despesas c/ Pessoal' ? 'Salário, Bónus, Transporte' : reportTab === 'Logística' ? 'Frete, Armazém, Embalagem' : reportTab === 'Renda da Loja' ? 'Aluguel, Água, Energia' : 'Entrada, Saída'} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Observações</label>
            <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none" rows={2} placeholder="Notas adicionais..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl bg-rose-400 text-white text-sm font-bold hover:bg-rose-500 transition-colors">
              {editing ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Print Date Selection Modal */}
      <PrintDateModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onConfirm={(startDate, endDate) => {
          setPrintDateRange({ start: startDate, end: endDate });
          setIsPrintModalOpen(false);
          setTimeout(() => window.print(), 100);
        }}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
      />
    </div>
  );
};

export default Finances;
