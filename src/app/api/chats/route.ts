// src/app/api/chats/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = Number(url.searchParams.get("userId"));
    if (!userId) return NextResponse.json([], { status: 400 });

    const client = await pool.connect();

    const res = await client.query(
      `
      SELECT
        c.id,
        u.id        AS "userId",
        u.nombre    AS name,
        u.foto_asesor AS photo,
        m.content   AS "lastMessage",
        m.created_at
      FROM chats c
      JOIN chat_users cu1 ON cu1.chat_id = c.id AND cu1.user_id = $1
      JOIN chat_users cu2 ON cu2.chat_id = c.id AND cu2.user_id <> $1
      JOIN users u ON u.id = cu2.user_id
      LEFT JOIN LATERAL (
        SELECT content, created_at
        FROM messages
        WHERE chat_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
      ) m ON true
      ORDER BY m.created_at DESC NULLS LAST
      `,
      [userId]
    );

    client.release();
    return NextResponse.json(res.rows);
  } catch (err) {
    console.error("API /chats error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
