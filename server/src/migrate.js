import 'dotenv/config'; import { readFile } from 'node:fs/promises'; import { pool } from './db.js';
try { const sql=await readFile(new URL('../sql/schema.sql',import.meta.url),'utf8'); await pool.query(sql); console.log('Database schema installed.'); } finally { await pool.end(); }
