import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const res = await pool.query(`
      SELECT id, nombre, foto_asesor
      FROM users
      ORDER BY nombre
    `);

    return NextResponse.json(res.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error obteniendo usuarios" },
      { status: 500 }
    );
  }
}
