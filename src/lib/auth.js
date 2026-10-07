// ========== Ada Fashion Authentication & Customizable Permissions ==========

import { getApiBaseUrl } from './api.js';

const TOKEN_KEY = 'adafashion_admin_token';
const ADMIN_EMAIL = 'admin@adafashion.com';
const ADMIN_PASS = 'admin123';

export const MENU_RESOURCES = [
  { key: 'dashboard', label: 'Dashboard / Visão Geral', icon: 'LayoutDashboard', description: 'Visualizar resumo, métricas e estatísticas da loja' },
  { key: 'inventory', label: 'Controle de Estoque', icon: 'Warehouse', description: 'Cadastrar, editar e controlar estoque de produtos' },
  { key: 'purchases', label: 'Compras', icon: 'ShoppingCart', description: 'Registo e controle de compras de reposição' },
  { key: 'sales', label: 'Vendas', icon: 'BarChart3', description: 'Registo e acompanhamento de vendas e faturamento' },
  { key: 'reservations', label: 'Reservas', icon: 'CalendarClock', description: 'Gestão de reservas de produtos para clientes' },
  { key: 'finances', label: 'Finanças', icon: 'DollarSign', description: 'Controle de fluxo de caixa, despesas e lucros' },
  { key: 'settings', label: 'Configurações', icon: 'Settings', description: 'Gestão de usuários, promoções, notícias e loja' },
];

export const ROLE_PERMISSIONS = {
  Admin: ['dashboard', 'inventory', 'purchases', 'sales', 'reservations', 'finances', 'settings'],
  Gerente: ['dashboard', 'inventory', 'purchases', 'sales', 'reservations', 'finances'],
  Vendedor: ['dashboard', 'sales', 'reservations'],
  Visualizador: ['dashboard', 'inventory', 'purchases', 'sales', 'reservations', 'finances'],
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
  if (normalizedRole === 'Admin') {
    return MENU_RESOURCES.map((m) => m.key);
  }

  if (user && Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions;
  }

  return ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS.Admin;
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
      if (normalizedRole === 'Admin') return true;
      return (ROLE_PERMISSIONS[normalizedRole] || []).includes(menuKey);
    }
    return false;
  }

  const userRole = normalizeRole(user.role);
  if (userRole === 'Admin') return true;

  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions.includes(menuKey);
  }

  return (ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.Admin).includes(menuKey);
};

export const hasAccess = (allowedRolesOrMenuKey = []) => {
  const user = getLoggedUser();
  if (!user) return false;

  const userRole = normalizeRole(user.role);
  if (userRole === 'Admin') return true;

  if (typeof allowedRolesOrMenuKey === 'string') {
    return canAccessMenu(allowedRolesOrMenuKey, user);
  }

  if (Array.isArray(allowedRolesOrMenuKey)) {
    return allowedRolesOrMenuKey.some((item) => {
      if (normalizeRole(item) === userRole) return true;
      return canAccessMenu(item, user);
    });
  }

  return false;
};

export { normalizeRole, getRolePermissions };
