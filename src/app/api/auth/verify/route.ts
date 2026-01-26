// src/app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // 🔹 Leer token de cookie HttpOnly
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "No hay token" },
        { status: 401 }
      );
    }

    // 🔹 Verificar token
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    // 🔹 Retornar solo la info necesaria y normalizar rol a minúsculas
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol.toLowerCase(), // ⚡ siempre "admin" o "asesor"
      },
    });
  } catch (err) {
    console.error("Error en /api/auth/verify:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
