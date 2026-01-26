// src/app/api/auth/validate-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { getUserSession } from "@/lib/auth"; // debe retornar { userId: number }

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();

    if (!session?.userId) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ ok: false, error: "No enviaste contraseña" }, { status: 400 });
    }

    const client = await pool.connect();
    const result = await client.query("SELECT password FROM users WHERE id = $1", [
      session.userId,
    ]);
    client.release();

    if (result.rowCount === 0) {
      return NextResponse.json({ ok: false, error: "Usuario no existe" }, { status: 404 });
    }

    const hashed = result.rows[0].password;
    const isValid = await bcrypt.compare(password, hashed);

    if (!isValid) {
      return NextResponse.json({ ok: false, error: "Contraseña incorrecta" }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("validate-password error:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500 }
    );
  }
}
