// src/app/api/users/asesores/route.ts

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// 👉 AQUÍ NO EXISTE params porque "asesores" NO es un ID
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT id, nombre, correo, cedula, rol, foto_asesor
      FROM users
      WHERE rol = 'asesor'
      ORDER BY nombre ASC
    `);

    return NextResponse.json({
      ok: true,
      users: result.rows
    });
  } catch (err) {
    console.error("Error al obtener asesores:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno al obtener asesores" },
      { status: 500 }
    );
  }
}
