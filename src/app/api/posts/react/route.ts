import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import jwt from "jsonwebtoken";

function getToken(req: NextRequest) {
  return req.cookies.get("token")?.value || null;
}
function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET || "") as any;
}

const ALLOWED = new Set(["like", "love", "dislike", "haha"]);

export async function POST(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

    const decoded = verifyToken(token);

    const { postId, reaction } = await req.json();

    const pid = Number(postId);
    if (!pid || Number.isNaN(pid)) {
      return NextResponse.json({ ok: false, error: "postId inválido" }, { status: 400 });
    }

    // reaction puede ser null -> quitar reacción
    if (reaction === null) {
      await pool.query(`DELETE FROM post_reactions WHERE post_id=$1 AND user_id=$2`, [pid, decoded.id]);
      return NextResponse.json({ ok: true, removed: true });
    }

    if (typeof reaction !== "string" || !ALLOWED.has(reaction)) {
      return NextResponse.json({ ok: false, error: "Reacción inválida" }, { status: 400 });
    }

    await pool.query(
      `
      INSERT INTO post_reactions (post_id, user_id, reaction)
      VALUES ($1, $2, $3)
      ON CONFLICT (post_id, user_id)
      DO UPDATE SET reaction = EXCLUDED.reaction, created_at = NOW()
      `,
      [pid, decoded.id, reaction]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
