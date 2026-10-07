// ========== Ada Fashion Settings Page ==========
import { useState, useEffect } from 'react';
import { Save, Plus, Pencil, Trash2, Search, Shield, ShieldCheck, CheckSquare, Square, Lock, Unlock, Sliders } from 'lucide-react';
import api from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { fileToBase64, videoToBase64 } from '../../lib/utils';
import { MENU_RESOURCES, ROLE_PERMISSIONS, getRolePermissions, canAccessMenu, hasPermission, getLoggedUser } from '../../lib/auth';

const tabs = ['Geral', 'Usuários', 'Promoções', 'Vídeos', 'Notícias', 'Fotos Carousel', 'Logs'];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('Geral');

  // General
  const [settings, setSettings] = useState({ store_name: 'Ada Fashion', language: 'pt-BR', currency: 'XOF' });

  // CRUD states
  const [promotions, setPromotions] = useState([]);
  const [videos, setVideos] = useState([]);
  const [news, setNews] = useState([]);
  const [users, setUsers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [carouselPhotos, setCarouselPhotos] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [promoSearch, setPromoSearch] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadAll = async () => {
    try {
      const storeSettings = await api.getAllStoreSettings();
      if (storeSettings && storeSettings.length > 0) setSettings(storeSettings[0]);
      
      const promos = await api.getAllPromotions();
      setPromotions(promos || []);
      
      const vids = await api.getAllVideos();
      setVideos(vids || []);
      
      const newsData = await api.getAllNews();
      setNews(newsData || []);
      
      const usersData = await api.getAllUsers();
      setUsers(usersData || []);
      
      const products = await api.getAllProducts();
      setAllProducts(products || []);
      
      const carouselPhotosData = await api.getAllCarouselPhotos();
      setCarouselPhotos(carouselPhotosData || []);
      
      const logsData = await api.getAllActivityLogs();
      setLogs((logsData || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      console.error('Error loading settings data:', error);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const saveSettings = async () => {
    try {
      const payload = {
        store_name: settings.store_name || 'Ada Fashion',
        language: settings.language || 'pt-BR',
        currency: settings.currency || 'XOF',
      };
      const result = await api.createStoreSettings(payload);
      if (result) {
        setSettings(result);
        alert('Configurações salvas com sucesso!');
      } else {
        alert('Erro ao salvar configurações. Verifique se o servidor está ativo.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erro ao salvar configurações: ' + error.message);
    }
  };

  const handleUserRoleChange = (newRole) => {
    if (newRole === 'Admin') {
      setForm(f => ({
        ...f,
        role: 'Admin',
        permissions: ROLE_PERMISSIONS['Admin'],
      }));
    } else if (newRole === 'Personalizado') {
      setForm(f => ({
        ...f,
        role: 'Personalizado',
        permissions: f.permissions && f.permissions.length > 0 ? f.permissions : ROLE_PERMISSIONS['Vendedor'],
      }));
    } else {
      setForm(f => ({
        ...f,
        role: newRole,
        permissions: ROLE_PERMISSIONS[newRole] || [],
      }));
    }
  };

  const toggleMenuPermissions = (menuObj) => {
    const current = form.permissions || [];
    const menuFeatureKeys = [menuObj.key, ...menuObj.features.map(f => f.key)];
    const allChecked = menuFeatureKeys.every(k => current.includes(k));

    let updated;
    if (allChecked) {
      updated = current.filter(k => !menuFeatureKeys.includes(k));
    } else {
      updated = Array.from(new Set([...current, ...menuFeatureKeys]));
    }

    setForm(f => ({
      ...f,
      permissions: updated,
    }));
  };

  const toggleSubFeaturePermission = (menuObj, featureKey) => {
    const current = form.permissions || [];
    let updated;
    if (current.includes(featureKey)) {
      updated = current.filter(k => k !== featureKey);
      const hasOtherFeatures = menuObj.features.some(f => f.key !== featureKey && updated.includes(f.key));
      if (!hasOtherFeatures) {
        updated = updated.filter(k => k !== menuObj.key);
      }
    } else {
      updated = Array.from(new Set([...current, featureKey, menuObj.key]));
    }

    setForm(f => ({
      ...f,
      permissions: updated,
    }));
  };

  const openCreate = (type) => {
    setModalType(type);
    setEditing(null);
    const defaults = {
      user: { name: '', email: '', password: '', role: 'Vendedor', permissions: ROLE_PERMISSIONS['Vendedor'] },
      promotion: { name: '', description: '', discount_percent: '', start_date: '', end_date: '', is_active: true, applicable_categories: '', selected_products: [], banner_image: '' },
      video: { title: '', url: '', is_published: true },
      news: { title: '', content: '', image: '', is_published: true },
      carousel_photo: { title: '', image_url: '', description: '' },
    };
    setForm(defaults[type] || {});
    setModalOpen(true);
  };

  const openEdit = (type, item) => {
    setModalType(type);
    setEditing(item);
    if (type === 'user') {
      const userPerms = Array.isArray(item.permissions)
        ? item.permissions
        : getRolePermissions(item);
      setForm({
        ...item,
        role: item.role || 'Vendedor',
        permissions: userPerms,
      });
    } else {
      setForm({
        ...item,
        applicable_categories: Array.isArray(item.applicable_categories) ? item.applicable_categories.join(', ') : item.applicable_categories || '',
        discount_percent: item.discount_percent || '',
      });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    const data = { ...form };
    if (modalType === 'promotion') {
      data.discount_percent = parseFloat(data.discount_percent) || 0;
      data.applicable_categories = typeof data.applicable_categories === 'string'
        ? data.applicable_categories.split(',').map(s => s.trim()).filter(Boolean) : data.applicable_categories;
    }
    try {
      if (modalType === 'user') {
        if (editing) {
          const updatedUser = await api.updateUser(editing.id, data);
          const currentUser = getLoggedUser();
          if (currentUser && currentUser.id === editing.id && updatedUser) {
            const newToken = JSON.stringify({
              ...currentUser,
              role: updatedUser.role,
              permissions: updatedUser.permissions
            });
            localStorage.setItem('adafashion_admin_token', newToken);
            window.location.reload();
          }
        } else {
          await api.createUser(data);
        }
      } else if (modalType === 'promotion') {
        if (editing) {
          await api.updatePromotion(editing.id, data);
        } else {
          await api.createPromotion(data);
        }
        // Automatically apply discount to all selected products
        const percent = parseFloat(data.discount_percent);
        if (percent > 0 && data.selected_products && data.selected_products.length > 0) {
          for (const prodId of data.selected_products) {
            const prod = allProducts.find(p => p.id === prodId);
            if (prod && prod.price) {
              const newSalePrice = prod.price * (1 - percent / 100);
              await api.patchProduct(prodId, { sale_price: parseFloat(newSalePrice.toFixed(2)), status_geral: 'Em Promoção' });
            }
          }
        }
      } else if (modalType === 'video') {
        if (editing) {
          await api.updateVideo(editing.id, data);
        } else {
          await api.createVideo(data);
        }
      } else if (modalType === 'news') {
        if (editing) {
          await api.updateNews(editing.id, data);
        } else {
          await api.createNews(data);
        }
      } else if (modalType === 'carousel_photo') {
        if (editing) {
          await api.updateCarouselPhoto(editing.id, data);
        } else {
          await api.createCarouselPhoto(data);
        }
      }
      setModalOpen(false);
      await loadAll();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleApplyDiscount = async () => {
    if (!form.selected_products || form.selected_products.length === 0) {
      alert("Selecione pelo menos um produto para aplicar o desconto.");
      return;
    }
    const percent = parseFloat(form.discount_percent);
    if (!percent || percent <= 0 || percent > 100) {
      alert("Informe uma percentagem válida (entre 1 e 100).");
      return;
    }
    
    if (confirm(`Deseja aplicar ${percent}% de desconto a ${form.selected_products.length} produto(s)?`)) {
      try {
        for (const prodId of form.selected_products) {
          const prod = allProducts.find(p => p.id === prodId);
          if (prod) {
            const discount = percent / 100;
            const newSalePrice = prod.price * (1 - discount);
            await api.patchProduct(prodId, { sale_price: parseFloat(newSalePrice.toFixed(2)), status_geral: 'Em Promoção' });
          }
        }
        alert("Desconto aplicado com sucesso!");
        await loadAll();
      } catch (error) {
        console.error('Error applying discount:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        if (deleteTarget.collection === 'users') {
          await api.deleteUser(deleteTarget.id);
        } else if (deleteTarget.collection === 'promotions') {
          await api.deletePromotion(deleteTarget.id);
        } else if (deleteTarget.collection === 'videos') {
          await api.deleteVideo(deleteTarget.id);
        } else if (deleteTarget.collection === 'news') {
          await api.deleteNews(deleteTarget.id);
        } else if (deleteTarget.collection === 'carousel_photos') {
          await api.deleteCarouselPhoto(deleteTarget.id);
        } else if (deleteTarget.collection === 'logs') {
          await api.deleteAllActivityLogs();
        }
        await loadAll();
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };

  const handleNewsImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setForm(f => ({ ...f, image: base64 }));
    }
  };

  const handleCarouselImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setForm(f => ({ ...f, image_url: base64 }));
    }
  };

  const handlePromotionImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setForm(f => ({ ...f, banner_image: base64 }));
    }
  };

  const handleLocalVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await videoToBase64(file);
        setForm(f => ({ ...f, url: base64 }));
      } catch (error) {
        alert(error.message);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="font-fashion text-3xl font-bold text-rose-500 tracking-tight">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie sua loja</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-rose-50 rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-pink-100 p-6">
        {/* ---- GERAL ---- */}
        {activeTab === 'Geral' && (
          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nome da Loja</label>
              <input type="text" value={settings.store_name || ''}
                onChange={(e) => setSettings(s => ({ ...s, store_name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Idioma</label>
              <select value={settings.language || 'pt-BR'}
                onChange={(e) => setSettings(s => ({ ...s, language: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                <option value="pt-BR">Português (BR)</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Moeda</label>
              <input type="text" value={settings.currency || 'XOF'}
                onChange={(e) => setSettings(s => ({ ...s, currency: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>
            <button onClick={saveSettings}
              className="inline-flex items-center gap-2 bg-rose-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-rose-500 transition-colors">
              <Save size={16} /> Salvar
            </button>
          </div>
        )}

        {/* ---- USUÁRIOS ---- */}
        {activeTab === 'Usuários' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-rose-50/60 p-4 rounded-xl border border-rose-100">
              <div>
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <ShieldCheck size={18} className="text-rose-500" /> Privilégios e Controle de Acesso
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Defina o modelo de perfil de cada usuário ou escolha exatamente quais menus da plataforma cada um poderá acessar.
                </p>
              </div>
              <button onClick={() => openCreate('user')} className="inline-flex items-center gap-2 bg-rose-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-rose-500 transition-colors shadow-sm shrink-0">
                <Plus size={16} /> Novo Usuário
              </button>
            </div>
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="p-4 bg-white border border-rose-100 rounded-xl space-y-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
                        {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        u.role === 'Admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                        u.role === 'Gerente' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        u.role === 'Vendedor' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        u.role === 'Visualizador' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        'bg-rose-100 text-rose-700 border border-rose-200'
                      }`}>
                        {u.role === 'Personalizado' ? '⚙️ Personalizado' : u.role}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit('user', u)} title="Editar privilégios" className="p-2 rounded-lg hover:bg-rose-100 text-gray-400 hover:text-rose-700 transition-colors"><Pencil size={15} /></button>
                        <button onClick={() => { setDeleteTarget({ collection: 'users', id: u.id }); setConfirmOpen(true); }} title="Remover usuário" className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  </div>

                  {/* Badges of allowed menus */}
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-gray-400 mr-1">Menus Permitidos:</span>
                    {MENU_RESOURCES.map(res => {
                      const hasPerm = canAccessMenu(res.key, u);
                      return (
                        <span key={res.key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                          hasPerm ? 'bg-rose-50 text-rose-700 border border-rose-200/80 font-semibold' : 'bg-gray-50 text-gray-300 line-through opacity-40'
                        }`}>
                          {hasPerm ? '✓' : '✕'} {res.label.split('/')[0].trim()}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
              {users.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Nenhum usuário cadastrado além do Admin padrão.</p>}
            </div>
          </div>
        )}

        {/* ---- PROMOÇÕES ---- */}
        {activeTab === 'Promoções' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => openCreate('promotion')} className="inline-flex items-center gap-2 bg-rose-400 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-rose-500 transition-colors">
                <Plus size={16} /> Nova Promoção
              </button>
            </div>
            <div className="space-y-3">
              {promotions.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-rose-50/50 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 flex-1">
                    {p.banner_image && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 border-rose-200 bg-gray-200">
                        <img src={p.banner_image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.discount_percent}% OFF • {p.is_active ? '✅ Ativa' : '❌ Inativa'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit('promotion', p)} className="p-2 rounded-lg hover:bg-rose-100 text-gray-400 hover:text-rose-700"><Pencil size={15} /></button>
                    <button onClick={() => { setDeleteTarget({ collection: 'promotions', id: p.id }); setConfirmOpen(true); }} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
              {promotions.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Nenhuma promoção cadastrada</p>}
            </div>
          </div>
        )}

        {/* ---- VÍDEOS ---- */}
        {activeTab === 'Vídeos' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => openCreate('video')} className="inline-flex items-center gap-2 bg-rose-400 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-rose-500 transition-colors">
                <Plus size={16} /> Novo Vídeo
              </button>
            </div>
            <div className="space-y-3">
              {videos.map(v => (
                <div key={v.id} className="flex items-center justify-between p-4 bg-rose-50/50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">{v.title}</p>
                    <p className="text-xs text-gray-500 truncate max-w-xs">{v.url}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit('video', v)} className="p-2 rounded-lg hover:bg-rose-100 text-gray-400 hover:text-rose-700"><Pencil size={15} /></button>
                    <button onClick={() => { setDeleteTarget({ collection: 'videos', id: v.id }); setConfirmOpen(true); }} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
              {videos.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Nenhum vídeo cadastrado</p>}
            </div>
          </div>
        )}

        {/* ---- NOTÍCIAS ---- */}
        {activeTab === 'Notícias' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => openCreate('news')} className="inline-flex items-center gap-2 bg-rose-400 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-rose-500 transition-colors">
                <Plus size={16} /> Nova Notícia
              </button>
            </div>
            <div className="space-y-3">
              {news.map(n => (
                <div key={n.id} className="flex items-center justify-between p-4 bg-rose-50/50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500">{n.is_published ? '✅ Publicada' : '❌ Rascunho'} • {formatDate(n.created_at)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit('news', n)} className="p-2 rounded-lg hover:bg-rose-100 text-gray-400 hover:text-rose-700"><Pencil size={15} /></button>
                    <button onClick={() => { setDeleteTarget({ collection: 'news', id: n.id }); setConfirmOpen(true); }} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
              {news.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Nenhuma notícia cadastrada</p>}
            </div>
          </div>
        )}

        {/* ---- FOTOS CAROUSEL ---- */}
        {activeTab === 'Fotos Carousel' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => openCreate('carousel_photo')} className="inline-flex items-center gap-2 bg-rose-400 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-rose-500 transition-colors">
                <Plus size={16} /> Adicionar Foto
              </button>
            </div>
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-xl">💡 Adicione URLs de imagens para exibir no carousel do site. Recomenda-se usar pelo menos 6 fotos de produtos (vestidos, camisolas, bolsas, cosméticos).</p>
            <div className="space-y-3">
              {carouselPhotos.map((photo, idx) => (
                <div key={photo.id} className="flex items-center justify-between p-4 bg-rose-50/50 rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded">#{idx + 1}</span>
                      <p className="font-semibold text-gray-900">{photo.title || 'Foto sem título'}</p>
                    </div>
                    <p className="text-xs text-gray-500 truncate max-w-lg">{photo.image_url}</p>
                    {photo.description && <p className="text-xs text-gray-600 mt-1">{photo.description}</p>}
                  </div>
                  <div className="flex gap-1 ml-4">
                    <button onClick={() => openEdit('carousel_photo', photo)} className="p-2 rounded-lg hover:bg-rose-100 text-gray-400 hover:text-rose-700"><Pencil size={15} /></button>
                    <button onClick={() => { setDeleteTarget({ collection: 'carousel_photos', id: photo.id }); setConfirmOpen(true); }} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
              {carouselPhotos.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Nenhuma foto no carousel. Adicione fotos para exibir no site!</p>}
            </div>
          </div>
        )}

        {/* ---- LOGS ---- */}
        {activeTab === 'Logs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-500">
                O sistema registra automaticamente as principais ações da equipe.
              </p>
              {logs.length > 0 && (
                <button
                  onClick={() => {
                    setDeleteTarget({ collection: 'logs' });
                    setConfirmOpen(true);
                  }}
                  className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={16} /> Limpar Todos os Logs
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Ação</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Detalhes</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600 hidden sm:table-cell">Usuário</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600 hidden md:table-cell">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.slice(0, 50).map(log => (
                    <tr key={log.id}>
                      <td className="py-2 px-3 font-medium text-gray-900">{log.action}</td>
                      <td className="py-2 px-3 text-gray-500 truncate max-w-xs">{log.details}</td>
                      <td className="py-2 px-3 text-gray-400 hidden sm:table-cell">{log.user_name}</td>
                      <td className="py-2 px-3 text-gray-400 hidden md:table-cell">{formatDate(log.created_at)}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400">Nenhum log registrado</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Editar ${modalType}` : `Novo ${modalType}`} size="md">
        <div className="space-y-4">
          {modalType === 'user' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo *</label>
                <input type="text" value={form.name || ''} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  autoComplete="off" placeholder="Ex: Maria Silva" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail de Acesso *</label>
                <input type="email" value={form.email || ''} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  autoComplete="off" placeholder="Ex: maria@adafashion.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Senha {editing ? '(Deixe em branco para manter)' : '*'}</label>
                <input type="password" value={form.password || ''} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  autoComplete="new-password" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Modelo Base de Perfil *</label>
                <select value={form.role || 'Vendedor'} onChange={(e) => handleUserRoleChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                  <option value="Admin">Admin (Acesso Total ilimitado a todos os recursos)</option>
                  <option value="Gerente">Gerente (Dashboard, Estoque, Compras, Vendas, Reservas, Finanças)</option>
                  <option value="Vendedor">Vendedor (Dashboard, Vendas, Reservas)</option>
                  <option value="Visualizador">Visualizador (Consulta e Leitura)</option>
                  <option value="Personalizado">Personalizado (Escolha de menus sob medida)</option>
                </select>
              </div>

              {/* Customizable Menu Resources Section */}
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                      <Sliders size={15} className="text-rose-500" /> Permissões Personalizadas de Menus
                    </label>
                    <p className="text-xs text-gray-500">Marque quais módulos o usuário poderá ver e usar:</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setForm(f => ({ ...f, permissions: MENU_RESOURCES.flatMap(m => [m.key, ...m.features.map(feat => feat.key)]) }))}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-1 rounded-md">
                      Marcar Todos
                    </button>
                    <button type="button" onClick={() => setForm(f => ({ ...f, permissions: [] }))}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                      Desmarcar Todos
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto p-1">
                  {MENU_RESOURCES.map((item) => {
                    const isMenuChecked = (form.permissions || []).includes(item.key) || item.features.some(f => (form.permissions || []).includes(f.key));
                    const isDisabled = false;
                    return (
                      <div key={item.key} className="p-3 rounded-xl border bg-gray-50/30 border-gray-200 flex flex-col gap-3">
                        <div
                          onClick={() => !isDisabled && toggleMenuPermissions(item)}
                          className="flex items-start gap-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isMenuChecked}
                            disabled={isDisabled}
                            onChange={() => {}}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold ${isMenuChecked ? 'text-rose-900' : 'text-gray-700'}`}>
                              {item.label}
                            </p>
                            <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {item.features && item.features.length > 0 && (
                          <div className="ml-7 grid grid-cols-1 sm:grid-cols-2 gap-2 border-l-2 border-gray-200 pl-3">
                            {item.features.map(feature => {
                              const isFeatureChecked = (form.permissions || []).includes(feature.key);
                              return (
                                <div
                                  key={feature.key}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isDisabled) toggleSubFeaturePermission(item, feature.key);
                                  }}
                                  className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-100"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isFeatureChecked}
                                    disabled={isDisabled}
                                    onChange={() => {}}
                                    className="w-3.5 h-3.5 rounded border-gray-300 text-rose-500 focus:ring-rose-500 cursor-pointer"
                                  />
                                  <span className={`text-[11px] ${isFeatureChecked ? 'font-semibold text-rose-800' : 'text-gray-600'}`}>
                                    {feature.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {modalType === 'promotion' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome *</label>
                <input type="text" value={form.name || ''} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição</label>
                <textarea value={form.description || ''} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none" rows={2} />
              </div>

              {/* Imagem de Fundo da Promoção */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">🖼️ Imagem de Fundo (Banner)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-rose-400 hover:bg-rose-50/30 transition-colors cursor-pointer">
                  <input type="file" accept="image/*" onChange={handlePromotionImageUpload} 
                    className="w-full text-sm text-gray-600 cursor-pointer" />
                  <p className="text-xs text-gray-500 mt-2">Arraste uma imagem ou clique para selecionar (PNG, JPG, WebP)</p>
                </div>
                {form.banner_image && (
                  <div className="mt-3 w-full h-32 rounded-xl overflow-hidden bg-gray-200 border border-gray-300 relative">
                    <img src={form.banner_image} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, banner_image: '' }))}
                      className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold hover:bg-red-600">
                      Remover
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Desconto %</label>
                  <input type="number" value={form.discount_percent || ''} onChange={(e) => setForm(f => ({ ...f, discount_percent: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Início</label>
                  <input type="date" value={form.start_date || ''} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Fim</label>
                  <input type="date" value={form.end_date || ''} onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active || false}
                  onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500" />
                <span className="text-sm text-gray-700">Ativa</span>
              </label>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Selecione os Produtos para a Promoção</label>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setForm(f => ({ ...f, selected_products: allProducts.map(p => p.id) }))}
                      className="text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-1 rounded"
                    >
                      Marcar Todos
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setForm(f => ({ ...f, selected_products: [] }))}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-100 px-2 py-1 rounded"
                    >
                      Desmarcar Todos
                    </button>
                  </div>
                </div>

                <div className="mb-3 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar produto por nome..." 
                    value={promoSearch}
                    onChange={(e) => setPromoSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-gray-50/50"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1.5 bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-300">
                  {allProducts
                    .filter(p => p.name.toLowerCase().includes(promoSearch.toLowerCase()))
                    .map(p => {
                      const isSelected = (form.selected_products || []).includes(p.id);
                      return (
                        <label 
                          key={p.id} 
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                            isSelected ? 'bg-rose-50 border-rose-200 shadow-sm' : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50 shadow-sm'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={(e) => {
                              const current = form.selected_products || [];
                              if (e.target.checked) {
                                setForm(f => ({ ...f, selected_products: [...current, p.id] }));
                              } else {
                                setForm(f => ({ ...f, selected_products: current.filter(id => id !== p.id) }));
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 transition-colors"
                          />
                          <div className="flex-1 min-w-0">
                            <span className={`block text-sm font-semibold truncate ${isSelected ? 'text-rose-500' : 'text-gray-900'}`}>{p.name}</span>
                            <span className="text-xs text-gray-500">De: {formatCurrency(p.price)}</span>
                          </div>
                          {p.images && p.images[0] && (
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                        </label>
                      );
                  })}
                  {allProducts.filter(p => p.name.toLowerCase().includes(promoSearch.toLowerCase())).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Nenhum produto encontrado na busca.</p>
                  )}
                </div>
                <button type="button" onClick={handleApplyDiscount} className="mt-4 w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
                  Aplicar {form.discount_percent || 0}% de Desconto aos Selecionados
                </button>
              </div>
            </>
          )}

          {modalType === 'video' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Título *</label>
                <input type="text" value={form.title || ''} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
              </div>
              {/* Abas para escolher entre URL ou Upload Local */}
              <div className="space-y-3 p-4 bg-blue-50 rounded-xl mb-4">
                <p className="text-sm font-semibold text-gray-700">Escolha uma opção para adicionar o vídeo:</p>
                
                {/* Opção 1: Upload Local */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📁 Carregar do Computador</label>
                  <input type="file" accept="video/mp4,video/webm,video/ogg" onChange={handleLocalVideoUpload} 
                    className="text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg p-3 w-full cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-colors" />
                  <p className="text-xs text-gray-500 mt-1">Formatos suportados: MP4, WebM, OGG</p>
                </div>

                {/* Opção 2: URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🔗 Ou insira uma URL / Embed</label>
                  <input type="url" value={form.url || ''} onChange={(e) => setForm(f => ({ ...f, url: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="https://www.youtube.com/embed/..." />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_published || false}
                  onChange={(e) => setForm(f => ({ ...f, is_published: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500" />
                <span className="text-sm text-gray-700">Publicado</span>
              </label>
            </>
          )}

          {modalType === 'news' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Título *</label>
                <input type="text" value={form.title || ''} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Conteúdo *</label>
                <textarea value={form.content || ''} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none" rows={5} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Imagem</label>
                {form.image && (
                  <div className="mb-2 w-full h-32 rounded-xl overflow-hidden bg-gray-100">
                    <img src={form.image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleNewsImageUpload} className="text-sm text-gray-500" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_published || false}
                  onChange={(e) => setForm(f => ({ ...f, is_published: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500" />
                <span className="text-sm text-gray-700">Publicada</span>
              </label>
            </>
          )}

          {modalType === 'carousel_photo' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Título (Opcional)</label>
                <input type="text" value={form.title || ''} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Ex: Vestido Rosa Verão" />
              </div>

              {/* Abas para escolher entre URL ou Upload Local */}
              <div className="space-y-3 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm font-semibold text-gray-700">Escolha uma opção para adicionar a imagem:</p>
                
                {/* Opção 1: Upload Local */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📁 Carregar do Computador</label>
                  <input type="file" accept="image/*" onChange={handleCarouselImageUpload} 
                    className="text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg p-3 w-full cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-colors" />
                  <p className="text-xs text-gray-500 mt-1">Formatos suportados: JPG, PNG, WebP (máx. 5MB)</p>
                </div>

                {/* Opção 2: URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🔗 Ou copie uma URL</label>
                  <input type="url" value={form.image_url || ''} onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="https://images.pexels.com/photos/..." />
                </div>

                {/* Preview */}
                {form.image_url && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                    <div className="w-full h-40 rounded-xl overflow-hidden bg-gray-200 border border-gray-300">
                      <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://via.placeholder.com/1600x900?text=Erro+ao+carregar'; }} />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição (Opcional)</label>
                <textarea value={form.description || ''} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none" rows={2}
                  placeholder="Ex: Coleção de verão com vestidos exclusivos" />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-rose-400 text-white text-sm font-bold hover:bg-rose-500 transition-colors">
              {editing ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} />
    </div>
  );
};

export default Settings;
