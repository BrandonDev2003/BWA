import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value || "";
  const role = request.cookies.get("role")?.value || ""; // <- RRHH, ADMIN, etc.

  const pathname = request.nextUrl.pathname;

  // 1) Rutas que requieren sesión
  const protectedRoutes = ["/leads", "/leadsgestion", "/rrhh"];

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 2) Rutas solo RRHH
  if (pathname.startsWith("/rrhh")) {
    if (role !== "RRHH") {
      return NextResponse.redirect(new URL("/no-autorizado", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/leads/:path*", "/leadsgestion/:path*", "/rrhh/:path*"],
};
