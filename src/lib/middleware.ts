import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value || "";

  // Rutas protegidas
  const protectedRoutes = ["/leads", "/leadsgestion"];

  const pathname = request.nextUrl.pathname;

  // Si intenta entrar a una ruta protegida sin sesión
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

// Aquí aplicamos el middleware
export const config = {
  matcher: ["/leads/:path*", "/leadsgestion/:path*"],
};
