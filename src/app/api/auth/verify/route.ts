// src/app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // 🔹 Leer cookie HTTP-only
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "No hay token" },
      { status: 401 }
    );
  }

  try {
    // 🔹 Verificar token
    const user = verifyToken(token); // devuelve info del usuario
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Token inválido o expirado" },
      { status: 401 }
    );
  }
}
