import { Pool, QueryResult, QueryResultRow } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  console.log("Ejecutando query:", text, "con params:", params);
  const res = await pool.query<T>(text, params);
  return res;
}
