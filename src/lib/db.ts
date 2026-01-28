import { Pool, QueryResult, QueryResultRow } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const res = await pool.query<T>(text, params);
  return res;
}
export default pool;
