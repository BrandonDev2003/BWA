import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyToken, UserPayload } from "@/lib/auth";

function getIdFromReq(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.pathname.split("/")[3]; // /api/leads/:id
  return id;
}

export async function GET(req: NextRequest) {
  try {
    const id = getIdFromReq(req);

    const token = req.cookies.get("token")?.value;
    if (!token)
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

    const user: UserPayload | null = await verifyToken(token);
    if (!user)
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

    // ✅ Trae el lead + nombre del asesor (users.nombre) + TODO lo de leads (incluye fecha si existe)
    const result = await pool.query(
      `
      SELECT
        l.*,
        u.nombre AS nombre_asesor
      FROM leads l
      LEFT JOIN users u ON u.id = l.asignado_a
      WHERE l.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Lead no encontrado" }, { status: 404 });
    }

    // ✅ DEVUELVE EL LEAD DIRECTO (como quieres)
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const id = getIdFromReq(req);

    const token = req.cookies.get("token")?.value;
    if (!token)
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

    const user: UserPayload | null = await verifyToken(token);
    if (!user)
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

    const { estado } = await req.json();

    // ✅ actualiza
    const upd = await pool.query(
      "UPDATE leads SET estado = $1 WHERE id = $2 RETURNING id",
      [estado, id]
    );

    if (upd.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Lead no encontrado" }, { status: 404 });
    }

    // ✅ devuelve lead actualizado con nombre_asesor
    const result = await pool.query(
      `
      SELECT
        l.*,
        u.nombre AS nombre_asesor
      FROM leads l
      LEFT JOIN users u ON u.id = l.asignado_a
      WHERE l.id = $1
      `,
      [id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = getIdFromReq(req);

    const token = req.cookies.get("token")?.value;
    if (!token)
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

    const user: UserPayload | null = await verifyToken(token);
    if (!user)
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

    const rol = String((user as any)?.rol ?? "").toLowerCase();
    const canDelete =
      rol === "admin" || rol === "administrador" || rol === "spa" || rol === "rrhh";

    if (!canDelete) {
      return NextResponse.json({ ok: false, error: "No autorizado para borrar" }, { status: 403 });
    }

    try {
      await pool.query("DELETE FROM notes WHERE lead_id = $1", [id]);
    } catch {}

    const result = await pool.query("DELETE FROM leads WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Lead no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, id: result.rows[0].id });
  } catch (err: any) {
    console.error(err);

    const msg = String(err?.message ?? "");
    if (msg.toLowerCase().includes("foreign key")) {
      return NextResponse.json(
        { ok: false, error: "No se puede borrar: hay registros relacionados (FK)." },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
