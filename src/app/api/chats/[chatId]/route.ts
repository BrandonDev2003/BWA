// src/app/api/chats/[chatId]/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function DELETE(req: Request) {
  const client = await pool.connect();

  try {
    // Extraemos chatId desde la URL de la request
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/"); // /api/chats/9
    const chatIdStr = pathSegments[pathSegments.length - 1];
    const chatId = parseInt(chatIdStr, 10);

    if (isNaN(chatId)) {
      return NextResponse.json({ error: "ChatId inválido" }, { status: 400 });
    }

    await client.query("BEGIN");

    // Borrar mensajes del chat
    await client.query("DELETE FROM messages WHERE chat_id=$1", [chatId]);

    // Borrar relaciones de usuarios
    await client.query("DELETE FROM chat_users WHERE chat_id=$1", [chatId]);

    // Borrar chat
    await client.query("DELETE FROM chats WHERE id=$1", [chatId]);

    await client.query("COMMIT");

    return NextResponse.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error borrando chat:", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo borrar el chat" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
