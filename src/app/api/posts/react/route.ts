import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import jwt from "jsonwebtoken";

function getToken(req: NextRequest) {
  return req.cookies.get("token")?.value || null;
}

function verifyToken(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no configurado");
  return jwt.verify(token, secret) as any;
}

export async function POST(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const { postId, reaction } = await req.json();

    const pid = Number(postId);
    if (!pid || Number.isNaN(pid)) {
      return NextResponse.json({ ok: false, error: "postId inválido" }, { status: 400 });
    }

    // ✅ toggle: si reaction es null => quitar like
    if (reaction === null) {
      await pool.query(
        `DELETE FROM post_reactions WHERE post_id=$1 AND user_id=$2`,
        [pid, decoded.id]
      );
      return NextResponse.json({ ok: true, removed: true });
    }

    // ✅ solo like permitido
    if (reaction !== "like") {
      return NextResponse.json({ ok: false, error: "Reacción inválida" }, { status: 400 });
    }

    await pool.query(
      `
      INSERT INTO post_reactions (post_id, user_id, reaction)
      VALUES ($1, $2, 'like')
      ON CONFLICT (post_id, user_id)
      DO UPDATE SET reaction = 'like'
      `,
      [pid, decoded.id]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
