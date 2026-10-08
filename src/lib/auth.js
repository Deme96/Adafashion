// ========== Ada Fashion Authentication & Sub-Resource Customizable Permissions ==========

import { getApiBaseUrl } from './api.js';

const TOKEN_KEY = 'adafashion_admin_token';
const ADMIN_EMAIL = 'admin@adafashion.com';
const ADMIN_PASS = 'admin123';

export const MENU_RESOURCES = [
  {
    key: 'dashboard',
    label: 'Dashboard / Visão Geral',
    icon: 'LayoutDashboard',
    description: 'Painel principal de métricas e indicadores de desempenho',
    features: [
      { key: 'dashboard.view_summary', label: 'Visualizar Resumo de Vendas e Faturamento' },
      { key: 'dashboard.view_metrics', label: 'Visualizar Métricas Principais (Pedidos, Ticket Médio)' },
      { key: 'dashboard.view_stats', label: 'Visualizar Gráficos e Estatísticas de Vendas' },
      { key: 'dashboard.view_alerts', label: 'Visualizar Alertas de Estoque Baixo e Notificações' },
    ]
  },
  {
    key: 'inventory',
    label: 'Controle de Estoque',
    icon: 'Warehouse',
    description: 'Gestão de catálogo de produtos e movimentações de estoque',
    features: [
      { key: 'inventory.view', label: 'Visualizar Produtos e Quantidades em Estoque' },
      { key: 'inventory.create', label: 'Cadastrar Novos Produtos' },
      { key: 'inventory.edit', label: 'Editar Dados de Produtos Existentes' },
      { key: 'inventory.delete', label: 'Excluir Produtos do Catálogo' },
      { key: 'inventory.adjust_stock', label: 'Registrar Ajustes, Entradas e Saídas de Estoque' },
    ]
  },
  {
    key: 'purchases',
    label: 'Compras',
    icon: 'ShoppingCart',
    description: 'Registro e controle de compras de fornecedores para reposição',
    features: [
      { key: 'purchases.view', label: 'Visualizar Histórico e Registros de Compras' },
      { key: 'purchases.create', label: 'Registrar Novas Compras de Reposição' },
      { key: 'purchases.edit', label: 'Editar Registros de Compras' },
      { key: 'purchases.delete', label: 'Excluir Registros de Compras' },
    ]
  },
  {
    key: 'sales',
    label: 'Vendas',
    icon: 'BarChart3',
    description: 'Registro de vendas, caixa (PDV) e relatórios de faturamento',
    features: [
      { key: 'sales.view', label: 'Visualizar Histórico de Vendas e Relatórios' },
      { key: 'sales.create', label: 'Registrar Novas Vendas no Caixa / PDV' },
      { key: 'sales.edit', label: 'Editar Registros e Alterar Status de Vendas' },
      { key: 'sales.delete', label: 'Cancelar / Excluir Registros de Vendas' },
    ]
  },
  {
    key: 'reservations',
    label: 'Reservas',
    icon: 'CalendarClock',
    description: 'Gestão de reservas de produtos solicitadas por clientes',
    features: [
      { key: 'reservations.view', label: 'Visualizar Lista de Reservas' },
      { key: 'reservations.create', label: 'Registrar Novas Reservas de Peças' },
      { key: 'reservations.edit', label: 'Confirmar / Alterar Status de Reservas' },
      { key: 'reservations.delete', label: 'Excluir Registros de Reservas' },
    ]
  },
  {
    key: 'finances',
    label: 'Finanças',
    icon: 'DollarSign',
    description: 'Controle de entradas, saídas, despesas e fluxo de caixa',
    features: [
      { key: 'finances.view', label: 'Visualizar Relatórios Financeiros e DRE' },
      { key: 'finances.create_entry', label: 'Lançar Novas Entradas e Despesas' },
      { key: 'finances.edit_entry', label: 'Editar Registros Financeiros' },
      { key: 'finances.delete_entry', label: 'Excluir Lançamentos Financeiros' },
    ]
  },
  {
    key: 'settings',
    label: 'Configurações',
    icon: 'Settings',
    description: 'Definições do sistema, gestão de equipe e conteúdos da loja',
    features: [
      { key: 'settings.general', label: 'Alterar Configurações Gerais da Loja (Nome, Moeda)' },
      { key: 'settings.users', label: 'Gerenciar Usuários e Atribuir Privilégios' },
      { key: 'settings.promotions', label: 'Criar e Gerenciar Promoções e Banners' },
      { key: 'settings.content', label: 'Gerenciar Vídeos, Notícias e Fotos do Carousel' },
      { key: 'settings.logs', label: 'Visualizar e Limpar Activity Logs do Sistema' },
    ]
  }
];

export const getAllFeatureKeysForMenu = (menuKey) => {
  const menu = MENU_RESOURCES.find(m => m.key === menuKey);
  if (!menu) return [menuKey];
  return [menuKey, ...menu.features.map(f => f.key)];
};

export const getAllSystemPermissionKeys = () => {
  const keys = [];
  MENU_RESOURCES.forEach(menu => {
    keys.push(menu.key);
    menu.features.forEach(feat => keys.push(feat.key));
  });
  return keys;
};

const ALL_KEYS = getAllSystemPermissionKeys();

export const ROLE_PERMISSIONS = {
  Admin: ALL_KEYS,
  Gerente: [
    ...getAllFeatureKeysForMenu('dashboard'),
    ...getAllFeatureKeysForMenu('inventory'),
    ...getAllFeatureKeysForMenu('purchases'),
    ...getAllFeatureKeysForMenu('sales'),
    ...getAllFeatureKeysForMenu('reservations'),
    ...getAllFeatureKeysForMenu('finances'),
  ],
  Vendedor: [
    ...getAllFeatureKeysForMenu('dashboard'),
    ...getAllFeatureKeysForMenu('sales'),
    ...getAllFeatureKeysForMenu('reservations'),
  ],
  Visualizador: [
    'dashboard', 'dashboard.view_summary', 'dashboard.view_metrics', 'dashboard.view_stats', 'dashboard.view_alerts',
    'inventory', 'inventory.view',
    'purchases', 'purchases.view',
    'sales', 'sales.view',
    'reservations', 'reservations.view',
    'finances', 'finances.view',
  ],
  Personalizado: [],
};

const normalizeRole = (role) => {
  if (!role) return 'Admin';
  const value = String(role).trim().toLowerCase();
  if (['admin', 'administrator', 'superadmin'].includes(value)) return 'Admin';
  if (['gerente', 'manager'].includes(value)) return 'Gerente';
  if (['vendedor', 'seller', 'sales', 'staff', 'funcionario', 'employee'].includes(value)) return 'Vendedor';
  if (['visualizador', 'viewer', 'read-only'].includes(value)) return 'Visualizador';
  if (['personalizado', 'custom'].includes(value)) return 'Personalizado';
  return 'Admin';
};

const parsePermissions = (val) => {
  if (!val) return null;
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const getRolePermissions = (roleOrUser) => {
  let user = null;
  let role = roleOrUser;

  if (roleOrUser && typeof roleOrUser === 'object') {
    user = roleOrUser;
    role = user.role;
  }

  const normalizedRole = normalizeRole(role);
  if (user && Array.isArray(user.permissions)) {
    return user.permissions;
  }

  return ROLE_PERMISSIONS[normalizedRole] || ALL_KEYS;
};

const getStoredUser = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const parsed = JSON.parse(token);
    if (!parsed || typeof parsed !== 'object') {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return {
      ...parsed,
      role: normalizeRole(parsed?.role),
      permissions: parsePermissions(parsed?.permissions),
    };
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
};

export const login = async (email, password) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      localStorage.removeItem(TOKEN_KEY);
      return false;
    }

    const token = JSON.stringify({
      id: data.user.id,
      name: data.user.name,
      role: normalizeRole(data.user.role),
      email: data.user.email,
      permissions: parsePermissions(data.user.permissions),
    });

    localStorage.setItem(TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error('Login failed', error);
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = () => {
  const user = getStoredUser();
  return !!user;
};

export const getLoggedUser = () => {
  return getStoredUser();
};

export const canAccessMenu = (menuKey, userOrRole = null) => {
  let user = null;
  if (userOrRole && typeof userOrRole === 'object') {
    user = userOrRole;
  } else {
    user = getLoggedUser();
  }

  if (!user) {
    if (typeof userOrRole === 'string') {
      const normalizedRole = normalizeRole(userOrRole);
      const rolePerms = ROLE_PERMISSIONS[normalizedRole] || [];
      return rolePerms.includes(menuKey) || rolePerms.some(p => p.startsWith(`${menuKey}.`));
    }
    return false;
  }

  const userRole = normalizeRole(user.role);

  const userPerms = Array.isArray(user.permissions)
    ? user.permissions
    : (ROLE_PERMISSIONS[userRole] || []);

  // Check if direct menu key or any sub-feature key of menu exists
  return userPerms.includes(menuKey) || userPerms.some(p => p.startsWith(`${menuKey}.`));
};

export const hasPermission = (permissionKey, userOrRole = null) => {
  let user = null;
  if (userOrRole && typeof userOrRole === 'object') {
    user = userOrRole;
  } else {
    user = getLoggedUser();
  }

  if (!user) {
    if (typeof userOrRole === 'string') {
      const normalizedRole = normalizeRole(userOrRole);
      const rolePerms = ROLE_PERMISSIONS[normalizedRole] || [];
      return rolePerms.includes(permissionKey);
    }
    return false;
  }

  const userRole = normalizeRole(user.role);

  const userPerms = Array.isArray(user.permissions)
    ? user.permissions
    : (ROLE_PERMISSIONS[userRole] || []);

  return userPerms.includes(permissionKey);
};

export const hasAccess = (allowedRolesOrMenuKey = []) => {
  const user = getLoggedUser();
  if (!user) return false;

  const userRole = normalizeRole(user.role);

  if (typeof allowedRolesOrMenuKey === 'string') {
    return canAccessMenu(allowedRolesOrMenuKey, user) || normalizeRole(allowedRolesOrMenuKey) === userRole;
  }

  if (Array.isArray(allowedRolesOrMenuKey)) {
    return allowedRolesOrMenuKey.some((item) => {
      return canAccessMenu(item, user) || normalizeRole(item) === userRole;
    });
  }

  return false;
};

export { normalizeRole, getRolePermissions };
