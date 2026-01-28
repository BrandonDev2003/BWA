import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const client = await pool.connect();

  try {
    const formData = await req.formData();

    const chatId = formData.get("chatId");
    const senderId = formData.get("senderId");
    const file = formData.get("file") as File | null;

    if (!chatId || !senderId || !file) {
      return NextResponse.json(
        { error: "Faltan datos" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads"
    );

    // ✅ asegura que exista /public/uploads
    await mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name);
    const filename = `${randomUUID()}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;

    const res = await client.query(
      `
      INSERT INTO messages (chat_id, sender_id, content, type, url, created_at)
      VALUES ($1, $2, $3, 'file', $4, NOW())
      RETURNING id, chat_id, sender_id, content, type, url, created_at
      `,
      [
        Number(chatId),
        Number(senderId),
        file.name, // content NO nulo
        fileUrl,
      ]
    );

    // nombre remitente
    const userRes = await client.query(
      "SELECT nombre FROM users WHERE id=$1",
      [senderId]
    );

    const message = {
      ...res.rows[0],
      sender_name: userRes.rows[0]?.nombre || "Usuario",
    };

    return NextResponse.json(message);
  } catch (err) {
    console.error("Error POST archivo:", err);
    return NextResponse.json(
      { error: "Error subiendo archivo" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
