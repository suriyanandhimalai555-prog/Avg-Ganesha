import pg from 'pg';
import dotenv from 'dotenv';
import { URL } from 'url';

dotenv.config();

const { Pool } = pg;

const getDbConfig = () => {
  // Option 1: Use DATABASE_URL
  if (process.env.DATABASE_URL) {
    try {
      const params = new URL(process.env.DATABASE_URL);
      return {
        user: params.username,
        password: params.password,
        host: params.hostname,
        port: params.port,
        database: params.pathname.split('/')[1],
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: parseInt(process.env.DB_POOL_MAX) || 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      };
    } catch (e) {
      console.error('Failed to parse DATABASE_URL:', e.message);
    }
  }

  // Option 2: Use individual env vars
  if (process.env.DB_HOST) {
    return {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  return null;
};

const dbConfig = getDbConfig();

let pool;

if (!dbConfig) {
  console.warn('⚠️  No database configuration found. Set DATABASE_URL or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD in .env');
  // Stub pool that throws informative errors without crashing startup
  pool = {
    query: () => Promise.reject(new Error('Database not configured. Check your .env file.')),
    connect: () => Promise.reject(new Error('Database not configured. Check your .env file.')),
    on: () => {},
  };
} else {
  pool = new Pool(dbConfig);

  // Prevent crashes on unexpected disconnects
  pool.on('error', (err) => {
    console.error('⚠️  DB connection error (silenced):', err.message);
  });

  // Test connection on startup
  pool.query('SELECT NOW()')
    .then((res) => console.log(`✅ DB Connected! Time: ${res.rows[0].now}`))
    .catch(err => {
      console.error('❌ DB Connection Failed:', err.message);
      console.error('   Tip: Check DATABASE_URL or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD env vars.');
    });
}

export { pool };
export const query = (text, params) => pool.query(text, params);