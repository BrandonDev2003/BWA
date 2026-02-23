import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(ctx.params); // ✅ params Promise
    const ventaId = Number(id);

    if (!Number.isFinite(ventaId) || ventaId <= 0) {
      return NextResponse.json({ ok: false, message: "ID inválido" }, { status: 400 });
    }

    const cookieStore = await cookies(); // ✅ cookies Promise
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ ok: false, message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const contenido = String(body?.contenido ?? "").trim();

    if (!contenido) {
      return NextResponse.json(
        { ok: false, message: "El contenido de la nota es requerido." },
        { status: 400 }
      );
    }

    // Obtener lead_id desde la venta
    const ventaRes = await query(
      `SELECT id, lead_id FROM lead_efectivos WHERE id = $1 LIMIT 1`,
      [ventaId]
    );
    const venta = ventaRes.rows?.[0];

    if (!venta) {
      return NextResponse.json({ ok: false, message: "Venta no encontrada" }, { status: 404 });
    }

    const leadId = Number(venta.lead_id);
    if (!Number.isFinite(leadId) || leadId <= 0) {
      return NextResponse.json(
        { ok: false, message: "La venta no tiene lead_id válido." },
        { status: 400 }
      );
    }

    const ins = await query(
      `
      INSERT INTO notes (lead_id, contenido, fecha_hora, creado_en)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
      `,
      [leadId, contenido]
    );

    return NextResponse.json({ ok: true, note: ins.rows?.[0] ?? null }, { status: 201 });
  } catch (e) {
    console.error("POST /api/ventas/[id]/notes error:", e);
    return NextResponse.json({ ok: false, message: "Error interno" }, { status: 500 });
  }
}