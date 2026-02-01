import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

function jsonError(message: string, status = 400, detail?: any) {
  return NextResponse.json({ ok: false, message, detail }, { status });
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // ✅ params async
) {
  const user = await getSessionUser(req);
  if (!user) return jsonError("Unauthorized", 401);

  const rol = String(user.rol || "").toLowerCase();
  const canEdit = rol === "admin" || rol === "spa";
  if (!canEdit) return jsonError("Forbidden", 403);

  // ✅ await params
  const { id } = await ctx.params;
  const ventaId = Number(id);
  if (!Number.isFinite(ventaId)) return jsonError("ID inválido.", 400);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON inválido.", 400);
  }

  const estado = String(body?.estado_revision ?? "").toLowerCase().trim();
  if (!["pendiente", "aprobada", "rechazada"].includes(estado)) {
    return jsonError("estado_revision inválido (pendiente/aprobada/rechazada).", 400);
  }

  const client = await pool.connect();
  try {
    const r = await client.query(
      `
      UPDATE lead_efectivos
      SET estado_revision = $1
      WHERE id = $2
      RETURNING id, estado_revision
      `,
      [estado, ventaId]
    );

    if (r.rowCount === 0) return jsonError("Venta no encontrada.", 404);

    return NextResponse.json({ ok: true, venta: r.rows[0] });
  } catch (e: any) {
    console.error("PUT /api/lead-efectivos/[id] error:", e);
    return jsonError("Error actualizando estado.", 500, String(e?.message ?? e));
  } finally {
    client.release();
  }
}
