import pg from 'pg';
const { Pool } = pg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false, max: 15, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 });
