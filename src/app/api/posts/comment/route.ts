import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import jwt from "jsonwebtoken";

function getToken(req: NextRequest) {
  return req.cookies.get("token")?.value || null;
}
function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET || "") as any;
}

export async function POST(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const decoded = verifyToken(token);

    const body = await req.json().catch(() => ({}));
    const postId = Number(body.postId);
    const contenido = typeof body.contenido === "string" ? body.contenido.trim() : "";

    if (!postId || Number.isNaN(postId)) {
      return NextResponse.json({ ok: false, error: "postId inválido" }, { status: 400 });
    }
    if (!contenido) {
      return NextResponse.json({ ok: false, error: "Comentario requerido" }, { status: 400 });
    }

    const result = await pool.query(
      `
      INSERT INTO post_comments (post_id, user_id, contenido)
      VALUES ($1, $2, $3)
      RETURNING id, contenido, created_at
      `,
      [postId, decoded.id, contenido]
    );

    return NextResponse.json({ ok: true, comment: result.rows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
