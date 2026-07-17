// ========== MODARE Database Module ==========
// Simulates a BaaS with localStorage for CRUD operations

const DB_PREFIX = 'modare_db_';

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const getCollection = (collection) => {
  try {
    const data = localStorage.getItem(DB_PREFIX + collection);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveCollection = (collection, data) => {
  localStorage.setItem(DB_PREFIX + collection, JSON.stringify(data));
};

export const db = {
  getAll(collection) {
    return getCollection(collection);
  },

  getById(collection, id) {
    const items = getCollection(collection);
    return items.find(item => item.id === id) || null;
  },

  create(collection, data) {
    const items = getCollection(collection);
    const newItem = {
      ...data,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    items.push(newItem);
    saveCollection(collection, items);
    return newItem;
  },

  update(collection, id, data) {
    const items = getCollection(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    items[index] = {
      ...items[index],
      ...data,
      id, // preserve id
      updated_at: new Date().toISOString(),
    };
    saveCollection(collection, items);
    return items[index];
  },

  remove(collection, id) {
    const items = getCollection(collection);
    const filtered = items.filter(item => item.id !== id);
    saveCollection(collection, filtered);
    return filtered.length < items.length;
  },

  query(collection, filterFn) {
    const items = getCollection(collection);
    return items.filter(filterFn);
  },

  // Clear a specific collection
  clear(collection) {
    localStorage.removeItem(DB_PREFIX + collection);
  },

  // Check if seed data has been loaded
  isSeeded() {
    return localStorage.getItem(DB_PREFIX + 'seeded') === 'true';
  },

  markSeeded() {
    localStorage.setItem(DB_PREFIX + 'seeded', 'true');
  },
};

// Activity log helper
export const logActivity = (action, details, entityType = '', entityId = '') => {
  db.create('activity_logs', {
    action,
    details,
    user_name: 'Admin',
    entity_type: entityType,
    entity_id: entityId,
  });
};

export default db;
