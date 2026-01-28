import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { leadIds, asesorId } = await req.json();
    if (!leadIds || !asesorId) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

    const asesorRes = await query(
      "SELECT id, nombre_completo FROM users WHERE id = $1",
      [asesorId]
    );

    if (asesorRes.rows.length === 0)
      return NextResponse.json({ error: "Asesor no encontrado" }, { status: 404 });

    const asesor = asesorRes.rows[0];

    await query(
      "UPDATE leads SET asignado_a = $1, nombre_asesor = $2 WHERE id = ANY($3::int[])",
      [asesor.id, asesor.nombre_completo, leadIds]
    );

    return NextResponse.json({ ok: true, asesor, leadIds });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al asignar asesor" }, { status: 500 });
  }
}
