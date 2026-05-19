import { Pool, QueryResult } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function query(text: string, params?: any[]): Promise<QueryResult> {
  return pool.query(text, params);
}