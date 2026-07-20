const mysql = require('mysql2/promise');

// Database Configuration - Local + Infinity Free Support
// Carrega automaticamente baseado nas variáveis de ambiente
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'adafashion',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  connectTimeout: 10000,
  // Permite conexões de dispositivos externos
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
});

// Credenciais de Admin - Acessíveis para dispositivos externos
const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || 'admin@adafashion.com',
  password: process.env.ADMIN_PASSWORD || 'admin123',
  fullName: process.env.ADMIN_FULL_NAME || 'Administrador AdaFashion',
};

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    console.log(`📊 Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`🔐 Database: ${process.env.DB_NAME || 'adafashion'}`);
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
};

testConnection();

module.exports = { pool, ADMIN_CREDENTIALS };
