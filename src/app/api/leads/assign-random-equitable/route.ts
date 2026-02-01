import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

    // Permisos: ajusta a tus roles reales
    const rol = String(user.rol ?? "").toLowerCase();
    if (!(rol.includes("admin") || rol.includes("spa") || rol.includes("RRHH") || rol.includes("SpA")  || rol.includes("rrhh") )) {
      return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });
    }

    // Body opcional por si lo quieres
    const body = await req.json().catch(() => ({}));
    const onlyUnassigned = body?.onlyUnassigned !== false; // default true

    await client.query("BEGIN");

    // 1) Asesores
    const asesoresRes = await client.query(
      `
      SELECT id
      FROM users
      WHERE rol ILIKE '%asesor%'
      ORDER BY id ASC
      `
    );
    const asesores: number[] = asesoresRes.rows.map((r) => Number(r.id));

    if (asesores.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ ok: false, error: "No hay asesores" }, { status: 400 });
    }

    // 2) Leads sin asignar
    const leadsRes = await client.query(
      `
      SELECT id
      FROM leads
      WHERE ${onlyUnassigned ? "asignado_a IS NULL" : "TRUE"}
      ORDER BY id ASC
      `
    );
    const leadIds: number[] = leadsRes.rows.map((r) => Number(r.id));

    if (leadIds.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ ok: true, message: "No hay leads para asignar", assigned: 0 });
    }

    // 3) Cargas actuales
    const cargasRes = await client.query(
      `
      SELECT asignado_a as id, COUNT(*)::int as total
      FROM leads
      WHERE asignado_a = ANY($1::int[])
      GROUP BY asignado_a
      `,
      [asesores]
    );

    const carga = new Map<number, number>();
    for (const a of asesores) carga.set(a, 0);
    for (const row of cargasRes.rows) carga.set(Number(row.id), Number(row.total));

    // 4) Ordenar asesores por menor carga (equidad)
    const asesoresOrdenados = [...asesores].sort((a, b) => {
      const ca = carga.get(a) ?? 0;
      const cb = carga.get(b) ?? 0;
      if (ca !== cb) return ca - cb;
      return a - b;
    });

    // 5) Reparto round-robin
    const asignaciones: Array<{ leadId: number; asesorId: number }> = [];
    let idx = 0;
    for (const leadId of leadIds) {
      const asesorId = asesoresOrdenados[idx % asesoresOrdenados.length];
      asignaciones.push({ leadId, asesorId });
      idx++;
    }

    // 6) UPDATE masivo con CASE
    const ids = asignaciones.map((x) => x.leadId);

    const caseSql = asignaciones
      .map((x, i) => `WHEN id = $${i * 2 + 1} THEN $${i * 2 + 2}`)
      .join(" ");

    const params: any[] = [];
    for (const x of asignaciones) {
      params.push(x.leadId, x.asesorId);
    }

    params.push(ids); // último param: array de ids para WHERE IN

    const updateSql = `
      UPDATE leads
      SET asignado_a = CASE ${caseSql} ELSE asignado_a END
      WHERE id = ANY($${params.length}::int[])
    `;

    await client.query(updateSql, params);

    await client.query("COMMIT");
    return NextResponse.json({ ok: true, assigned: asignaciones.length });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("Error assign-random-equitable:", e);
    return NextResponse.json({ ok: false, error: "Error asignando aleatoriamente" }, { status: 500 });
  } finally {
    client.release();
  }
}
        