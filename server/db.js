const { Pool } = require('pg');

const connectionString = process.env.https://sfokmydhycjjiexmbijd.supabase.co || process.env.postgresql://postgres.sfokmydhycjjiexmbijd:Nademe100%@@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true;

const createSupabasePool = () => {
  if (!connectionString) {
    console.warn('⚠️ WARNING: DATABASE_URL is not set. Database connection pool will be null.');
    // We can still return a dummy object or null, but let's throw an error if query is called
    return {
      query: () => { throw new Error('Database not configured. Please set DATABASE_URL.'); }
    };
  }
  const pgPool = new Pool({
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

  const queryWrapper = async (text, params = []) => {
    try {
      const normalizedText = translateQuery(text, params);
      const queryText = shouldAppendReturningId(normalizedText)
        ? `${normalizedText} RETURNING id`
        : normalizedText;

      const result = await pgPool.query(queryText, params);

      if (shouldReturnRows(text)) {
        return [result.rows || []];
      }

      return [{
        insertId: result.rows?.[0]?.id ?? null,
        affectedRows: result.rowCount ?? 0,
        rowCount: result.rowCount ?? 0,
        rows: result.rows || [],
      }];
    } catch (error) {
      console.error(`Supabase query error: ${error.message}`, { text, params });
      throw error;
    }
  };

  pgPool.query = queryWrapper;
  return pgPool;
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
