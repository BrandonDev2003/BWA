import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.json({ message: "Sesión cerrada" });

  // 🔥 Expirar cookie de sesión (HTTPOnly)
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    expires: new Date(0),
  });

  return response;
}
