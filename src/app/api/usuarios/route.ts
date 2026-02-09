import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        nombre,
        correo,
        rol,
        estado_laboral,
        motivo_salida,
        motivo_reingreso,
        fecha_reingreso
      FROM users
      ORDER BY id DESC
    `);

    return NextResponse.json({
      meta: { total: result.rowCount },
      rows: result.rows,
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}
