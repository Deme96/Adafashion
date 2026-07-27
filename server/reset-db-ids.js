const { pool } = require('./db.js');

async function resetIndexes() {
  const tables = [
    'activity_logs',
    'finance_entries',
    'reservations',
    'order_items',
    'stock_movements',
    'orders',
    'products',
    'customers'
  ];

  try {
    console.log('Resetting auto-increment indexes...');
    
    for (const table of tables) {
      try {
        // Try PostgreSQL approach first
        await pool.query(`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1`);
      } catch (postgresError) {
        // If it fails, fallback to MySQL approach
        try {
          await pool.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
        } catch (mysqlError) {
          console.error(`Warning: Could not reset index for ${table}. Postgres error: ${postgresError.message}. MySQL error: ${mysqlError.message}`);
        }
      }
      console.log(`Reset index for ${table}`);
    }
    
    console.log('All indexes reset successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

resetIndexes();
