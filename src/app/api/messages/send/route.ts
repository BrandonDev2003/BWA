import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  const { chatId, content, senderId } = await req.json();
  if (!chatId || !content || !senderId) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO messages (chat_id, sender_id, content, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [chatId, senderId, content]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error enviando mensaje:", err);
    return NextResponse.json({ error: "Error guardando mensaje" }, { status: 500 });
  } finally {
    client.release();
  }
}
