import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

type Params = {
  chatId: string;
};

export async function GET(
  req: Request,
  context: { params: Promise<Params> }
) {
  const { chatId } = await context.params; // ✅ CLAVE

  const id = parseInt(chatId, 10);
  if (isNaN(id)) {
    return NextResponse.json([], { status: 400 });
  }

  const client = await pool.connect();

  try {
    const res = await client.query(
      "SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC",
      [id]
    );

    return NextResponse.json(res.rows);
  } catch (error) {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  } finally {
    client.release();
  }
}
