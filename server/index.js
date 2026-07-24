const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const serverless = require('serverless-http');

const dbModule = require('./db');

const { pool, ADMIN_CREDENTIALS } = dbModule;

// Admin credentials com fallback
const ADMIN_EMAIL = ADMIN_CREDENTIALS?.email || 'admin@adafashion.com';
const ADMIN_PASSWORD = ADMIN_CREDENTIALS?.password || 'admin123';
const ADMIN_FULL_NAME = ADMIN_CREDENTIALS?.fullName || 'Administrador AdaFashion';

// Log Helper
const logActivity = async (action, details, userName = 'Admin', entityType = null, entityId = null) => {
  try {
    if (!pool) return;
    await pool.query(
      'INSERT INTO activity_logs (action, details, user_name, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
      [action, details, userName, entityType, entityId]
    );
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};


const app = express();

// Configurar CORS para permitir acesso de dispositivos externos
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-user'],
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));

const sanitizeValue = (value, maxLength = 1200) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 8).map(item => sanitizeValue(item, 300));
  }
  if (typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, item]) => {
      if (['password', 'password_hash', 'token'].includes(String(key).toLowerCase())) {
        acc[key] = '[redacted]';
        return acc;
      }
      acc[key] = sanitizeValue(item, 300);
      return acc;
    }, {});
  }
  return String(value).slice(0, maxLength);
};

const summarizePayload = (value) => {
  if (!value) return null;
  const sanitized = sanitizeValue(value);
  const text = JSON.stringify(sanitized);
  return text.length > 1000 ? `${text.slice(0, 997)}...` : text;
};

const logApiOperation = async (req, res, startedAt) => {
  try {
    if (!req.path.startsWith('/api') || req.path === '/api/activity-logs' || req.method === 'OPTIONS') {
      return;
    }

    const userName = req.headers['x-admin-user'] || req.body?.user_name || req.body?.name || null;
    const payload = req.method !== 'GET' && req.method !== 'DELETE' ? req.body : null;
    const entityType = req.path.split('/').filter(Boolean)[1] || 'api';
    const entityId = req.params?.id || req.body?.id || null;
    const action = `${req.method} ${req.path}`;
    const details = [
      `status=${res.statusCode}`,
      `duration=${Date.now() - startedAt}ms`,
      payload ? `body=${summarizePayload(payload)}` : null,
      req.query && Object.keys(req.query).length ? `query=${JSON.stringify(req.query)}` : null,
    ].filter(Boolean).join(' | ');

    await pool.query(
      'INSERT INTO activity_logs (action, details, user_name, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
      [action, details, userName || 'system', entityType, entityId]
    );
  } catch (error) {
    console.error('Failed to write API activity log', error);
  }
};

app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    return next();
  }

  const startedAt = Date.now();
  res.on('finish', () => {
    logApiOperation(req, res, startedAt);
  });
  next();
});

// --- RESERVATIONS ---
app.get('/api/reservations', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reservations ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

app.post('/api/reservations', async (req, res) => {
  try {
    const { customer_name, customer_phone, customer_email, reservation_date, notes } = req.body;
    const [result] = await pool.query(
      'INSERT INTO reservations (customer_name, customer_phone, customer_email, reservation_date, notes, status) VALUES (?, ?, ?, ?, ?, ?)',
      [customer_name, customer_phone, customer_email, reservation_date, notes, 'pending']
    );
    res.status(201).json({ id: result.insertId, ...req.body, status: 'pending' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

// --- CLEAR ACTIVITY LOGS ---
app.delete('/api/activity-logs', async (req, res) => {
  try {
    await pool.query('TRUNCATE TABLE activity_logs');
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to clear activity logs' });
  }
});

const parseJson = (value) => {
  if (value === null || value === undefined) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const safeParseArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return String(value).split(',').map(item => item.trim()).filter(Boolean);
  }
};

const toJsonString = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
};

const generateSlug = (text) => {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `product-${Date.now()}`;
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const normalizeUserRole = (role) => {
  if (!role) return 'Admin';
  const value = String(role).trim().toLowerCase();
  if (['admin', 'administrator', 'superadmin'].includes(value)) return 'Admin';
  if (['gerente', 'manager'].includes(value)) return 'Gerente';
  if (['vendedor', 'seller', 'sales', 'staff', 'funcionario', 'employee'].includes(value)) return 'Vendedor';
  if (['visualizador', 'viewer', 'read-only'].includes(value)) return 'Visualizador';
  return 'Admin';
};

const ensureColumn = async (table, column, definition) => {
  const [rows] = await pool.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1 AND column_name = $2`,
    [table, column]
  );

  if (!rows || rows.length === 0) {
    await pool.query(`ALTER TABLE "${table}" ADD COLUMN ${definition}`);
  }
};

const ensureSchema = async () => {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Admin',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);

  await pool.query(`CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    password_hash VARCHAR(255) DEFAULT NULL,
    account_type VARCHAR(30) NOT NULL DEFAULT 'normal',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);

  await pool.query(`CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    wholesale_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    category VARCHAR(100) DEFAULT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sale_price NUMERIC(10,2) DEFAULT NULL,
    status_geral VARCHAR(50) DEFAULT NULL,
    colors TEXT DEFAULT NULL,
    sizes TEXT DEFAULT NULL,
    images TEXT DEFAULT NULL,
    wholesale_min_qty INT NOT NULL DEFAULT 0,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    purchase_quantity INT NOT NULL DEFAULT 0,
    total_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    supplier VARCHAR(150) DEFAULT NULL,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);

  await pool.query(`CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    notes TEXT DEFAULT NULL,
    customer_name VARCHAR(150) DEFAULT NULL,
    customer_email VARCHAR(150) DEFAULT NULL,
    customer_phone VARCHAR(30) DEFAULT NULL,
    customer_address TEXT DEFAULT NULL,
    transaction_id VARCHAR(100) DEFAULT NULL,
    items TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);

  await pool.query(`CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);

  await pool.query(`CREATE TABLE IF NOT EXISTS promotions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT DEFAULT NULL,
    discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    applicable_categories TEXT DEFAULT NULL,
    selected_products TEXT DEFAULT NULL,
    banner_image TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);

  await pool.query(`CREATE TABLE IF NOT EXISTS news (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT DEFAULT NULL,
    image TEXT DEFAULT NULL,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);

  await pool.query(`CREATE TABLE IF NOT EXISTS videos (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    url TEXT DEFAULT NULL,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);

  await pool.query(`CREATE TABLE IF NOT EXISTS carousel_photos (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    image_url TEXT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);

  await pool.query(`CREATE TABLE IF NOT EXISTS store_settings (
    id BIGSERIAL PRIMARY KEY,
    store_name VARCHAR(150) DEFAULT 'Ada Fashion',
    language VARCHAR(10) DEFAULT 'pt-BR',
    currency VARCHAR(10) DEFAULT 'XOF',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);

  await pool.query(`CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(150) NOT NULL,
    details TEXT DEFAULT NULL,
    user_name VARCHAR(150) DEFAULT NULL,
    entity_type VARCHAR(100) DEFAULT NULL,
    entity_id VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);

  await pool.query(`CREATE TABLE IF NOT EXISTS reservations (
    id BIGSERIAL PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(30) DEFAULT NULL,
    customer_email VARCHAR(150) DEFAULT NULL,
    reservation_date DATE NOT NULL,
    notes TEXT DEFAULT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);

  await pool.query(`CREATE TABLE IF NOT EXISTS stock_movements (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    reason VARCHAR(150) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);

  await ensureColumn('products', 'sale_price', 'sale_price NUMERIC(10,2) DEFAULT NULL');
  await ensureColumn('products', 'status_geral', 'status_geral VARCHAR(50) DEFAULT NULL');
  await ensureColumn('products', 'colors', 'colors TEXT DEFAULT NULL');
  await ensureColumn('products', 'sizes', 'sizes TEXT DEFAULT NULL');
  await ensureColumn('products', 'images', 'images TEXT DEFAULT NULL');
  await ensureColumn('products', 'wholesale_min_qty', 'wholesale_min_qty INT NOT NULL DEFAULT 0');
  await ensureColumn('products', 'unit_price', 'unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00');
  await ensureColumn('products', 'purchase_quantity', 'purchase_quantity INT NOT NULL DEFAULT 0');
  await ensureColumn('products', 'total_cost', 'total_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00');
  await ensureColumn('products', 'supplier', 'supplier VARCHAR(150) DEFAULT NULL');
  await ensureColumn('products', 'is_featured', 'is_featured BOOLEAN NOT NULL DEFAULT FALSE');

  await pool.query(`ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50)`);
  await pool.query(`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'Admin'`);
  await pool.query(`UPDATE users SET role = CASE
    WHEN LOWER(TRIM(role)) IN ('admin', 'administrator', 'superadmin') THEN 'Admin'
    WHEN LOWER(TRIM(role)) IN ('gerente', 'manager') THEN 'Gerente'
    WHEN LOWER(TRIM(role)) IN ('vendedor', 'seller', 'sales', 'staff', 'funcionario', 'employee') THEN 'Vendedor'
    WHEN LOWER(TRIM(role)) IN ('visualizador', 'viewer', 'read-only') THEN 'Visualizador'
    ELSE 'Admin'
  END`);

  await ensureColumn('orders', 'customer_name', 'customer_name VARCHAR(150) DEFAULT NULL');
  await ensureColumn('orders', 'customer_email', 'customer_email VARCHAR(150) DEFAULT NULL');
  await ensureColumn('orders', 'customer_phone', 'customer_phone VARCHAR(30) DEFAULT NULL');
  await ensureColumn('orders', 'customer_address', 'customer_address TEXT DEFAULT NULL');
  await ensureColumn('orders', 'transaction_id', 'transaction_id VARCHAR(100) DEFAULT NULL');
  await ensureColumn('orders', 'items', 'items TEXT DEFAULT NULL');
  await ensureColumn('customers', 'account_type', "account_type VARCHAR(30) NOT NULL DEFAULT 'normal'");
};

const mapProduct = (row) => ({
  ...row,
  colors: safeParseArray(row.colors),
  sizes: safeParseArray(row.sizes),
  images: safeParseArray(row.images),
  is_active: Boolean(row.is_active),
});

const mapPromotion = (row) => ({
  ...row,
  applicable_categories: safeParseArray(row.applicable_categories),
  selected_products: safeParseArray(row.selected_products),
  is_active: Boolean(row.is_active),
});

const mapNews = (row) => ({
  ...row,
  is_published: Boolean(row.is_published),
});

const mapVideo = (row) => ({
  ...row,
  is_published: Boolean(row.is_published),
});

const mapCarouselPhoto = (row) => ({...row});

const mapStoreSettings = (row) => ({...row});

const mapOrder = (row) => ({
  ...row,
  subtotal: parseFloat(row.subtotal) || 0,
  discount: parseFloat(row.discount) || 0,
  total: parseFloat(row.total) || 0,
  items: parseJson(row.items) || [],
  shipping_address: parseJson(row.shipping_address) || {},
  created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
});

const mapUser = (row) => ({
  ...row,
  role: normalizeUserRole(row?.role),
});

const mapActivityLog = (row) => ({...row});

app.get('/api/orders', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows.map(mapOrder));
  } catch (error) {
    console.error('Error fetching orders', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    const order = rows[0];
    if (!order) return res.status(404).json({ message: 'Not found' });
    res.json(mapOrder(order));
  } catch (error) {
    console.error('Error fetching order', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const {
      customer_id,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      transaction_id,
      order_number,
      status,
      payment_method,
      payment_status,
      subtotal,
      discount,
      total,
      notes,
      items,
    } = req.body;

    const generatedOrderNumber = order_number || `ORDER-${Date.now()}`;

    const [result] = await pool.query(
      'INSERT INTO orders (customer_id, customer_name, customer_email, customer_phone, customer_address, transaction_id, order_number, status, payment_method, payment_status, subtotal, discount, total, notes, items) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        customer_id || null,
        customer_name || null,
        customer_email || null,
        customer_phone || null,
        customer_address || null,
        transaction_id || null,
        generatedOrderNumber,
        status || 'pending',
        payment_method || null,
        payment_status || 'pending',
        subtotal || 0,
        discount || 0,
        total || 0,
        notes || null,
        toJsonString(items) || null,
      ]
    );

    res.status(201).json({ id: result.insertId, order_number: generatedOrderNumber, ...req.body });
  } catch (error) {
    console.error('Error creating order', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { status, payment_status, total, notes, items, customer_name, customer_email, customer_phone, payment_method } = req.body;
    
    // Build dynamic update query - only update fields that were sent
    const updates = [];
    const values = [];
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (payment_status !== undefined) { updates.push('payment_status = ?'); values.push(payment_status); }
    if (total !== undefined) { updates.push('total = ?'); values.push(total); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
    if (items !== undefined) { updates.push('items = ?'); values.push(toJsonString(items)); }
    if (customer_name !== undefined) { updates.push('customer_name = ?'); values.push(customer_name); }
    if (customer_email !== undefined) { updates.push('customer_email = ?'); values.push(customer_email); }
    if (customer_phone !== undefined) { updates.push('customer_phone = ?'); values.push(customer_phone); }
    if (payment_method !== undefined) { updates.push('payment_method = ?'); values.push(payment_method); }
    updates.push('updated_at = CURRENT_TIMESTAMP');

    if (updates.length > 1) {
      await pool.query(
        `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
        [...values, req.params.id]
      );
    }

    // When status changes to 'Entregue', decrement stock for each item and log activity
    if (status === 'Entregue') {
      // Get the order to read its items
      const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
      const order = orderRows[0];
      if (order) {
        const orderItems = parseJson(order.items) || [];
        for (const item of orderItems) {
          const productId = item.product_id || item.id;
          if (productId) {
            await pool.query(
              'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
              [item.quantity || 1, productId]
            );
          }
        }
        await logActivity(
          'Venda Concluída',
          `Encomenda #${String(order.order_number || order.id).slice(-8)} entregue ao cliente ${order.customer_name || 'Balcão'}. Total: ${order.total} F CFA.`,
          'Sistema', 'Vendas', order.id
        );
      }
    }

    const [updatedRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    res.json(mapOrder(updatedRows[0]));
  } catch (error) {
    console.error('Error updating order', error);
    res.status(500).json({ message: 'Failed to update order' });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting order', error);
    res.status(500).json({ message: 'Failed to delete order' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY updated_at DESC');
    res.json(rows.map(mapProduct));
  } catch (error) {
    console.error('Error fetching products', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    const product = rows[0];
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(mapProduct(product));
  } catch (error) {
    console.error('Error fetching product', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      sale_price,
      stock,
      category,
      image_url,
      status_geral,
      colors,
      sizes,
      images,
      wholesale_price,
      wholesale_min_qty,
      unit_price,
      purchase_quantity,
      total_cost,
      supplier,
      is_active,
      is_featured,
    } = req.body;

    const productSlug = slug || generateSlug(name);
    const [result] = await pool.query(
      'INSERT INTO products (name, slug, description, price, sale_price, stock, category, image_url, status_geral, colors, sizes, images, wholesale_price, wholesale_min_qty, unit_price, purchase_quantity, total_cost, supplier, is_active, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        productSlug,
        description || null,
        price || 0,
        sale_price || 0,
        stock || 0,
        category || null,
        image_url || null,
        status_geral || 'Ativo',
        toJsonString(colors),
        toJsonString(sizes),
        toJsonString(images),
        wholesale_price || 0,
        wholesale_min_qty || 0,
        unit_price || 0,
        purchase_quantity || 0,
        total_cost || 0,
        supplier || null,
        is_active ? 1 : 0,
        is_featured ? 1 : 0,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    const newProduct = rows[0];
    await logActivity('Cadastro', `Novo produto adicionado: ${name}`, 'Sistema', 'Produtos', newProduct.id);
    res.status(201).json(mapProduct(newProduct));
  } catch (error) {
    console.error('Error creating product', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      sale_price,
      stock,
      category,
      image_url,
      status_geral,
      colors,
      sizes,
      images,
      wholesale_price,
      wholesale_min_qty,
      unit_price,
      purchase_quantity,
      total_cost,
      supplier,
      is_active,
      is_featured,
    } = req.body;

    const productSlug = slug || generateSlug(name);
    await pool.query(
      'UPDATE products SET name = ?, slug = ?, description = ?, price = ?, sale_price = ?, stock = ?, category = ?, image_url = ?, status_geral = ?, colors = ?, sizes = ?, images = ?, wholesale_price = ?, wholesale_min_qty = ?, unit_price = ?, purchase_quantity = ?, total_cost = ?, supplier = ?, is_active = ?, is_featured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [
        name,
        productSlug,
        description || null,
        price || 0,
        sale_price || null,
        stock || 0,
        category || null,
        image_url || null,
        status_geral || null,
        toJsonString(colors),
        toJsonString(sizes),
        toJsonString(images),
        wholesale_price || null,
        wholesale_min_qty || 0,
        unit_price || 0,
        purchase_quantity || 0,
        total_cost || 0,
        supplier || null,
        is_active ? 1 : 0,
        is_featured ? 1 : 0,
        req.params.id,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    const updatedProduct = rows[0];
    await logActivity('Edição', `O produto '${updatedProduct.name || name}' foi atualizado.`, 'Sistema', 'Produtos', updatedProduct.id);
    res.json(mapProduct(updatedProduct));
  } catch (error) {
    console.error('Error updating product', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting product', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

app.get('/api/promotions', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM promotions ORDER BY updated_at DESC');
    res.json(rows.map(mapPromotion));
  } catch (error) {
    console.error('Error fetching promotions', error);
    res.status(500).json({ message: 'Failed to fetch promotions' });
  }
});

app.post('/api/promotions', async (req, res) => {
  try {
    const { name, description, discount_percent, start_date, end_date, is_active, applicable_categories, selected_products, banner_image } = req.body;
    const [result] = await pool.query(
      'INSERT INTO promotions (name, description, discount_percent, start_date, end_date, is_active, applicable_categories, selected_products, banner_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        description || null,
        discount_percent || 0,
        start_date || null,
        end_date || null,
        is_active ? 1 : 0,
        toJsonString(applicable_categories),
        toJsonString(selected_products),
        banner_image || null,
      ]
    );
    const [rows] = await pool.query('SELECT * FROM promotions WHERE id = ?', [result.insertId]);
    res.status(201).json(mapPromotion(rows[0]));
  } catch (error) {
    console.error('Error creating promotion', error);
    res.status(500).json({ message: 'Failed to create promotion' });
  }
});

app.put('/api/promotions/:id', async (req, res) => {
  try {
    const { name, description, discount_percent, start_date, end_date, is_active, applicable_categories, selected_products, banner_image } = req.body;
    await pool.query(
      'UPDATE promotions SET name = ?, description = ?, discount_percent = ?, start_date = ?, end_date = ?, is_active = ?, applicable_categories = ?, selected_products = ?, banner_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [
        name,
        description || null,
        discount_percent || 0,
        start_date || null,
        end_date || null,
        is_active ? 1 : 0,
        toJsonString(applicable_categories),
        toJsonString(selected_products),
        banner_image || null,
        req.params.id,
      ]
    );
    const [rows] = await pool.query('SELECT * FROM promotions WHERE id = ?', [req.params.id]);
    res.json(mapPromotion(rows[0]));
  } catch (error) {
    console.error('Error updating promotion', error);
    res.status(500).json({ message: 'Failed to update promotion' });
  }
});

app.delete('/api/promotions/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM promotions WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting promotion', error);
    res.status(500).json({ message: 'Failed to delete promotion' });
  }
});

app.get('/api/news', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM news ORDER BY updated_at DESC');
    res.json(rows.map(mapNews));
  } catch (error) {
    console.error('Error fetching news', error);
    res.status(500).json({ message: 'Failed to fetch news' });
  }
});

app.post('/api/news', async (req, res) => {
  try {
    const { title, content, image, is_published } = req.body;
    const [result] = await pool.query(
      'INSERT INTO news (title, content, image, is_published) VALUES (?, ?, ?, ?)',
      [title, content || null, image || null, is_published ? 1 : 0]
    );
    const [rows] = await pool.query('SELECT * FROM news WHERE id = ?', [result.insertId]);
    res.status(201).json(mapNews(rows[0]));
  } catch (error) {
    console.error('Error creating news', error);
    res.status(500).json({ message: 'Failed to create news' });
  }
});

app.put('/api/news/:id', async (req, res) => {
  try {
    const { title, content, image, is_published } = req.body;
    await pool.query(
      'UPDATE news SET title = ?, content = ?, image = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, content || null, image || null, is_published ? 1 : 0, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM news WHERE id = ?', [req.params.id]);
    res.json(mapNews(rows[0]));
  } catch (error) {
    console.error('Error updating news', error);
    res.status(500).json({ message: 'Failed to update news' });
  }
});

app.delete('/api/news/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM news WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting news', error);
    res.status(500).json({ message: 'Failed to delete news' });
  }
});

app.get('/api/videos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM videos ORDER BY updated_at DESC');
    res.json(rows.map(mapVideo));
  } catch (error) {
    console.error('Error fetching videos', error);
    res.status(500).json({ message: 'Failed to fetch videos' });
  }
});

app.post('/api/videos', async (req, res) => {
  try {
    const { title, url, is_published } = req.body;
    const [result] = await pool.query('INSERT INTO videos (title, url, is_published) VALUES (?, ?, ?)', [title, url || null, is_published ? 1 : 0]);
    const [rows] = await pool.query('SELECT * FROM videos WHERE id = ?', [result.insertId]);
    res.status(201).json(mapVideo(rows[0]));
  } catch (error) {
    console.error('Error creating video', error);
    res.status(500).json({ message: 'Failed to create video' });
  }
});

app.put('/api/videos/:id', async (req, res) => {
  try {
    const { title, url, is_published } = req.body;
    await pool.query('UPDATE videos SET title = ?, url = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [title, url || null, is_published ? 1 : 0, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM videos WHERE id = ?', [req.params.id]);
    res.json(mapVideo(rows[0]));
  } catch (error) {
    console.error('Error updating video', error);
    res.status(500).json({ message: 'Failed to update video' });
  }
});

app.delete('/api/videos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM videos WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting video', error);
    res.status(500).json({ message: 'Failed to delete video' });
  }
});

app.get('/api/carousel-photos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM carousel_photos ORDER BY updated_at DESC');
    res.json(rows.map(mapCarouselPhoto));
  } catch (error) {
    console.error('Error fetching carousel photos', error);
    res.status(500).json({ message: 'Failed to fetch carousel photos' });
  }
});

app.post('/api/carousel-photos', async (req, res) => {
  try {
    const { title, image_url, description } = req.body;
    const [result] = await pool.query('INSERT INTO carousel_photos (title, image_url, description) VALUES (?, ?, ?)', [title, image_url || null, description || null]);
    const [rows] = await pool.query('SELECT * FROM carousel_photos WHERE id = ?', [result.insertId]);
    res.status(201).json(mapCarouselPhoto(rows[0]));
  } catch (error) {
    console.error('Error creating carousel photo', error);
    res.status(500).json({ message: 'Failed to create carousel photo' });
  }
});

app.put('/api/carousel-photos/:id', async (req, res) => {
  try {
    const { title, image_url, description } = req.body;
    await pool.query('UPDATE carousel_photos SET title = ?, image_url = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [title, image_url || null, description || null, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM carousel_photos WHERE id = ?', [req.params.id]);
    res.json(mapCarouselPhoto(rows[0]));
  } catch (error) {
    console.error('Error updating carousel photo', error);
    res.status(500).json({ message: 'Failed to update carousel photo' });
  }
});

app.delete('/api/carousel-photos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM carousel_photos WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting carousel photo', error);
    res.status(500).json({ message: 'Failed to delete carousel photo' });
  }
});

app.get('/api/store-settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM store_settings ORDER BY id ASC LIMIT 1');
    if (rows.length === 0) {
      return res.json({ store_name: 'Ada Fashion', language: 'pt-BR', currency: 'XOF' });
    }
    res.json(mapStoreSettings(rows[0]));
  } catch (error) {
    console.error('Error fetching store settings', error);
    res.status(500).json({ message: 'Failed to fetch store settings' });
  }
});

app.post('/api/store-settings', async (req, res) => {
  try {
    const { store_name, language, currency } = req.body;
    const [existing] = await pool.query('SELECT id FROM store_settings ORDER BY id ASC LIMIT 1');
    if (existing.length > 0) {
      await pool.query('UPDATE store_settings SET store_name = ?, language = ?, currency = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [store_name || 'Ada Fashion', language || 'pt-BR', currency || 'XOF', existing[0].id]);
      const [rows] = await pool.query('SELECT * FROM store_settings WHERE id = ?', [existing[0].id]);
      res.json(mapStoreSettings(rows[0]));
      return;
    }

    const [result] = await pool.query('INSERT INTO store_settings (store_name, language, currency) VALUES (?, ?, ?)', [store_name || 'Ada Fashion', language || 'pt-BR', currency || 'XOF']);
    const [rows] = await pool.query('SELECT * FROM store_settings WHERE id = ?', [result.insertId]);
    res.json(mapStoreSettings(rows[0]));
  } catch (error) {
    console.error('Error saving store settings', error);
    res.status(500).json({ message: 'Failed to save store settings' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, full_name AS name, email, role, status, created_at, updated_at FROM users ORDER BY created_at DESC');
    res.json(rows.map(mapUser));
  } catch (error) {
    console.error('Error fetching users', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Cross-check: Ensure email doesn't exist in users or customers
    const [existingUser] = await pool.query('SELECT id FROM users WHERE LOWER(TRIM(email)) = ?', [normalizedEmail]);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'Este e-mail já está cadastrado no sistema (Usuários).' });
    }
    const [existingCustomer] = await pool.query('SELECT id FROM customers WHERE LOWER(TRIM(email)) = ?', [normalizedEmail]);
    if (existingCustomer.length > 0) {
      return res.status(409).json({ message: 'Este e-mail já está cadastrado no sistema (Clientes/Zona di Bideras).' });
    }

    const normalizedRole = normalizeUserRole(role || 'Vendedor');
    const [result] = await pool.query('INSERT INTO users (full_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)', [name, normalizedEmail, password, normalizedRole, 'active']);
    
    // Fetch newly created user by ID or Email as fallback
    const insertId = result.insertId || (result.rows && result.rows[0] ? result.rows[0].id : null);
    let rows = [];
    if (insertId) {
      [rows] = await pool.query('SELECT id, full_name AS name, email, role, status, created_at, updated_at FROM users WHERE id = ?', [insertId]);
    } else {
      [rows] = await pool.query('SELECT id, full_name AS name, email, role, status, created_at, updated_at FROM users WHERE email = ? ORDER BY created_at DESC LIMIT 1', [email]);
    }
    
    const newUser = rows[0];
    if (newUser) {
      await logActivity('Criação', `Novo usuário registrado: ${name} (${normalizedRole})`, 'Sistema', 'Usuários', newUser.id);
      res.status(201).json(mapUser(newUser));
    } else {
      throw new Error('Falha ao resgatar usuário recém-criado');
    }
  } catch (error) {
    console.error('Error creating user', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body;
    const updates = [];
    const values = [];
    if (name) { updates.push('full_name = ?'); values.push(name); }
    if (email) {
      const normalizedEmail = normalizeEmail(email);
      // Cross-check for update
      const [existingUser] = await pool.query('SELECT id FROM users WHERE LOWER(TRIM(email)) = ? AND id != ?', [normalizedEmail, req.params.id]);
      if (existingUser.length > 0) {
        return res.status(409).json({ message: 'Este e-mail já está cadastrado no sistema (Usuários).' });
      }
      const [existingCustomer] = await pool.query('SELECT id FROM customers WHERE LOWER(TRIM(email)) = ?', [normalizedEmail]);
      if (existingCustomer.length > 0) {
        return res.status(409).json({ message: 'Este e-mail já está cadastrado no sistema (Clientes/Zona di Bideras).' });
      }
      updates.push('email = ?'); 
      values.push(normalizedEmail); 
    }
    if (password) { updates.push('password_hash = ?'); values.push(password); }
    if (role !== undefined) { updates.push('role = ?'); values.push(normalizeUserRole(role)); }
    if (status) { updates.push('status = ?'); values.push(status); }
    if (updates.length === 0) return res.status(400).json({ message: 'No user fields to update' });
    values.push(req.params.id);
    await pool.query(`UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
    const [rows] = await pool.query('SELECT id, full_name AS name, email, role, status, created_at, updated_at FROM users WHERE id = ?', [req.params.id]);
    res.json(mapUser(rows[0]));
  } catch (error) {
    console.error('Error updating user', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting user', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

app.get('/api/activity-logs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 200');
    res.json(rows.map(mapActivityLog));
  } catch (error) {
    console.error('Error fetching activity logs', error);
    res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
});

app.post('/api/activity-logs', async (req, res) => {
  try {
    const { action, details, user_name, entity_type, entity_id } = req.body;
    const [result] = await pool.query('INSERT INTO activity_logs (action, details, user_name, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)', [action, details || null, user_name || null, entity_type || null, entity_id || null]);
    const [rows] = await pool.query('SELECT * FROM activity_logs WHERE id = ?', [result.insertId]);
    res.status(201).json(mapActivityLog(rows[0]));
  } catch (error) {
    console.error('Error creating activity log', error);
    res.status(500).json({ message: 'Failed to create activity log' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const fallbackAdmin = normalizedEmail === ADMIN_EMAIL.toLowerCase() && String(password || '').trim() === ADMIN_PASSWORD;

    let userRow = null;
    let dbAvailable = true;

    try {
      const [rows] = await pool.query('SELECT id, full_name AS name, email, role, password_hash FROM users WHERE LOWER(TRIM(email)) = ?', [normalizedEmail]);
      userRow = rows && rows[0] ? rows[0] : null;
    } catch (dbError) {
      console.error('Database auth lookup failed', dbError.message);
      dbAvailable = false;

      // Fallback: If admin credentials match and database is unavailable, allow login
      if (fallbackAdmin) {
        console.log('Using fallback admin authentication (database unavailable)');
        return res.json({
          success: true,
          user: {
            id: 1,
            name: ADMIN_FULL_NAME,
            email: normalizedEmail,
            role: 'Admin',
          },
        });
      }

      return res.status(503).json({
        success: false,
        message: 'Serviço de autenticação temporariamente indisponível. Verifique a configuração do banco de dados.',
      });
    }

    const directMatch = userRow && String(userRow.password_hash || '').trim() === String(password || '').trim();

    if (directMatch || fallbackAdmin) {
      // Try to update/create user in database if available
      if (dbAvailable && userRow && fallbackAdmin && String(userRow.password_hash || '').trim() !== ADMIN_PASSWORD) {
        try {
          await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [ADMIN_PASSWORD, email]);
        } catch (error) {
          console.error('Failed to update admin password', error.message);
        }
      }

      if (dbAvailable && !userRow) {
        try {
          await pool.query(
            'INSERT INTO users (full_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
            [ADMIN_FULL_NAME, normalizedEmail, ADMIN_PASSWORD, 'Admin', 'active']
          );
        } catch (error) {
          console.error('Failed to create admin user', error.message);
        }
      }

      const role = normalizeUserRole(userRow?.role || 'Admin');
      const user = userRow || {
        id: 1,
        name: ADMIN_FULL_NAME,
        email: normalizedEmail,
        role: 'Admin',
      };

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role,
        },
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Credenciais inválidas',
    });
  } catch (error) {
    console.error('Error authenticating', error);
    res.status(500).json({
      success: false,
      message: 'Falha ao processar autenticação',
    });
  }
});

app.post('/api/customers/register', async (req, res) => {
  try {
    const { name, email, phone, password, account_type } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nome, e-mail e senha são obrigatórios.' });
    }

    const normalizedName = String(name).trim();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedName || !normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Nome, e-mail e senha são obrigatórios.' });
    }

    const [existingCustomer] = await pool.query('SELECT id FROM customers WHERE LOWER(TRIM(email)) = ?', [normalizedEmail]);
    if (existingCustomer.length > 0) {
      return res.status(409).json({ success: false, message: 'Este e-mail já está cadastrado como cliente.' });
    }

    const [existingUser] = await pool.query('SELECT id FROM users WHERE LOWER(TRIM(email)) = ?', [normalizedEmail]);
    if (existingUser.length > 0) {
      return res.status(409).json({ success: false, message: 'Este e-mail já está cadastrado como usuário do sistema.' });
    }

    await pool.query(
      'INSERT INTO customers (full_name, email, phone, password_hash, account_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [normalizedName, normalizedEmail, phone || null, password, account_type || 'normal']
    );

    res.status(201).json({ success: true, message: 'Cliente registrado com sucesso.' });
  } catch (error) {
    console.error('Error registering customer', error);
    res.status(500).json({ success: false, message: 'Falha ao registrar cliente.' });
  }
});

app.post('/api/customers/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const [rows] = await pool.query('SELECT id, full_name AS name, email, password_hash, account_type FROM customers WHERE LOWER(TRIM(email)) = ?', [normalizedEmail]);
    const customer = rows[0];

    if (!customer || String(customer.password_hash || '').trim() !== String(password || '').trim()) {
      return res.status(401).json({ success: false, message: 'E-mail ou senha incorretos.' });
    }

    if (normalizeEmail(customer.email) !== normalizedEmail) {
      await pool.query('UPDATE customers SET email = ? WHERE id = ?', [normalizedEmail, customer.id]);
    }

    res.json({ success: true, customer: { id: customer.id, name: customer.name, email: normalizedEmail, account_type: customer.account_type || 'normal' } });
  } catch (error) {
    console.error('Error logging customer in', error);
    res.status(500).json({ success: false, message: 'Falha ao efetuar login.' });
  }
});

const seedDefaultData = async () => {
  // ── Always ensure admin user exists with correct credentials ──
  const [adminRows] = await pool.query('SELECT id FROM users WHERE LOWER(TRIM(email)) = ?', [ADMIN_EMAIL.toLowerCase()]);
  if (adminRows.length === 0) {
    await pool.query(
      'INSERT INTO users (full_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      [ADMIN_FULL_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, 'Admin', 'active']
    );
    console.log('Admin user created.');
  } else {
    await pool.query(
      'UPDATE users SET password_hash = ?, role = ?, status = ? WHERE LOWER(TRIM(email)) = ?',
      [ADMIN_PASSWORD, 'Admin', 'active', ADMIN_EMAIL.toLowerCase()]
    );
    console.log('Admin user credentials reset.');
  }

  // ── Products (7 records) ──
  const [productRows] = await pool.query('SELECT id FROM products LIMIT 1');
  if (productRows.length === 0) {
    const products = [
      ['Robe Wax Ankara', 'robe-wax-ankara', 'Robe élégante en tissu wax africain authentique avec coupe cintrée et manches évasées. Tissu 100% coton imprimé à la main.', 18500, 15900, 30, 'Vestidos', 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=600&h=750&fit=crop', 'Ativo', JSON.stringify(['Orange', 'Bleu Royal', 'Vert']), JSON.stringify(['S', 'M', 'L', 'XL']), JSON.stringify(['https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=600&h=750&fit=crop']), 12000, 5, 8500, 20, 170000, 'Atelier Mama Africa', 1, 1],
      ['Chemise Bazin Brodée', 'chemise-bazin-brodee', 'Chemise homme en bazin riche brodée à la main. Finitions soignées avec col mandarin et broderies traditionnelles.', 22000, 0, 25, 'Camisas', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=750&fit=crop', 'Ativo', JSON.stringify(['Blanc', 'Bleu Ciel', 'Or']), JSON.stringify(['M', 'L', 'XL', 'XXL']), JSON.stringify(['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=750&fit=crop']), 15000, 3, 10000, 15, 150000, 'Bazin Express Dakar', 1, 1],
      ['Ensemble Pagne Moderne', 'ensemble-pagne-moderne', 'Ensemble deux pièces en pagne africain revisité avec une coupe contemporaine. Jupe crayon et top assorti.', 25000, 21000, 18, 'Conjuntos', 'https://images.unsplash.com/photo-1617627143233-46f5be2fdce0?w=600&h=750&fit=crop', 'Ativo', JSON.stringify(['Multicolore', 'Rouge/Or', 'Vert/Jaune']), JSON.stringify(['S', 'M', 'L']), JSON.stringify(['https://images.unsplash.com/photo-1617627143233-46f5be2fdce0?w=600&h=750&fit=crop']), 17000, 3, 12000, 12, 144000, 'Couture Abidjan', 1, 1],
      ['Pantalon Kente Slim', 'pantalon-kente-slim', 'Pantalon slim fit avec détails en tissu kente ghanéen. Coupe moderne avec poches italiennes.', 16000, 0, 40, 'Calças', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop', 'Ativo', JSON.stringify(['Noir', 'Kente Gold', 'Kente Green']), JSON.stringify(['38', '40', '42', '44', '46']), JSON.stringify(['https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop']), 10000, 5, 7500, 25, 187500, 'Textile Accra', 1, 1],
      ['T-Shirt Afro Urban', 't-shirt-afro-urban', 'T-shirt en coton bio avec imprimé afro-urbain exclusif. Coupe unisexe décontractée, idéale au quotidien.', 8500, 6500, 60, 'Camisetas', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop', 'Ativo', JSON.stringify(['Noir', 'Blanc', 'Kaki']), JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']), JSON.stringify(['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop']), 5000, 10, 3500, 50, 175000, 'Print Shop Lagos', 1, 1],
      ['Sac à Main Cuir Tressé', 'sac-a-main-cuir-tresse', 'Sac à main en cuir véritable tressé à la main par des artisans locaux. Design unique inspiré de la vannerie africaine.', 32000, 28000, 12, 'Acessórios', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=750&fit=crop', 'Ativo', JSON.stringify(['Camel', 'Noir', 'Cognac']), JSON.stringify(['Unique']), JSON.stringify(['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=750&fit=crop']), 22000, 2, 18000, 8, 144000, 'Cuir Artisanal Bamako', 1, 1],
      ['Sandales Perles Massaï', 'sandales-perles-massai', 'Sandales artisanales ornées de perles colorées à la main, inspirées de la tradition Massaï. Semelle confortable en caoutchouc naturel.', 14000, 0, 20, 'Sapatos', 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&h=750&fit=crop', 'Ativo', JSON.stringify(['Multicolore', 'Turquoise', 'Rouge/Or']), JSON.stringify(['36', '37', '38', '39', '40', '41']), JSON.stringify(['https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&h=750&fit=crop']), 9000, 3, 6500, 15, 97500, 'Artisan Nairobi', 1, 0],
    ];
    for (const p of products) {
      await pool.query(
        'INSERT INTO products (name, slug, description, price, sale_price, stock, category, image_url, status_geral, colors, sizes, images, wholesale_price, wholesale_min_qty, unit_price, purchase_quantity, total_cost, supplier, is_active, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        p
      );
    }
    console.log('Seeded 7 products.');
  }

  // ── Customers (7 records) ──
  const [customerRows] = await pool.query('SELECT id FROM customers LIMIT 1');
  if (customerRows.length === 0) {
    const customers = [
      ['Aminata Diallo', 'aminata@email.com', '+221 77 123 4567', 'Dakar, Plateau, Rue 10', 'senha123', 'normal'],
      ['Ousmane Traoré', 'ousmane@email.com', '+223 76 234 5678', 'Bamako, ACI 2000', 'senha123', 'normal'],
      ['Fatou Camara', 'fatou@email.com', '+224 62 345 6789', 'Conakry, Kaloum', 'senha123', 'normal'],
      ['Ibrahim Koné', 'ibrahim@email.com', '+225 07 456 7890', 'Abidjan, Cocody', 'senha123', 'wholesaler'],
      ['Aïssatou Ba', 'aissatou@email.com', '+221 78 567 8901', 'Saint-Louis, Quartier Nord', 'senha123', 'normal'],
      ['Moussa Sow', 'moussa@email.com', '+222 46 678 9012', 'Nouakchott, Tevragh Zeina', 'senha123', 'wholesaler'],
      ['Mariam Touré', 'mariam@email.com', '+223 66 789 0123', 'Bamako, Badalabougou', 'senha123', 'normal'],
    ];
    for (const c of customers) {
      await pool.query(
        'INSERT INTO customers (full_name, email, phone, address, password_hash, account_type) VALUES (?, ?, ?, ?, ?, ?)',
        c
      );
    }
    console.log('Seeded 7 customers.');
  }

  // ── Orders (7 records) ──
  const [orderRows] = await pool.query('SELECT id FROM orders LIMIT 1');
  if (orderRows.length === 0) {
    const orders = [
      [1, 'Aminata Diallo', 'aminata@email.com', '+221 77 123 4567', 'Dakar, Plateau, Rue 10', null, 'ORD-20260701-001', 'delivered', 'Mobile Money', 'paid', 18500, 0, 18500, 'Encomenda entregue sem problemas.', JSON.stringify([{product_name:'Robe Wax Ankara',quantity:1,price:18500}])],
      [2, 'Ousmane Traoré', 'ousmane@email.com', '+223 76 234 5678', 'Bamako, ACI 2000', null, 'ORD-20260703-002', 'delivered', 'Transferência', 'paid', 22000, 2000, 20000, '', JSON.stringify([{product_name:'Chemise Bazin Brodée',quantity:1,price:22000}])],
      [3, 'Fatou Camara', 'fatou@email.com', '+224 62 345 6789', 'Conakry, Kaloum', null, 'ORD-20260705-003', 'shipped', 'Mobile Money', 'paid', 41000, 0, 41000, 'Enviar por transportadora rápida.', JSON.stringify([{product_name:'Ensemble Pagne Moderne',quantity:1,price:25000},{product_name:'Pantalon Kente Slim',quantity:1,price:16000}])],
      [4, 'Ibrahim Koné', 'ibrahim@email.com', '+225 07 456 7890', 'Abidjan, Cocody', null, 'ORD-20260708-004', 'confirmed', 'Cartão', 'paid', 42500, 5000, 37500, 'Cliente grossista — desconto aplicado.', JSON.stringify([{product_name:'T-Shirt Afro Urban',quantity:5,price:8500}])],
      [5, 'Aïssatou Ba', 'aissatou@email.com', '+221 78 567 8901', 'Saint-Louis, Quartier Nord', null, 'ORD-20260710-005', 'pending', 'Reserva na Loja', 'pending', 32000, 0, 32000, 'Cliente vai buscar na loja.', JSON.stringify([{product_name:'Sac à Main Cuir Tressé',quantity:1,price:32000}])],
      [6, 'Moussa Sow', 'moussa@email.com', '+222 46 678 9012', 'Nouakchott, Tevragh Zeina', null, 'ORD-20260712-006', 'pending', 'Mobile Money', 'pending', 28000, 0, 28000, '', JSON.stringify([{product_name:'Sandales Perles Massaï',quantity:2,price:14000}])],
      [7, 'Mariam Touré', 'mariam@email.com', '+223 66 789 0123', 'Bamako, Badalabougou', null, 'ORD-20260715-007', 'cancelled', 'Transferência', 'refunded', 25000, 0, 25000, 'Cliente cancelou — reembolso feito.', JSON.stringify([{product_name:'Ensemble Pagne Moderne',quantity:1,price:25000}])],
    ];
    for (const o of orders) {
      await pool.query(
        'INSERT INTO orders (customer_id, customer_name, customer_email, customer_phone, customer_address, transaction_id, order_number, status, payment_method, payment_status, subtotal, discount, total, notes, items) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        o
      );
    }
    console.log('Seeded 7 orders.');
  }

  // ── Promotions (7 records) ──
  const [promoRows] = await pool.query('SELECT id FROM promotions LIMIT 1');
  if (promoRows.length === 0) {
    const promotions = [
      ['Soldes de Bienvenue', 'Profitez de 15% de réduction sur votre première commande. Offre valable sur tout le catalogue.', 15, '2026-07-01', '2026-09-30', 1, JSON.stringify(['Vestidos','Camisetas','Calças']), JSON.stringify([]), 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=400&fit=crop'],
      ['Flash Sale Wax', 'Vente flash exceptionnelle sur tous les articles en tissu wax. Durée limitée!', 25, '2026-07-15', '2026-07-31', 1, JSON.stringify(['Vestidos','Conjuntos']), JSON.stringify([]), 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&h=400&fit=crop'],
      ['Promo Bazin', 'Collection bazin brodé à prix réduit. Qualité premium, prix accessible.', 20, '2026-08-01', '2026-08-31', 1, JSON.stringify(['Camisas']), JSON.stringify([]), 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop'],
      ['Offre Accessoires', 'Accessoires artisanaux à -30%. Sacs, bijoux et sandales perlées.', 30, '2026-07-01', '2026-12-31', 1, JSON.stringify(['Acessórios','Sapatos']), JSON.stringify([]), 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=400&fit=crop'],
      ['Rentrée Scolaire', 'Tenues pour la rentrée scolaire: uniformes, chemises et pantalons à prix réduit.', 10, '2026-09-01', '2026-09-30', 1, JSON.stringify(['Camisetas','Calças']), JSON.stringify([]), 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&h=400&fit=crop'],
      ['Fête du Ramadan', 'Collection spéciale pour les fêtes. Bazin et ensembles de cérémonie à prix festif.', 20, '2026-03-01', '2026-03-31', 0, JSON.stringify(['Camisas','Conjuntos','Vestidos']), JSON.stringify([]), 'https://images.unsplash.com/photo-1495121605193-b116b5b9c5ee?w=1200&h=400&fit=crop'],
      ['Black Friday Afrique', 'Le Black Friday arrive en Afrique! Jusqu\'à 35% de réduction sur une sélection de produits.', 35, '2026-11-25', '2026-11-30', 0, JSON.stringify(['Vestidos','Camisetas','Calças','Acessórios','Sapatos']), JSON.stringify([]), 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&h=400&fit=crop'],
    ];
    for (const p of promotions) {
      await pool.query(
        'INSERT INTO promotions (name, description, discount_percent, start_date, end_date, is_active, applicable_categories, selected_products, banner_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        p
      );
    }
    console.log('Seeded 7 promotions.');
  }

  // ── News (7 records) ──
  const [newsRows] = await pool.query('SELECT id FROM news LIMIT 1');
  if (newsRows.length === 0) {
    const newsItems = [
      ['Nova Coleção Wax Verão 2026', 'Estamos entusiasmados em apresentar a nossa nova coleção de verão em tecido wax autêntico! Peças vibrantes e coloridas que celebram a riqueza cultural africana. Cada peça é cortada e cosida à mão nos nossos ateliers parceiros em Dakar e Abidjan. Tecidos importados do Gana e da Costa do Marfim, com estampas exclusivas desenhadas por artistas locais. Visite a nossa loja e descubra a coleção completa.', 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800&h=400&fit=crop', 1],
      ['Parceria com Artesãos do Senegal', 'A Ada Fashion tem orgulho em anunciar uma nova parceria com cooperativas de artesãos de Saint-Louis e Thiès. Juntos, vamos desenvolver uma linha exclusiva de acessórios artesanais — incluindo bolsas em couro tressé, sandálias com pérolas e bijutaria em prata e bronze. Esta parceria apoia directamente 45 famílias de artesãos.', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=400&fit=crop', 1],
      ['Ada Fashion no FIMA 2026', 'A nossa marca foi convidada a participar no Festival International de la Mode en Afrique (FIMA) 2026 em Niamey, Níger. Vamos apresentar 12 looks exclusivos que misturam tradição e modernidade. Sigam-nos nas redes sociais para acompanhar o evento em direto!', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=400&fit=crop', 1],
      ['Guia de Estilo: Como Usar Bazin no Dia a Dia', 'O bazin não é só para festas! Neste guia, mostramos como incorporar peças em bazin brodé no seu guarda-roupa do dia a dia. Dicas de combinação, acessórios complementares e inspirações de street style de Lagos, Abidjan e Dakar. Do escritório ao fim de semana, o bazin pode ser versátil e moderno.', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&h=400&fit=crop', 1],
      ['Lançamento: Linha Eco-Responsável', 'Temos o prazer de lançar a nossa primeira linha eco-responsável! Peças produzidas com algodão biológico certificado e tingimentos naturais à base de plantas. A sustentabilidade encontra o estilo africano — sem comprometer a qualidade nem a estética. Disponível a partir de Agosto 2026.', 'https://images.unsplash.com/photo-1617627143233-46f5be2fdce0?w=800&h=400&fit=crop', 1],
      ['Expansão: Nova Loja em Abidjan', 'Após o sucesso da nossa loja em Dakar, estamos a expandir para Abidjan, Costa do Marfim! A nova loja, localizada no quartier Cocody, abrirá as portas em Setembro 2026. Um espaço de 150m² com showroom, espaço de personalização e corner VIP para clientes grossistas.', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop', 1],
      ['Programa de Fidelidade Ada Rewards', 'Lançamos o programa Ada Rewards! A cada compra, acumule pontos que podem ser trocados por descontos, brindes exclusivos e acesso antecipado às novas coleções. Cadastre-se gratuitamente na nossa loja ou pelo site e comece a acumular pontos hoje mesmo.', 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&h=400&fit=crop', 1],
    ];
    for (const n of newsItems) {
      await pool.query(
        'INSERT INTO news (title, content, image, is_published) VALUES (?, ?, ?, ?)',
        n
      );
    }
    console.log('Seeded 7 news.');
  }

  // ── Videos (7 records) ──
  const [videoRows] = await pool.query('SELECT id FROM videos LIMIT 1');
  if (videoRows.length === 0) {
    const videoItems = [
      ['Lookbook Verão 2026 — Ada Fashion', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1],
      ['Behind the Scenes: Coleção Wax', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1],
      ['Desfile FIMA 2026 Highlights', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1],
      ['Tutorial: Amarrar Pagne em 5 Estilos', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1],
      ['Entrevista com a Fundadora Ada Fashion', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1],
      ['Street Style Dakar Fashion Week', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1],
      ['Processo Artesanal: Do Tecido à Peça Final', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1],
    ];
    for (const v of videoItems) {
      await pool.query(
        'INSERT INTO videos (title, url, is_published) VALUES (?, ?, ?)',
        v
      );
    }
    console.log('Seeded 7 videos.');
  }

  // ── Carousel Photos (7 records) ──
  const [carouselRows] = await pool.query('SELECT id FROM carousel_photos LIMIT 1');
  if (carouselRows.length === 0) {
    const carouselItems = [
      ['Nova Coleção Wax', 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=1200&h=600&fit=crop', 'Descubra peças únicas em tecido wax africano autêntico.'],
      ['Bazin Brodé Premium', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200&h=600&fit=crop', 'Elegância e tradição em cada bordado feito à mão.'],
      ['Acessórios Artesanais', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1200&h=600&fit=crop', 'Bolsas, sandálias e bijutaria criadas por artesãos locais.'],
      ['Street Style Africano', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&h=600&fit=crop', 'A moda urbana africana que conquista o mundo.'],
      ['Moda Sustentável', 'https://images.unsplash.com/photo-1617627143233-46f5be2fdce0?w=1200&h=600&fit=crop', 'Linha eco-responsável com algodão biológico e tintas naturais.'],
      ['Soldes de Temporada', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=600&fit=crop', 'Promoções imperdíveis em peças selecionadas.'],
      ['Zona di Bideras', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop', 'Espaço exclusivo para revendedoras e grossistas.'],
    ];
    for (const c of carouselItems) {
      await pool.query(
        'INSERT INTO carousel_photos (title, image_url, description) VALUES (?, ?, ?)',
        c
      );
    }
    console.log('Seeded 7 carousel photos.');
  }

  // ── Reservations (7 records) ──
  const [reservRows] = await pool.query('SELECT id FROM reservations LIMIT 1');
  if (reservRows.length === 0) {
    const reservations = [
      ['Aminata Diallo', '+221 77 123 4567', 'aminata@email.com', '2026-07-20', 'Reservar 2 Robes Wax tamanho M', 'confirmed'],
      ['Ousmane Traoré', '+223 76 234 5678', 'ousmane@email.com', '2026-07-22', 'Chemise Bazin brodée taille XL, couleur Or', 'confirmed'],
      ['Fatou Camara', '+224 62 345 6789', 'fatou@email.com', '2026-07-25', 'Ensemble Pagne Moderne — precisa experimentar', 'pending'],
      ['Ibrahim Koné', '+225 07 456 7890', 'ibrahim@email.com', '2026-07-28', 'Encomenda grossista 20 T-shirts Afro Urban', 'confirmed'],
      ['Aïssatou Ba', '+221 78 567 8901', 'aissatou@email.com', '2026-08-01', 'Sac à Main Cuir Tressé couleur Camel', 'pending'],
      ['Moussa Sow', '+222 46 678 9012', 'moussa@email.com', '2026-08-05', 'Sandales Perles Massaï pointure 42', 'pending'],
      ['Mariam Touré', '+223 66 789 0123', 'mariam@email.com', '2026-08-10', 'Consulta personalização Robe para casamento', 'cancelled'],
    ];
    for (const r of reservations) {
      await pool.query(
        'INSERT INTO reservations (customer_name, customer_phone, customer_email, reservation_date, notes, status) VALUES (?, ?, ?, ?, ?, ?)',
        r
      );
    }
    console.log('Seeded 7 reservations.');
  }

  // ── Store Settings ──
  const [settingsRows] = await pool.query('SELECT id FROM store_settings LIMIT 1');
  if (settingsRows.length === 0) {
    await pool.query('INSERT INTO store_settings (store_name, language, currency) VALUES (?, ?, ?)', ['Ada Fashion', 'pt-BR', 'XOF']);
    console.log('Seeded store settings.');
  }

  // ── Activity log ──
  const [logsRows] = await pool.query('SELECT id FROM activity_logs LIMIT 1');
  if (logsRows.length === 0) {
    await pool.query('INSERT INTO activity_logs (action, details, user_name, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)', ['Seed de Dados', 'Dados iniciais carregados no banco de dados MySQL — 7 registos por tabela.', 'Sistema', 'system', '']);
    console.log('Seeded activity log.');
  }
};

const PORT = process.env.PORT || 4000;

let initializationPromise = null;

const initializeApp = async () => {
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    try {
      await ensureSchema();
      await seedDefaultData();
    } catch (error) {
      console.error('Failed to initialize app data', error);
    }
  })();

  return initializationPromise;
};

app.use(async (req, res, next) => {
  if (!req.path.startsWith('/api')) {
    return next();
  }

  try {
    await initializeApp();
    next();
  } catch (error) {
    next(error);
  }
});

// Serve frontend static files in production
const path = require('path');
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-all route to serve the React app for any other request
const fs = require('fs');
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send(`
      <h1>Erro: Frontend não foi construído</h1>
      <p>O arquivo <code>dist/index.html</code> não foi encontrado.</p>
      <p>Por favor, certifique-se de que o <b>Build Command</b> no Render está configurado como: <code>npm install && npm run build</code></p>
    `);
  }
});

const startServer = async () => {
  try {
    await initializeApp();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = serverless(app);
