const { pool } = require('./db.js');

async function clearDatabase() {
  try {
    console.log('Clearing database...');
    
    // Delete tables in order of dependencies (child tables first)
    await pool.query('DELETE FROM activity_logs');
    console.log('Cleared activity_logs');
    
    await pool.query('DELETE FROM finance_entries');
    console.log('Cleared finance_entries');
    
    await pool.query('DELETE FROM reservations');
    console.log('Cleared reservations');
    
    await pool.query('DELETE FROM order_items');
    console.log('Cleared order_items');
    
    await pool.query('DELETE FROM stock_movements');
    console.log('Cleared stock_movements');
    
    await pool.query('DELETE FROM orders');
    console.log('Cleared orders');
    
    await pool.query('DELETE FROM products');
    console.log('Cleared products');
    
    await pool.query('DELETE FROM customers');
    console.log('Cleared customers');
    
    // Keep only Admin users
    await pool.query("DELETE FROM users WHERE role != 'Admin'");
    console.log('Cleared non-admin users');

    console.log('Database cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
