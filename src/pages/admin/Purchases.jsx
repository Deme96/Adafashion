// ========== Ada Fashion Purchases & Products Page ==========
import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Search, Trash2, Pencil, Package, Eye, DollarSign } from 'lucide-react';
import api from '../../lib/api';
import { formatCurrency, CATEGORIES } from '../../lib/utils';
import StatsCard from '../../components/admin/StatsCard';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

const emptyProduct = { 
  name: '', 
  category: CATEGORIES[0], 
  price: '', 
  sale_price: '', 
  stock: '', 
  status_geral: 'Ativo',
  colors_input: '',
  sizes_input: '',
  wholesale_price: '',
  wholesale_min_qty: '',
  unit_price: '',
  purchase_quantity: '',
  total_cost: '',
  supplier: '',
  images: []
};

const Purchases = () => {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [search, setSearch] = useState('');
  
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  
  // Custom Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const prods = await api.getAllProducts();
    setProducts((prods || []).reverse());
  };

  const openNew = () => { setEditing(null); setForm(emptyProduct); setIsModalOpen(true); };

  const handleCheckStock = async (product) => {
    const orders = await api.getAllOrders();
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

    setSelectedStock({
      ...product,
      totalSold
    });
    setStockModalOpen(true);
  };
  
  const openEdit = (p) => { 
    setEditing(p); 
    setForm({ 
      ...p, 
      price: p.price || '', 
      sale_price: p.sale_price || '', 
      stock: p.stock || 0,
      status_geral: p.status_geral || (p.is_active ? 'Ativo' : 'Inativo'),
      colors_input: p.colors ? p.colors.join(', ') : '',
      sizes_input: p.sizes ? p.sizes.join(', ') : '',
      wholesale_price: p.wholesale_price || '',
      wholesale_min_qty: p.wholesale_min_qty || '',
      unit_price: p.unit_price || '',
      purchase_quantity: p.purchase_quantity || '',
      total_cost: p.total_cost || '',
      supplier: p.supplier || '',
      images: p.images || (p.image ? [p.image] : [])
    });
    setIsModalOpen(true);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || String(p.id ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const prodStatus = p.status_geral || (p.is_active ? 'Ativo' : 'Inativo');
      const matchesStatus = statusFilter === 'all' || prodStatus === statusFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const prodDate = new Date(p.created_at);
        const now = new Date();
        if (dateFilter === 'today') {
          matchesDate = prodDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'month') {
          matchesDate = prodDate.getMonth() === now.getMonth() && prodDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesDate;
    });
  }, [products, search, categoryFilter, statusFilter, dateFilter]);

  const totalComprasAcumuladas = useMemo(() => {
    return filteredProducts.reduce((sum, p) => sum + (parseFloat(p.total_cost) || 0), 0);
  }, [filteredProducts]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const readFile = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const images = await Promise.all(files.map(readFile));
    setForm(prev => ({ ...prev, images: [...(prev.images || []), ...images] }));
  };

  const fileInputRef = useRef(null);

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Parse comma-separated colors and sizes
    const colors = form.colors_input ? form.colors_input.split(',').map(c => c.trim()).filter(Boolean) : [];
    const sizes = form.sizes_input ? form.sizes_input.split(',').map(s => s.trim()).filter(Boolean) : [];
    
    const unitPrice = parseFloat(form.unit_price) || 0;
    const purchaseQty = parseInt(form.purchase_quantity) || 0;

    const data = {
      ...form,
      price: parseFloat(form.price) || 0,
      sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
      stock: parseInt(form.stock) || 0,
      wholesale_price: form.wholesale_price ? parseFloat(form.wholesale_price) : null,
      wholesale_min_qty: form.wholesale_min_qty ? parseInt(form.wholesale_min_qty) : null,
      unit_price: unitPrice,
      purchase_quantity: purchaseQty,
      total_cost: unitPrice * purchaseQty,
      colors,
      sizes,
      images: form.images || [],
      is_active: form.status_geral !== 'Inativo'
    };
    
    delete data.colors_input;
    delete data.sizes_input;
    delete data.image;

    if (editing) {
      await api.updateProduct(editing.id, data);
    } else {
      await api.createProduct(data);
    }

    setIsModalOpen(false);
    await loadProducts();
  };

  const handleDelete = async (id) => {
    if (confirm('Excluir este produto/compra?')) {
      await api.deleteProduct(id);
      await loadProducts();
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Ativo': return 'success';
      case 'Em Promoção': return 'info';
      case 'Quase Esgotado': return 'warning';
      case 'Esgotado': return 'error';
      default: return 'error';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-fashion text-3xl font-bold text-rose-500 tracking-tight">Loja & Produtos</h1>
          <p className="text-gray-500 text-sm mt-1">Registe as compras de stock e catálogo de produtos</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 bg-rose-400 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-rose-500 transition-colors shadow-sm shadow-rose-400/20">
          <Plus size={16} /> Novo Produto / Compra
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-pink-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-300"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-4 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-300 outline-none"
          >
            <option value="all">Categoria: Todas</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-4 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-300 outline-none"
          >
            <option value="all">Status: Todos</option>
            <option value="Ativo">Ativo</option>
            <option value="Em Promoção">Em Promoção</option>
            <option value="Quase Esgotado">Quase Esgotado</option>
            <option value="Esgotado">Esgotado</option>
            <option value="Inativo">Inativo</option>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard icon={DollarSign} label="Total de Compras (Acumulado)" value={formatCurrency(totalComprasAcumuladas)} color="blue" />
        <StatsCard icon={Package} label="Produtos na Lista" value={filteredProducts.length} color="pink" />
      </div>

      <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-rose-50/50">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Produto</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Categoria</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Preço Custo</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Estoque</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden sm:table-cell">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Preço Venda</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map(p => {
                const prodStatus = p.status_geral || (p.is_active ? 'Ativo' : 'Inativo');
                return (
                  <tr key={p.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center text-rose-300 shrink-0">
                          {(p.images?.length ? p.images[0] : p.image) ? <img src={p.images?.[0] || p.image} className="w-full h-full object-cover rounded-lg" alt="" /> : <Package size={16} />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-400 font-mono">#{String(p.id ?? '').slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{p.category}</td>
                    <td className="py-3 px-4 font-medium">{formatCurrency(p.unit_price || 0)}</td>
                    <td className="py-3 px-4 font-medium">{p.stock} un</td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <Badge variant={getStatusBadge(prodStatus)}>{prodStatus}</Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold">{formatCurrency(p.sale_price || p.price)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleCheckStock(p)} className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Verificar Estoque"><Eye size={15} /></button>
                        <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-rose-100 text-gray-400 hover:text-rose-700 transition-colors"><Pencil size={15} /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">Nenhum produto encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Editar Produto / Compra' : 'Nova Compra & Produto'}>
        <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
          <div className="bg-gray-50 p-4 rounded-xl space-y-4 mb-4 border border-gray-100">
            <h4 className="font-semibold text-gray-900 text-sm">Dados da Compra</h4>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Fornecedor</label>
              <input type="text" placeholder="Nome do fornecedor" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 bg-white" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Preço Unitário</label>
                <input type="number" step="0.01" value={form.unit_price} onChange={e => setForm({...form, unit_price: e.target.value, total_cost: (parseFloat(e.target.value) || 0) * (parseInt(form.purchase_quantity) || 0)})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Qtd Comprada</label>
                <input type="number" value={form.purchase_quantity} onChange={e => setForm({...form, purchase_quantity: e.target.value, total_cost: (parseFloat(form.unit_price) || 0) * (parseInt(e.target.value) || 0)})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Preço Total</label>
                <input type="number" step="0.01" readOnly value={form.total_cost} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 font-semibold cursor-not-allowed" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nome do Produto</label>
            <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 bg-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Status do Produto</label>
              <select value={form.status_geral} onChange={e => setForm({...form, status_geral: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 bg-white">
                <option value="Ativo">Ativo</option>
                <option value="Em Promoção">Em Promoção</option>
                <option value="Quase Esgotado">Quase Esgotado</option>
                <option value="Esgotado">Esgotado</option>
                <option value="Inativo">Inativo (Oculto)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cores (separadas por vírgula)</label>
              <input type="text" placeholder="Ex: Vermelho, Preto" value={form.colors_input} onChange={e => setForm({...form, colors_input: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tamanhos (separados por vírgula)</label>
              <input type="text" placeholder="Ex: P, M, G, GG" value={form.sizes_input} onChange={e => setForm({...form, sizes_input: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400" />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Imagens do Produto</label>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex flex-wrap gap-3 items-center">
                  {(form.images || []).length > 0 ? (
                    <>
                      {(form.images || []).map((img, index) => (
                        <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 bg-white">
                          <img src={img} alt={`${form.name || 'Imagem do produto'} ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== index)
                            }))}
                            className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white/90 text-gray-500 hover:text-red-600 flex items-center justify-center shadow-sm"
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      {/* Plus tile: visible once at least one image exists */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current && fileInputRef.current.click(); }}
                        className="w-24 h-24 rounded-xl border border-dashed border-gray-300 bg-white flex items-center justify-center text-gray-400 cursor-pointer hover:border-gray-400"
                        title="Adicionar mais imagens"
                      >
                        <span className="text-2xl font-bold">+</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-24 h-24 rounded-xl border border-dashed border-rose-200 bg-white flex items-center justify-center text-gray-400">
                      <Package size={24} />
                    </div>
                  )}
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200"
                  />
                  <p className="text-xs text-gray-500 mt-2">Adicione quantas fotos quiser. Você pode enviar várias de uma vez.</p>
                </div>
              </div>
            </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Preço Venda (XOF)</label>
              <input type="number" step="0.01" required value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Promocional</label>
              <input type="number" step="0.01" value={form.sale_price} onChange={e => setForm({...form, sale_price: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Estoque Físico Total</label>
              <input type="number" required value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400" />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-100">
            <h4 className="font-semibold text-gray-900 text-sm">Configurações para Grossistas (Zona di Bideras)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Preço Grossista (XOF)</label>
                <input type="number" step="0.01" placeholder="Opcional" value={form.wholesale_price} onChange={e => setForm({...form, wholesale_price: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quantidade Mínima</label>
                <input type="number" placeholder="Ex: 10" value={form.wholesale_min_qty} onChange={e => setForm({...form, wholesale_min_qty: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 bg-white" />
              </div>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl font-bold bg-rose-400 text-white hover:bg-rose-500 transition-colors">Salvar Registro</button>
          </div>
        </form>
      </Modal>

      {/* Stock Check Modal */}
      <Modal isOpen={stockModalOpen} onClose={() => setStockModalOpen(false)} title="Verificação de Estoque">
        {selectedStock && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
              <div className="w-16 h-16 bg-rose-50 rounded-lg flex items-center justify-center shrink-0">
                {selectedStock.image ? <img src={selectedStock.image} className="w-full h-full object-cover rounded-lg" alt="" /> : <Package size={24} className="text-rose-300" />}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{selectedStock.name}</h3>
                <p className="text-sm text-gray-500">#{String(selectedStock.id ?? '').slice(-6).toUpperCase()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl text-center">
                <p className="text-sm font-medium text-gray-500 mb-1">Estoque Físico</p>
                <p className="text-3xl font-black text-gray-900">{selectedStock.stock}</p>
                <p className="text-xs text-gray-400 mt-1">unidades disponíveis</p>
              </div>
              <div className="bg-rose-50/50 p-4 rounded-xl text-center">
                <p className="text-sm font-medium text-gray-500 mb-1">Total Vendido</p>
                <p className="text-3xl font-black text-rose-500">{selectedStock.totalSold}</p>
                <p className="text-xs text-rose-400 mt-1">unidades no histórico</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Status do Inventário</p>
                <p className="text-xs text-gray-500">Com base na quantidade física</p>
              </div>
              {selectedStock.stock === 0 ? (
                <Badge variant="error">Esgotado 🔴</Badge>
              ) : selectedStock.stock <= 5 ? (
                <Badge variant="error">Crítico ⚠️ (Reabastecer)</Badge>
              ) : selectedStock.stock <= 10 ? (
                <Badge variant="warning">Baixo ⚠️</Badge>
              ) : (
                <Badge variant="success">OK ✅</Badge>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => setStockModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Purchases;
