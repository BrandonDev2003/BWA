import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import jwt from "jsonwebtoken";
import { hashPassword } from "@/lib/auth";

function getToken(req: NextRequest) {
  return req.cookies.get("token")?.value || null;
}

function verify(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET || "") as any;
}

export async function POST(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    let decoded;
    try {
      decoded = verify(token);
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    if (!(decoded.rol === "admin" || decoded.rol === "administrador" || decoded.rol === "SpA" || decoded.rol === "rrhh"  || decoded.rol === "RRHH")) {
      return NextResponse.json(
        { error: "Solo admin puede crear" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const hashedPass = await hashPassword(body.password);

    // ⚠️ USERS NO TIENE asignado_a
    const query = `
      INSERT INTO users (nombre, correo, cedula, rol, password, foto_asesor, cedula_frontal, cedula_reverso)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `;

    const values = [
      body.nombre,
      body.correo,
      body.cedula,
      body.rol,
      hashedPass,
      body.foto_asesor || null,
      body.cedula_frontal || null,
      body.cedula_reverso || null,
    ];

    const result = await pool.query(query, values);

    return NextResponse.json({ user: result.rows[0] });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
