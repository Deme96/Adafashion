import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRole, getRolePermissions, hasAccess } from './auth.js';

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
});

test('role permissions restrict menus to the assigned role', () => {
  assert.deepEqual(getRolePermissions('Admin').filter((item) => item === 'settings'), ['settings']);
  assert.deepEqual(getRolePermissions('Vendedor'), ['dashboard', 'sales', 'reservations']);
  assert.deepEqual(getRolePermissions('Visualizador'), ['dashboard', 'inventory', 'purchases', 'sales', 'reservations', 'finances']);
});

test('hasAccess respects the logged user role', () => {
  localStorageMock.setItem('adafashion_admin_token', JSON.stringify({ role: 'Vendedor' }));
  assert.equal(hasAccess(['Vendedor']), true);
  assert.equal(hasAccess(['Admin']), false);
  assert.equal(hasAccess(['Gerente', 'Visualizador']), false);
});
