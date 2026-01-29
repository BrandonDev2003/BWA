import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

/* ===========================================================
   GET → Obtener todas las notas de un lead
   =========================================================== */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("token")?.value || "";
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const leadId = Number(id);
    if (!leadId || Number.isNaN(leadId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const notes = await query(
      `SELECT 
         n.id,
         n.lead_id,
         n.contenido,
         n.autor_id,
         u.nombre AS autor_nombre,
         n.fecha_hora
       FROM notes n
       LEFT JOIN usuarios u ON u.id = n.autor_id
       WHERE n.lead_id = $1
       ORDER BY n.fecha_hora DESC`,
      [leadId]
    );

    return NextResponse.json(notes.rows);
  } catch (err) {
    console.error("Error al obtener notas:", err);
    return NextResponse.json(
      { error: "Error al obtener notas" },
      { status: 500 }
    );
  }
}

/* ===========================================================
   POST → Crear una nueva nota
   =========================================================== */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("token")?.value || "";
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const leadId = Number(id);
    if (!leadId || Number.isNaN(leadId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const contenido: string = body?.contenido;

    if (!contenido || contenido.trim().length === 0) {
      return NextResponse.json(
        { error: "El contenido de la nota es obligatorio" },
        { status: 400 }
      );
    }

    await query(
      `INSERT INTO notes (lead_id, contenido, autor_id, fecha_hora)
       VALUES ($1, $2, $3, NOW())`,
      [leadId, contenido.trim(), user.id]
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Error al guardar nota:", err);
    return NextResponse.json(
      { error: "Error al guardar nota" },
      { status: 500 }
    );
  }
}
