// src/app/api/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// POST: Agregar nota a un lead
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Token faltante" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const data = await req.json();
    const { lead_id, tipo_gestion, comentario } = data;

    if (!lead_id || !tipo_gestion)
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });

    if (user.rol !== "asesor") {
      return NextResponse.json({ error: "Solo asesores pueden registrar notas" }, { status: 403 });
    }

    const result = await query(
      `INSERT INTO notes (lead_id, autor_id, tipo_gestion, comentario, creado_en) 
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [lead_id, user.id, tipo_gestion, comentario || null]
    );

    return NextResponse.json({ ok: true, note: result.rows[0] });
  } catch (error: any) {
    console.error("Error en POST /api/notes:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}
