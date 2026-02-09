import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

type EstadoSalida = "DESVINCULADO" | "RENUNCIA";

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
    const estado_laboral = body?.estado_laboral as EstadoSalida;
    const motivo_salida = (body?.motivo_salida ?? "").toString().trim();

    if (!["DESVINCULADO", "RENUNCIA"].includes(estado_laboral)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    if (motivo_salida.length < 3) {
      return NextResponse.json({ error: "Motivo demasiado corto" }, { status: 400 });
    }

    const query = `
      UPDATE users
      SET estado_laboral = $1,
          motivo_salida = $2,
          fecha_salida = NOW()
      WHERE id = $3
      RETURNING id, estado_laboral, motivo_salida, fecha_salida;
    `;

    const result = await pool.query(query, [estado_laboral, motivo_salida, id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    console.error("PATCH /api/usuarios/[id]/estado error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
