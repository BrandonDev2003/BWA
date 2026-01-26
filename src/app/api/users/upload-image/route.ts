import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const field = formData.get("field") as string;
  const file = formData.get("file") as File;
  const userId = formData.get("userId");

  if (!field || !file || !userId)
    return NextResponse.json({ ok: false }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  await pool.query(
    `UPDATE users SET ${field}=$1 WHERE id=$2`,
    [base64, userId]
  );

  return NextResponse.json({ ok: true });
}
