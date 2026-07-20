// ========== Ada Fashion Authentication Logic ==========

import { getApiBaseUrl } from './api.js';

const TOKEN_KEY = 'adafashion_admin_token';
const ADMIN_EMAIL = 'admin@adafashion.com';
const ADMIN_PASS = 'admin123';

const normalizeRole = (role) => {
  if (!role) return 'Admin';
  const value = String(role).trim().toLowerCase();
  if (['admin', 'administrator', 'superadmin'].includes(value)) return 'Admin';
  if (['gerente', 'manager'].includes(value)) return 'Gerente';
  if (['vendedor', 'seller', 'sales', 'staff', 'funcionario', 'employee'].includes(value)) return 'Vendedor';
  if (['visualizador', 'viewer', 'read-only'].includes(value)) return 'Visualizador';
  return 'Admin';
};

const ROLE_PERMISSIONS = {
  Admin: ['dashboard', 'inventory', 'purchases', 'sales', 'reservations', 'finances', 'settings'],
  Gerente: ['dashboard', 'inventory', 'purchases', 'sales', 'reservations', 'finances'],
  Vendedor: ['dashboard', 'sales', 'reservations'],
  Visualizador: ['dashboard', 'inventory', 'purchases', 'sales', 'reservations', 'finances'],
};

const getRolePermissions = (role) => {
  const normalizedRole = normalizeRole(role);
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

export const hasAccess = (allowedRoles = []) => {
  const user = getLoggedUser();
  if (!user) return false;
  const userRole = normalizeRole(user?.role);
  return (allowedRoles || []).some((role) => normalizeRole(role) === userRole);
};

export const canAccessMenu = (menuKey, role = null) => {
  const userRole = normalizeRole(role || getLoggedUser()?.role);
  return getRolePermissions(userRole).includes(menuKey);
};

export { normalizeRole, getRolePermissions };
