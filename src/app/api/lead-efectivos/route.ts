import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

type TipoProducto = "plazo_fijo" | "profuturo";

type Payload = {
  lead_id: number;

  nombre: string;
  correo: string;
  telefono?: string | null;
  telefono_extra?: string | null;

  pais?: string | null;
  asignado_a?: number | null;

  tipo_producto: TipoProducto;
  meses: number;
  monto: number;
  interes: number;

  fecha_lead: string; // YYYY-MM-DD
  fecha_venta?: string;
};

function jsonError(message: string, status = 400, detail?: any) {
  return NextResponse.json({ ok: false, message, detail }, { status });
}

/* ===========================
   GET: listar ventas
=========================== */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return jsonError("Unauthorized", 401);

  const rol = String(user.rol || "").toLowerCase();
  const isAdmin = rol === "admin" || rol === "spa" || rol === "SpA" || rol === "SPA";
  const userId = Number(user.id);

  const client = await pool.connect();
  try {
    // ✅ JOIN para traer nombre del asesor
    const baseQuery = `
      SELECT
        le.id,
        le.lead_id,
        le.nombre,
        le.correo,
        le.telefono,
        le.telefono_extra,
        le.pais,
        le.asignado_a,
        u.nombre AS nombre_asesor,
        le.tipo_producto,
        le.meses,
        le.monto,
        le.interes,
        le.fecha_lead,
        le.fecha_venta,
        le.creado_en,
        le.estado_revision
      FROM lead_efectivos le
      LEFT JOIN users u ON u.id = le.asignado_a
    `;

    const q = isAdmin
      ? `${baseQuery} ORDER BY le.fecha_venta DESC LIMIT 500`
      : `${baseQuery} WHERE le.asignado_a = $1 ORDER BY le.fecha_venta DESC LIMIT 500`;

    const params = isAdmin ? [] : [userId];
    const r = await client.query(q, params);

    return NextResponse.json({ ok: true, ventas: r.rows });
  } catch (e: any) {
    console.error("GET /api/lead-efectivos error:", e);
    return jsonError("Error cargando ventas", 500, String(e?.message ?? e));
  } finally {
    client.release();
  }
}

/* ===========================
   POST: crear venta
=========================== */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return jsonError("Unauthorized", 401);

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return jsonError("JSON inválido.", 400);
  }

  if (!body?.lead_id || !Number.isFinite(Number(body.lead_id)))
    return jsonError("lead_id es requerido.", 400);

  if (!body?.nombre?.trim()) return jsonError("nombre es requerido.", 400);
  if (!body?.correo?.trim()) return jsonError("correo es requerido.", 400);

  if (body.tipo_producto !== "plazo_fijo" && body.tipo_producto !== "profuturo")
    return jsonError("tipo_producto inválido.", 400);

  if (!Number.isFinite(Number(body.meses)) || Number(body.meses) <= 0)
    return jsonError("meses inválido.", 400);

  if (!Number.isFinite(Number(body.monto)) || Number(body.monto) <= 0)
    return jsonError("monto inválido.", 400);

  if (!Number.isFinite(Number(body.interes)) || Number(body.interes) <= 0)
    return jsonError("interes inválido.", 400);

  if (!body.fecha_lead || !/^\d{4}-\d{2}-\d{2}$/.test(body.fecha_lead))
    return jsonError("fecha_lead es requerida (YYYY-MM-DD).", 400);

  const fechaVenta = body.fecha_venta ? new Date(body.fecha_venta) : new Date();
  if (Number.isNaN(fechaVenta.getTime())) return jsonError("fecha_venta inválida.", 400);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const insert = await client.query(
      `
      INSERT INTO lead_efectivos
        (lead_id, nombre, correo, telefono, telefono_extra, pais, asignado_a,
         tipo_producto, meses, monto, interes, fecha_lead, fecha_venta)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,
         $8,$9,$10,$11,$12,$13)
      RETURNING id
      `,
      [
        Number(body.lead_id),
        body.nombre.trim(),
        body.correo.trim(),
        (body.telefono ?? "").trim() || null,
        (body.telefono_extra ?? "").trim() || null,
        body.pais ?? null,
        body.asignado_a ?? null,

        body.tipo_producto,
        Number(body.meses),
        Number(body.monto),
        Number(body.interes),

        body.fecha_lead,
        fechaVenta,
      ]
    );

    // Si tu enum/constraint de leads.estado NO tiene 'venta', comenta esto:
    await client.query(`UPDATE leads SET estado = 'venta' WHERE id = $1`, [
      Number(body.lead_id),
    ]);

    await client.query("COMMIT");
    return NextResponse.json({ ok: true, id: insert.rows[0]?.id ?? null });
  } catch (e: any) {
    await client.query("ROLLBACK");
    console.error("POST /api/lead-efectivos error:", e);
    return jsonError("Error guardando la venta.", 500, String(e?.message ?? e));
  } finally {
    client.release();
  }
}
