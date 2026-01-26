import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: Request) {
  const { name, users, managerId } = await req.json();

  const chat = await db.query(
    "INSERT INTO chats (type, created_by) VALUES ('group', $1) RETURNING id",
    [managerId]
  );

  for (const userId of users) {
    await db.query(
      "INSERT INTO chat_users (chat_id, user_id) VALUES ($1, $2)",
      [chat.rows[0].id, userId]
    );
  }

  return NextResponse.json({ chatId: chat.rows[0].id });
}
