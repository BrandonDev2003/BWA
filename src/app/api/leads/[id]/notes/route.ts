import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyToken, UserPayload } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/")[3];

    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const user: UserPayload | null = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // ✅ SOLO CAMBIO: traer autor_nombre desde users.nombre
    const result = await pool.query(
      `
      SELECT
        n.*,
        u.nombre AS autor_nombre
      FROM notes n
      LEFT JOIN users u ON u.id = n.autor_id
      WHERE n.lead_id = $1
      ORDER BY n.fecha_hora DESC
      `,
      [id]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/")[3];

    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const user: UserPayload | null = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { contenido } = await req.json();
    if (!contenido) return NextResponse.json({ error: "Contenido vacío" }, { status: 400 });

    const result = await pool.query(
      `
      INSERT INTO notes (lead_id, autor_id, contenido, fecha_hora)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
      `,
      [id, user.id, contenido]
    );

    // ✅ SOLO CAMBIO: devolver también autor_nombre
    return NextResponse.json({
      ...result.rows[0],
      autor_nombre: (user as any)?.nombre ?? null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
