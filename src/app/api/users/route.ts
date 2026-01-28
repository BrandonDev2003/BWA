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

// ---------------------------
// GET – LISTAR USUARIOS
// ---------------------------
export async function GET(req: NextRequest) {
  try {
    console.log("➡️ Ejecutando GET /api/users");

    const token = getToken(req);
    console.log("Token recibido:", token);

    if (!token) {
      console.log("❌ No hay token");
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = verify(token);
      console.log("Token decodificado:", decoded);
    } catch (e) {
      console.log("❌ Token inválido:", e);
      return NextResponse.json({ ok: false, error: "Token inválido" }, { status: 401 });
    }

    const userId = decoded.id;
    const userRol = decoded.rol;

    console.log("Usuario autenticado:", userId, userRol);

    let query = "";
    let params: any[] = [];

    if (userRol === "admin" || userRol === "administrador") {
      query = `
        SELECT id, nombre, correo, cedula, rol, foto_asesor, cedula_frontal, cedula_reverso, asignado_a
        FROM users
        ORDER BY id DESC
      `;
    } else {
      query = `
        SELECT id, nombre, correo, cedula, rol, foto_asesor, cedula_frontal, cedula_reverso, asignado_a
        FROM users
        WHERE asignado_a = $1
        ORDER BY id DESC
      `;
      params = [userId];
    }

    console.log("Ejecutando query:", query, params);

    const result = await pool.query(query, params);

    console.log("Usuarios obtenidos:", result.rows.length);

    return NextResponse.json({ ok: true, users: result.rows });
  } catch (e) {
    console.log("❌ ERROR COMPLETO EN GET /api/users:");
    console.log(e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// ---------------------------
// POST – CREAR USUARIO
// ---------------------------
export async function POST(req: NextRequest) {
  try {
    console.log("➡️ Ejecutando POST /api/users");

    const token = getToken(req);

    if (!token) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = verify(token);
    } catch (e) {
      return NextResponse.json({ ok: false, error: "Token inválido" }, { status: 401 });
    }

    const userRol = decoded.rol;

    if (!(userRol === "admin" || userRol === "administrador")) {
      return NextResponse.json({ ok: false, error: "Solo admin puede crear" }, { status: 403 });
    }

    const body = await req.json();

    console.log("Body recibido:", body);

    const hashed = await hashPassword(body.password);

    const query = `
      INSERT INTO users (nombre, correo, cedula, rol, password, foto_asesor, cedula_frontal, cedula_reverso, asignado_a)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `;

    const values = [
      body.nombre,
      body.correo,
      body.cedula,
      body.rol,
      hashed,
      body.foto_asesor || null,
      body.cedula_frontal || null,
      body.cedula_reverso || null,
      body.asignado_a || null,
    ];

    console.log("Ejecutando INSERT:", values);

    const result = await pool.query(query, values);

    return NextResponse.json({ ok: true, user: result.rows[0] });
  } catch (e) {
    console.log("❌ ERROR COMPLETO EN POST /api/users:");
    console.log(e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
