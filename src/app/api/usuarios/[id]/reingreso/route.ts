import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await ctx.params; // ✅ IMPORTANTe
    const id = Number(idStr);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const motivo_reingreso = (body?.motivo_reingreso ?? "").toString().trim();

    if (motivo_reingreso.length < 3) {
      return NextResponse.json({ error: "Motivo demasiado corto" }, { status: 400 });
    }

    const query = `
      UPDATE users
      SET estado_laboral = 'ACTIVO',
          motivo_reingreso = $1,
          fecha_reingreso = NOW(),
          -- opcional: limpiar salida
          motivo_salida = NULL,
          fecha_salida = NULL
      WHERE id = $2
      RETURNING id, estado_laboral, motivo_reingreso, fecha_reingreso;
    `;

    const result = await pool.query(query, [motivo_reingreso, id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    console.error("PATCH /api/usuarios/[id]/reingreso error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
