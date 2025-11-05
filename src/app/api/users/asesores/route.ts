// src/app/api/users/asesores/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const user = verifyToken(token);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Solo usuarios de rol 'asesor'
    const res = await query("SELECT id, nombre, correo, rol FROM users WHERE rol = 'asesor'");
    return NextResponse.json({ users: res.rows || [] });
  } catch (err) {
    console.error("Error al obtener asesores:", err);
    return NextResponse.json({ error: "Error al obtener asesores" }, { status: 500 });
  }
}
