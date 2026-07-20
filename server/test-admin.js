#!/usr/bin/env node

/**
 * Admin Authentication Debug Script
 * Use this to test and fix admin login issues
 */

const useSupabase = Boolean(process.env.SUPABASE_DB_URL || process.env.DATABASE_URL);

const dbModule = useSupabase
  ? require('./db-supabase')
  : (process.env.VERCEL || process.env.NODE_ENV === 'production'
    ? require('./db-infinity')
    : require('./db'));

const { pool, ADMIN_CREDENTIALS } = dbModule;

const ADMIN_EMAIL = ADMIN_CREDENTIALS?.email || process.env.ADMIN_EMAIL || 'admin@adafashion.com';
const ADMIN_PASSWORD = ADMIN_CREDENTIALS?.password || process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_FULL_NAME = ADMIN_CREDENTIALS?.fullName || process.env.ADMIN_FULL_NAME || 'Administrador AdaFashion';

const log = (title, message) => {
  console.log(`\n[${title}] ${message}`);
};

const logError = (title, error) => {
  console.error(`\n[${title}] ERROR:`, error.message || error);
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const testAndFixAdmin = async () => {
  log('START', `Testing admin authentication with email: ${ADMIN_EMAIL}`);

  if (!pool) {
    logError('POOL', 'Database pool is null - check your connection configuration');
    process.exit(1);
  }

  try {
    log('STEP 1', 'Testing database connection...');
    await pool.query('SELECT 1 AS ok');
    log('SUCCESS', 'Database connection OK');
  } catch (error) {
    logError('CONNECTION', error);
    process.exit(1);
  }

  try {
    log('STEP 2', 'Checking if users table exists...');
    const [tableCheck] = await pool.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'users'`
    );
    if (!tableCheck || tableCheck.length === 0) {
      log('INFO', 'Users table does not exist - will be created on server startup');
    } else {
      log('SUCCESS', 'Users table exists');
    }
  } catch (error) {
    log('INFO', 'Could not check table (expected on first run): ' + error.message);
  }

  try {
    log('STEP 3', `Checking if admin user exists (${ADMIN_EMAIL})...`);
    const [adminRows] = await pool.query('SELECT id, full_name, email, role FROM users WHERE LOWER(TRIM(email)) = ?', [normalizeEmail(ADMIN_EMAIL)]);

    if (adminRows && adminRows.length > 0) {
      const admin = adminRows[0];
      log('SUCCESS', `Admin user found: ${admin.full_name} (ID: ${admin.id})`);
      log('INFO', `Current role: ${admin.role}`);
    } else {
      log('INFO', 'Admin user does not exist yet');
    }
  } catch (error) {
    log('INFO', 'Could not query users (expected if table not created): ' + error.message);
  }

  try {
    log('STEP 4', 'Creating or updating admin user...');
    const [existingAdmin] = await pool.query('SELECT id FROM users WHERE LOWER(TRIM(email)) = ?', [normalizeEmail(ADMIN_EMAIL)]);

    if (existingAdmin && existingAdmin.length > 0) {
      await pool.query(
        'UPDATE users SET password_hash = ?, role = ?, status = ? WHERE LOWER(TRIM(email)) = ?',
        [ADMIN_PASSWORD, 'Admin', 'active', normalizeEmail(ADMIN_EMAIL)]
      );
      log('SUCCESS', 'Admin credentials updated');
    } else {
      await pool.query(
        'INSERT INTO users (full_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
        [ADMIN_FULL_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, 'Admin', 'active']
      );
      log('SUCCESS', 'Admin user created');
    }
  } catch (error) {
    logError('CREATE_ADMIN', error);
  }

  try {
    log('STEP 5', 'Verifying admin login credentials...');
    const [loginCheck] = await pool.query('SELECT id, full_name AS name, email, role, password_hash FROM users WHERE LOWER(TRIM(email)) = ?', [normalizeEmail(ADMIN_EMAIL)]);

    if (!loginCheck || loginCheck.length === 0) {
      logError('LOGIN_CHECK', 'Admin user not found after creation');
      process.exit(1);
    }

    const user = loginCheck[0];
    const passwordMatch = String(user.password_hash || '').trim() === String(ADMIN_PASSWORD || '').trim();

    if (passwordMatch) {
      log('SUCCESS', `Admin login verified - Password matches!`);
      log('INFO', `Admin: ${user.name} (${user.email}) - Role: ${user.role}`);
    } else {
      logError('PASSWORD_MISMATCH', `Stored: "${user.password_hash}" vs Configured: "${ADMIN_PASSWORD}"`);
    }
  } catch (error) {
    logError('LOGIN_CHECK', error);
  }

  log('COMPLETE', 'Admin authentication check complete');
  log('INFO', `\nTo login, use:\n  Email: ${ADMIN_EMAIL}\n  Password: ${ADMIN_PASSWORD}`);

  process.exit(0);
};

testAndFixAdmin().catch((err) => {
  logError('FATAL', err);
  process.exit(1);
});
