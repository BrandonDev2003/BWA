// src/app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ ok: false, error: "No hay token" }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      const res = NextResponse.json(
        { ok: false, error: "Token inválido o expirado" },
        { status: 401 }
      );
      // limpia cookie por seguridad
      res.cookies.set("token", "", { path: "/", maxAge: 0 });
      return res;
    }

    // ✅ VALIDAR EN BD que siga ACTIVO
    // Ajusta nombres según tu token: normalmente payload.id y payload.correo
    const dbRes = await query(
      `SELECT id, correo, rol, estado_laboral
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [payload.id]
    );

    const user = dbRes.rows[0];

    if (!user) {
      const res = NextResponse.json(
        { ok: false, error: "Usuario no encontrado" },
        { status: 401 }
      );
      res.cookies.set("token", "", { path: "/", maxAge: 0 });
      return res;
    }

    if (user.estado_laboral !== "ACTIVO") {
      const res = NextResponse.json(
        { ok: false, error: "Usuario no activo" },
        { status: 403 }
      );
      // ✅ revocar cookie inmediatamente
      res.cookies.set("token", "", { path: "/", maxAge: 0 });
      return res;
    }

    // ✅ Retornar info normalizada desde BD (no desde token)
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        correo: user.correo,
        rol: String(user.rol || "").toLowerCase(),
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
