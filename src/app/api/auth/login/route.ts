// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { comparePassword, signToken } from "@/lib/auth";
import speakeasy from "speakeasy";

export async function POST(req: NextRequest) {
  const { correo, password, otp } = await req.json();

  if (!correo || !password || !otp) {
    return NextResponse.json(
      { error: "Correo, contraseña y código OTP son obligatorios" },
      { status: 400 }
    );
  }

  const result = await query("SELECT * FROM users WHERE correo = $1", [correo]);
  const user = result.rows[0];

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (user.estado_laboral !== "ACTIVO") {
    return NextResponse.json(
      { error: "Usuario no activo. Contacte a RRHH." },
      { status: 403 }
    );
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  // 🔐 Verificar OTP (Google Authenticator)
  if (!user.totp_secret) {
    return NextResponse.json(
      { error: "Este usuario no tiene OTP configurado" },
      { status: 400 }
    );
  }

  const verified = speakeasy.totp.verify({
    secret: user.totp_secret,
    encoding: "base32",
    token: otp,
    window: 1, // tolerancia de tiempo
  });

  if (!verified) {
    return NextResponse.json({ error: "Código OTP inválido" }, { status: 401 });
  }

  // ✅ Login final
  const token = signToken({
    id: user.id,
    nombre_completo: user.nombre_completo,
    correo: user.correo,
    rol: user.rol,
  });

  const res = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      nombre_completo: user.nombre_completo,
      correo: user.correo,
      rol: user.rol,
    },
  });

  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return res;
}