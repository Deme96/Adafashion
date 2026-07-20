const { Pool } = require('pg');

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

const createSupabasePool = () => {
  if (!connectionString) {
    return null;
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
  });

  const translateQuery = (text, params = []) => {
    if (!Array.isArray(params) || params.length === 0) {
      return text;
    }

    let position = 0;
    return text.replace(/\?/g, () => {
      position += 1;
      return `$${position}`;
    });
  };

  const shouldReturnRows = (text) => /^\s*(SELECT|WITH)\b/i.test(text);

  const shouldAppendReturningId = (text) => /^\s*INSERT\b/i.test(text) && !/\bRETURNING\b/i.test(text);

  pool.query = async (text, params = []) => {
    const normalizedText = translateQuery(text, params);
    const queryText = shouldAppendReturningId(normalizedText)
      ? `${normalizedText} RETURNING id`
      : normalizedText;

    const client = await pool.connect();
    try {
      const result = await client.query(queryText, params);

      if (shouldReturnRows(text)) {
        return [result.rows];
      }

      return [{
        insertId: result.rows?.[0]?.id ?? null,
        affectedRows: result.rowCount ?? 0,
        rowCount: result.rowCount ?? 0,
        rows: result.rows || [],
        ...result,
      }];
    } finally {
      client.release();
    }
  };

  return pool;
};

const pool = createSupabasePool();

const testConnection = async () => {
  if (!pool) return false;
  const [rows] = await pool.query('SELECT 1 AS ok');
  return Array.isArray(rows) && rows.length > 0;
};

module.exports = {
  pool,
  testConnection,
  ADMIN_CREDENTIALS: {
    email: process.env.ADMIN_EMAIL || 'admin@adafashion.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    fullName: process.env.ADMIN_FULL_NAME || 'Administrador AdaFashion',
  },
};
