import dotenv from 'dotenv';
dotenv.config();
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import pg from 'pg';

let sqliteInstance; let pgPool;

export async function getDb() {
  const url = process.env.DATABASE_URL;
  if (url && url.startsWith('postgres://')) {
    if (!pgPool) {
      pgPool = new pg.Pool({ connectionString: url });
    }
    // Wrap pg in minimal sqlite-like API used by rest of code
    return {
      all: async (sql, params=[]) => (await pgPool.query(sql, params)).rows,
      get: async (sql, params=[]) => (await pgPool.query(sql, params)).rows[0],
      run: async (sql, params=[]) => (await pgPool.query(sql + ' RETURNING id', params)).rows[0],
      exec: async (sql) => { await pgPool.query(sql); },
      close: async () => pgPool.end()
    };
  }
  if (!sqliteInstance) {
    sqliteInstance = await open({ filename: 'metrics.db', driver: sqlite3.Database });
  }
  return sqliteInstance;
}
