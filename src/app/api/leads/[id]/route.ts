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

    const result = await pool.query("SELECT * FROM leads WHERE id = $1", [id]);
    if (result.rows.length === 0)
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/")[3];

    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const user: UserPayload | null = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { estado } = await req.json();
    const result = await pool.query(
      "UPDATE leads SET estado = $1 WHERE id = $2 RETURNING *",
      [estado, id]
    );
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
