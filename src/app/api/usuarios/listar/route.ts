import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import jwt from "jsonwebtoken";

function getToken(req: NextRequest) {
  return req.cookies.get("token")?.value || null;
}

function verify(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET || "") as any;
}

// ✅ labels para mostrar en tooltip (solo obligatorios)
const REQ_LABELS: Record<string, string> = {
  hoja_vida: "Hoja de vida",
  copia_cedula: "Copia cédula",
  certificado_votacion: "Certificado votación",
  foto_carnet: "Foto carnet",
  titulo_estudios: "Título estudios",
  certificados_cursos: "Certificados cursos",
  certificados_laborales: "Certificados laborales",
  certificados_honorabilidad: "Certificados honorabilidad",
  historial_iess: "Historial IESS",
  antecedentes_penales: "Antecedentes penales",
  certificado_bancario: "Certificado bancario",
  ruc: "RUC",
};

const REQUIRED_KEYS = Object.keys(REQ_LABELS);

export async function GET(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token)
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

    let decoded;
    try {
      decoded = verify(token);
    } catch {
      return NextResponse.json({ ok: false, error: "Token inválido" }, { status: 401 });
    }

    const rol = decoded.rol;

    let where = "";
    const params: any[] = [];


    if (!(rol === "admin" || rol === "administrador" || rol === "SpA" || rol === "rrhh" || rol === "RRHH")) {

      where = "WHERE u.id = $1";
      params.push(decoded.id);
    }

    const query = `
      SELECT
        u.id, u.nombre, u.correo, u.cedula, u.rol,
        u.foto_asesor, u.cedula_frontal, u.cedula_reverso,

        r.hoja_vida,
        r.copia_cedula,
        r.certificado_votacion,
        r.foto_carnet,
        r.titulo_estudios,
        r.certificados_cursos,
        r.certificados_laborales,
        r.certificados_honorabilidad,
        r.historial_iess,
        r.antecedentes_penales,
        r.certificado_bancario,
        r.ruc
      FROM users u
      LEFT JOIN requisitos_usuario r ON r.user_id = u.id
      ${where}
      ORDER BY u.id DESC
    `;

    const result = await pool.query(query, params);

    const usuarios = result.rows.map((row: any) => {
      const faltantes = REQUIRED_KEYS
        .filter((k) => !row[k])
        .map((k) => REQ_LABELS[k]);

      const estado_expediente = faltantes.length === 0 ? "COMPLETO" : "INCOMPLETO";

      return {
        id: row.id,
        nombre: row.nombre,
        correo: row.correo,
        cedula: row.cedula,
        rol: row.rol,
        foto_asesor: row.foto_asesor,
        cedula_frontal: row.cedula_frontal,
        cedula_reverso: row.cedula_reverso,

        // ✅ para el tooltip en la tabla
        estado_expediente,
        faltantes,
      };
    });

    return NextResponse.json({ ok: true, usuarios });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
