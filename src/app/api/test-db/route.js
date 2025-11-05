import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema='public'
    `);
    return NextResponse.json({ tablas: result.rows });
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}
