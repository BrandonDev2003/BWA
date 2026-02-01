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

    const rol = String(user.rol ?? "").toLowerCase();
    if (!(rol.includes("admin") || rol.includes("spa") || rol.includes("RRHH") || rol.includes("SpA") || rol.includes("rrhh")  )) {
      return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const asesorId = Number(body?.asesorId);

    if (!asesorId) {
      return NextResponse.json({ ok: false, error: "asesorId es requerido" }, { status: 400 });
    }

    // validar que exista y sea asesor
    const u = await client.query(
      `SELECT id FROM users WHERE id = $1 AND rol ILIKE '%asesor%'`,
      [asesorId]
    );
    if (u.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Asesor no encontrado" }, { status: 404 });
    }

    const upd = await client.query(
      `UPDATE leads SET asignado_a = NULL WHERE asignado_a = $1`,
      [asesorId]
    );

    return NextResponse.json({ ok: true, unassigned: upd.rowCount });
  } catch (e) {
    console.error("Error unassign-user:", e);
    return NextResponse.json({ ok: false, error: "Error quitando casos" }, { status: 500 });
  } finally {
    client.release();
  }
}
