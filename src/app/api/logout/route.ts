import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true, message: "Sesión cerrada" });

  // 🧼 Eliminar cookie de forma limpia
  res.cookies.set({
    name: "token",
    value: "",
    path: "/", // 🔑 igual que en login
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });

  return res;
}
