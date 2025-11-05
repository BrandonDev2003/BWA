import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "clave_super_secreta";

interface JwtUserPayload {
  id: number;
  rol: string;
}

// ✅ Verificar token desde cookie
function verifyAuth(req: NextRequest): JwtUserPayload {
  const cookie = req.cookies.get("token")?.value;
  if (!cookie) throw new Error("No autorizado");

  try {
    return jwt.verify(cookie, JWT_SECRET) as JwtUserPayload;
  } catch {
    throw new Error("Token inválido o expirado");
  }
}

// 🟢 GET - Obtener usuarios con rol 'asesor'
export async function GET(req: NextRequest) {
  try {
    verifyAuth(req);

    const result = await query(
      "SELECT id, nombre_completo, correo, rol FROM users WHERE rol='asesor' ORDER BY id DESC"
    );

    return NextResponse.json(result.rows || []);
  } catch (error: any) {
    console.error("❌ Error al obtener usuarios:", error.message);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
