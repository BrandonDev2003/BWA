import { query } from "@/lib/db";
import { hashPassword, verifyToken } from "@/lib/auth";

async function getTokenFromReq(req) {
  const h = req.headers.get("authorization") || "";
  if (!h.startsWith("Bearer ")) return null;
  return h.split(" ")[1];
}

export async function POST(req) {
  try {
    const token = await getTokenFromReq(req);
    if (!token) return new Response(JSON.stringify({ success: false, error: "token faltante" }), { status: 401 });

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: "token inválido" }), { status: 401 });
    }

    if (decoded.rol !== "manager") {
      return new Response(JSON.stringify({ success: false, error: "acceso denegado: solo manager" }), { status: 403 });
    }

    const body = await req.json();
    const { nombre_completo, correo, cedula, permiso_ver_todo = false, password } = body;
    if (!nombre_completo || !correo || !cedula || !password) {
      return new Response(JSON.stringify({ success: false, error: "datos incompletos" }), { status: 400 });
    }

    const hashed = await hashPassword(password);

    // Insertar asesor
    const insert = await query(
      `INSERT INTO users (nombre_completo, correo, cedula, rol, permiso_ver_todo, password)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, nombre_completo, correo, cedula, rol, permiso_ver_todo`,
      [nombre_completo, correo, cedula, "asesor", permiso_ver_todo, hashed]
    );

    const newUser = insert.rows[0];
    return new Response(JSON.stringify({ success: true, user: newUser }), { status: 201 });
  } catch (err) {
    // manejar unique constraint (correo)
    if (err?.message?.includes("duplicate key value") || err?.message?.includes("unique")) {
      return new Response(JSON.stringify({ success: false, error: "correo ya existe" }), { status: 409 });
    }
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
