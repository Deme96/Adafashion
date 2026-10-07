import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRole, getRolePermissions, hasAccess, canAccessMenu, hasPermission } from './auth.js';
import { getApiBaseUrl } from './api.js';

const storage = new Map();
const localStorageMock = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
  removeItem(key) {
    storage.delete(key);
  },
  clear() {
    storage.clear();
  },
};

global.localStorage = localStorageMock;

test('normalizeRole maps common admin roles to Admin', () => {
  assert.equal(normalizeRole('superadmin'), 'Admin');
  assert.equal(normalizeRole('gerente'), 'Gerente');
  assert.equal(normalizeRole('vendedor'), 'Vendedor');
  assert.equal(normalizeRole('viewer'), 'Visualizador');
  assert.equal(normalizeRole('custom'), 'Personalizado');
});

test('role permissions restrict menus to the assigned role', () => {
  assert.ok(getRolePermissions('Admin').includes('settings'));
  assert.ok(getRolePermissions('Vendedor').includes('sales'));
  assert.ok(getRolePermissions('Visualizador').includes('inventory.view'));
});

test('getApiBaseUrl uses the current host for external device access', () => {
  global.window = { location: { protocol: 'http:', hostname: '192.168.1.50', host: '192.168.1.50:4000' } };
  assert.equal(getApiBaseUrl(), 'http://192.168.1.50:4000/api');
  delete global.window;
});

test('hasAccess respects the logged user role and custom sub-permissions', () => {
  localStorageMock.setItem('adafashion_admin_token', JSON.stringify({ role: 'Vendedor' }));
  assert.equal(hasAccess(['Vendedor']), true);
  assert.equal(hasAccess(['Admin']), false);
  assert.equal(hasAccess(['Gerente']), false);

  // Test custom sub-permissions
  localStorageMock.setItem('adafashion_admin_token', JSON.stringify({
    role: 'Personalizado',
    permissions: ['inventory.view', 'dashboard.view_summary']
  }));
  assert.equal(canAccessMenu('inventory'), true);
  assert.equal(canAccessMenu('dashboard'), true);
  assert.equal(hasPermission('dashboard.view_summary'), true);
  assert.equal(hasPermission('inventory.create'), false);
  assert.equal(canAccessMenu('finances'), false);
});
