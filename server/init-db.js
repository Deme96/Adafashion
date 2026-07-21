const dbModule = require('./db');

const { pool } = dbModule;

const ADMIN_EMAIL = 'admin@adafashion.com';
const ADMIN_PASSWORD = 'admin123';

const seedAdminUser = async () => {
  const [rows] = await pool.query('SELECT id FROM users WHERE LOWER(TRIM(email)) = ?', [ADMIN_EMAIL]);

  if (rows.length > 0) {
    await pool.query('UPDATE users SET full_name = ?, password_hash = ?, role = ?, status = ? WHERE LOWER(TRIM(email)) = ?', [
      'Administrador AdaFashion',
      ADMIN_PASSWORD,
      'Admin',
      'active',
      ADMIN_EMAIL,
    ]);
    console.log('Admin user updated in database.');
    return;
  }

  await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
    ['Administrador AdaFashion', ADMIN_EMAIL, ADMIN_PASSWORD, 'Admin', 'active']
  );

  console.log('Admin user created in database.');
};

seedAdminUser()
  .then(() => {
    console.log('Seed completed.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to seed admin user', err);
    process.exit(1);
  });
