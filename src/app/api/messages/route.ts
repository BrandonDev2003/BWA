import { NextResponse } from "next/server";
import { getIO, initSocket } from "@/lib/socket";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chatId, senderId, content } = body;

    const result = await query(
      `INSERT INTO messages (chat_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [chatId, senderId, content]
    );

    const message = result.rows[0];

    // ✅ Asegurar que Socket.io esté listo
    let io;
    try {
      io = getIO();
    } catch {
      // ⚠️ Necesitamos el server HTTP para initSocket
      const anyReq = req as any;
      const server = anyReq?.socket?.server || (global as any).server;

      if (!server) {
        console.warn("⚠️ No hay server HTTP para inicializar Socket.io todavía");
        return NextResponse.json(message); // igual devolvemos el mensaje guardado
      }

      (global as any).server = server;
      io = initSocket(server);
    }

    io.to(`chat:${chatId}`).emit("newMessage", message);

    return NextResponse.json(message);
  } catch (err) {
    console.error("ERROR EN /api/messages:", err);
    return NextResponse.json({ error: "Error enviando mensaje" }, { status: 500 });
  }
}
