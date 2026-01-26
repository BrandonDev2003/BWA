import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { comparePassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { correo, password } = await req.json();

  if (!correo || !password) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios" },
      { status: 400 }
    );
  }

  const result = await query("SELECT * FROM users WHERE correo = $1", [correo]);
  const user = result.rows[0];

  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    return NextResponse.json(
      { error: "Contraseña incorrecta" },
      { status: 401 }
    );
  }

  const token = signToken({
    id: user.id,
    nombre_completo: user.nombre_completo,
    correo: user.correo,
    rol: user.rol,
  });

  const res = NextResponse.json({
    ok: true,
    token,
    user: {
      id: user.id,
      nombre_completo: user.nombre_completo,
      correo: user.correo,
      rol: user.rol,
    },
  });

  // Guardamos el token como cookie
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  // Guardamos el correo del usuario logeado en cookie OTP
  res.cookies.set("otp_correo", user.correo, {
    httpOnly: false, // false si quieres acceder desde frontend
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 día
  });

  return res;
}
