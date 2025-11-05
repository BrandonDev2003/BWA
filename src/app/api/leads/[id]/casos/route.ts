import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const leadId = Number(context.params.id);
    if (!leadId) {
      return NextResponse.json({ error: "Lead ID requerido" }, { status: 400 });
    }

    const notes = await query("SELECT * FROM notes WHERE lead_id = ?", [leadId]);
    return NextResponse.json(notes);
  } catch (err) {
    console.error("Error al obtener notas:", err);
    return NextResponse.json({ error: "Error al obtener notas" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const leadId = Number(context.params.id);
    if (!leadId) {
      return NextResponse.json({ error: "Lead ID requerido" }, { status: 400 });
    }

    const body = await req.json();
    const { contenido } = body;

    if (!contenido) {
      return NextResponse.json({ error: "Contenido requerido" }, { status: 400 });
    }

    await query(
      "INSERT INTO notes (lead_id, contenido, autor_id, fecha_hora) VALUES (?, ?, ?, NOW())",
      [leadId, contenido, user.id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error al guardar nota:", err);
    return NextResponse.json({ error: "Error al guardar nota" }, { status: 500 });
  }
}
