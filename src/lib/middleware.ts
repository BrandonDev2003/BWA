import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Permitir rutas públicas
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // ✅ Leer token de cookies
  const token = req.cookies.get("token")?.value;

  // 🚫 Si no hay token, redirigir al login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    // 🔍 Verificar token
    verifyToken(token);
    return NextResponse.next();
  } catch (err) {
    console.error("❌ Token inválido:", err);
    // ❌ Token inválido → redirigir al login
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

// ✅ Aplica middleware solo en rutas protegidas
export const config = {
  matcher: ["/home/:path*", "/admin/:path*", "/leads/:path*"], // protege tus rutas
};
