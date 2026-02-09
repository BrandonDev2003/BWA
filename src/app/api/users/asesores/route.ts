// src/app/api/users/asesores/route.ts

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        nombre, 
        correo, 
        cedula, 
        rol, 
        foto_asesor,
        estado_laboral
      FROM users
      WHERE rol = 'asesor'
        AND estado_laboral = 'ACTIVO'
      ORDER BY nombre ASC
    `);

    return NextResponse.json({
      ok: true,
      users: result.rows,
    });
  } catch (err) {
    console.error("Error al obtener asesores:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno al obtener asesores" },
      { status: 500 }
    );
  }
}
