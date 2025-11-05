// src/app/api/leads/assigns/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Obtener IDs desde el body
    const { leadIds, asesorId } = await req.json();
    if (!leadIds || !asesorId) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

    // Verificar que el asesor exista
    const asesorRes = await query("SELECT id, nombre FROM users WHERE id = $1", [asesorId]);
    if (asesorRes.rows.length === 0)
      return NextResponse.json({ error: "Asesor no encontrado" }, { status: 404 });

    // Actualizar solo la columna asignado_a en leads
    await query(
      "UPDATE leads SET asignado_a = $1 WHERE id = ANY($2::int[])",
      [asesorId, leadIds]
    );

    return NextResponse.json({ ok: true, leadIds, asignado_a: asesorId });
  } catch (err) {
    console.error("Error al asignar asesor:", err);
    return NextResponse.json({ error: "Error al asignar asesor" }, { status: 500 });
  }
}
