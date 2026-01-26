// src/app/api/chats/direct/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const body = await req.json();
    const { fromUserId, toUserId } = body;
    if (!fromUserId || !toUserId) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    if (fromUserId === toUserId) return NextResponse.json({ error: "No puedes chatear contigo mismo" }, { status: 400 });

    await client.query("BEGIN");

    // Revisar si ya existe chat entre usuarios
    const check = await client.query(
      `SELECT c.id
       FROM chats c
       JOIN chat_users cu1 ON cu1.chat_id = c.id AND cu1.user_id = $1
       JOIN chat_users cu2 ON cu2.chat_id = c.id AND cu2.user_id = $2
       WHERE c.type = 'direct'`,
      [fromUserId, toUserId]
    );

    let chatId;
    if (check.rows.length > 0) {
      chatId = check.rows[0].id;
    } else {
      const chatRes = await client.query(`INSERT INTO chats (type) VALUES ('direct') RETURNING id`);
      chatId = chatRes.rows[0].id;
      await client.query(
        `INSERT INTO chat_users (chat_id, user_id) VALUES ($1, $2), ($1, $3)`,
        [chatId, fromUserId, toUserId]
      );
    }

    await client.query("COMMIT");
    client.release();
    return NextResponse.json({ id: chatId, type: "direct", userId: toUserId });
  } catch (err) {
    await client.query("ROLLBACK");
    client.release();
    console.error(err);
    return NextResponse.json({ error: "Error creando chat" }, { status: 500 });
  }
}
