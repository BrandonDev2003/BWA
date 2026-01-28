import { NextResponse } from "next/server";
import { getIO } from "@/lib/socket";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chatId, senderId, content } = body;

    // guardar mensaje en BD (ejemplo)
    const result = await query(
      `INSERT INTO messages (chat_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [chatId, senderId, content]
    );

    const message = result.rows[0];

    // 🔥 EMITIR POR SOCKET
    const io = getIO();
    io.to(`chat:${chatId}`).emit("newMessage", message);

    return NextResponse.json(message);
  } catch (err) {
    console.error("ERROR EN /api/messages:", err);
    return NextResponse.json(
      { error: "Error enviando mensaje" },
      { status: 500 }
    );
  }
}
