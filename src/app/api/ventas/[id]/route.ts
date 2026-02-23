import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(ctx.params); // ✅ params puede ser Promise
    const ventaId = Number(id);

    if (!Number.isFinite(ventaId) || ventaId <= 0) {
      return NextResponse.json({ ok: false, message: "ID inválido" }, { status: 400 });
    }

    // ✅ cookies() puede ser Promise en Next 16.1 + Turbopack
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ ok: false, message: "No autorizado" }, { status: 401 });
    }

    // 1) venta
    const ventaRes = await query(
      `SELECT * FROM lead_efectivos WHERE id = $1 LIMIT 1`,
      [ventaId]
    );
    const venta = ventaRes.rows?.[0];

    if (!venta) {
      return NextResponse.json({ ok: false, message: "Venta no encontrada" }, { status: 404 });
    }

    const leadId = Number(venta.lead_id);
    if (!Number.isFinite(leadId) || leadId <= 0) {
      return NextResponse.json({ ok: true, venta, lead: null, notes: [] }, { status: 200 });
    }

    // 2) lead
    const leadRes = await query(`SELECT * FROM leads WHERE id = $1 LIMIT 1`, [leadId]);
    const lead = leadRes.rows?.[0] ?? null;

    // 3) notes
    const notesRes = await query(
      `SELECT * FROM notes WHERE lead_id = $1 ORDER BY creado_en DESC`,
      [leadId]
    );

    return NextResponse.json({
      ok: true,
      venta,
      lead,
      notes: notesRes.rows ?? [],
    });
  } catch (e) {
    console.error("GET /api/ventas/[id] error:", e);
    return NextResponse.json({ ok: false, message: "Error interno" }, { status: 500 });
  }
}