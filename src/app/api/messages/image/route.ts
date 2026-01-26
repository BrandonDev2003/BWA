import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
  const client = await pool.connect();

  try {
    const formData = await req.formData();

    const chatId = formData.get("chatId");
    const senderId = formData.get("senderId");
    const image = formData.get("image") as File | null;

    if (!chatId || !senderId || !image) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = image.name.split(".").pop() || "jpg";
    const filename = `${crypto.randomUUID()}.${ext}`;

    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads"
    );

    await mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/${filename}`;

    const res = await client.query(
      `
      INSERT INTO messages (chat_id, sender_id, content, type, url, created_at)
      VALUES ($1, $2, '[image]', 'image', $3, NOW())
      RETURNING id, chat_id, sender_id, content, type, url, created_at
      `,
      [Number(chatId), Number(senderId), imageUrl]
    );

    const message = res.rows[0];

    const userRes = await client.query(
      "SELECT nombre AS sender_name FROM users WHERE id = $1",
      [Number(senderId)]
    );

    message.sender_name =
      userRes.rows[0]?.sender_name || "Desconocido";

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error POST imagen:", error);
    return NextResponse.json(
      { error: "Error subiendo imagen" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
