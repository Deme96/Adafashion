const mysql = require('mysql2/promise');

// Infinity Free Database Configuration
// Substitua os valores abaixo pelos dados fornecidos no painel do Infinity Free (MySQL Databases)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'sql200.infinityfree.com', // Ex: sql123.epizy.com
  user: process.env.DB_USER || 'if0_42433124', // Seu MySQL User
  password: process.env.DB_PASSWORD || 'Nademe1001920', // MySQL Password
  database: process.env.DB_NAME || 'if0_42433124_adafashion', // MySQL DB Name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Infinity Free Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Infinity Free Database connection failed:', error.message);
  }
};

testConnection();

module.exports = { pool };
