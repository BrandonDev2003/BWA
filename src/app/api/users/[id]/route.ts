import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import jwt from "jsonwebtoken";
import { hashPassword } from "@/lib/auth";
// -----------------------------
// Helpers
// -----------------------------
function getToken(req: NextRequest) {
  return req.cookies.get("token")?.value || null;
}

function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET || "") as any;
}

function extractIdFromUrl(req: NextRequest) {
  const segments = req.nextUrl.pathname.split("/");
  const id = Number(segments.pop());
  if (isNaN(id)) throw new Error("ID inválido");
  return id;
}

// -----------------------------
// GET — Usuario + requisitos (PERSISTENTE + DESCARGA)
// -----------------------------
export async function GET(req: NextRequest) {
  try {
    const id = extractIdFromUrl(req);

    const result = await pool.query(
      `
      SELECT 
        u.*,

        r.hoja_vida, r.hoja_vida_file,
        r.copia_cedula, r.copia_cedula_file,
        r.certificado_votacion, r.certificado_votacion_file,
        r.foto_carnet, r.foto_carnet_file,
        r.titulo_estudios, r.titulo_estudios_file,
        r.certificados_cursos, r.certificados_cursos_file,
        r.certificados_laborales, r.certificados_laborales_file,
        r.certificados_honorabilidad, r.certificados_honorabilidad_file,
        r.historial_iess, r.historial_iess_file,
        r.antecedentes_penales, r.antecedentes_penales_file,
        r.certificado_bancario, r.certificado_bancario_file,
        r.ruc, r.ruc_file,
        r.certificado_discapacidad, r.certificado_discapacidad_file,
        r.partida_matrimonio, r.partida_matrimonio_file,
        r.partida_nacimiento_hijos, r.partida_nacimiento_hijos_file

      FROM users u
      LEFT JOIN requisitos_usuario r ON r.user_id = u.id
      WHERE u.id = $1
      `,
      [id]
    );

    if (!result.rows.length) {
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const row = result.rows[0];

    const requisitos = {
      hoja_vida: row.hoja_vida_file ?? null,
      copia_cedula: row.copia_cedula_file ?? null,
      certificado_votacion: row.certificado_votacion_file ?? null,
      foto_carnet: row.foto_carnet_file ?? null,
      titulo_estudios: row.titulo_estudios_file ?? null,

      certificados_cursos: row.certificados_cursos_file ?? null,
      certificados_laborales: row.certificados_laborales_file ?? null,
      certificados_honorabilidad: row.certificados_honorabilidad_file ?? null,
      historial_iess: row.historial_iess_file ?? null,
      antecedentes_penales: row.antecedentes_penales_file ?? null,
      certificado_bancario: row.certificado_bancario_file ?? null,
      ruc: row.ruc_file ?? null,

      certificado_discapacidad: row.certificado_discapacidad_file ?? null,
      partida_matrimonio: row.partida_matrimonio_file ?? null,
      partida_nacimiento_hijos: row.partida_nacimiento_hijos_file ?? null,
    };

    const REQUIRED_KEYS = [
      "hoja_vida",
      "copia_cedula",
      "certificado_votacion",
      "foto_carnet",
      "titulo_estudios",
      "certificados_cursos",
      "certificados_laborales",
      "certificados_honorabilidad",
      "historial_iess",
      "antecedentes_penales",
      "certificado_bancario",
      "ruc",
    ] as const;

    const estado_expediente = REQUIRED_KEYS.every(k => !!requisitos[k])
      ? "COMPLETO"
      : "INCOMPLETO";

    return NextResponse.json({
      ok: true,
      user: {
        id: row.id,
        nombre: row.nombre,
        correo: row.correo,
        cedula: row.cedula,
        rol: row.rol,
        estado_expediente,
        foto_asesor: row.foto_asesor,
        cedula_frontal: row.cedula_frontal,
        cedula_reverso: row.cedula_reverso,
            linkedin_url: row.linkedin_url,
    facebook_url: row.facebook_url,
    instagram_url: row.instagram_url,
    tiktok_url: row.tiktok_url,
    x_url: row.x_url,
      },
      requisitos,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e.message || "Error interno" },
      { status: 500 }
    );
  }
}


// -----------------------------
// PUT — Editar usuario
// -----------------------------
export async function PUT(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token)
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

    verifyToken(token);
    const id = extractIdFromUrl(req);
    const body = await req.json();

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const key of Object.keys(body)) {
      if (key === "password") {
        const hashed = await hashPassword(body.password);
        fields.push(`password = $${idx++}`);
        values.push(hashed);
      } else {
        fields.push(`${key} = $${idx++}`);
        values.push(body[key]);
      }
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    return NextResponse.json({ ok: true, user: result.rows[0] });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e.message || "Error interno" },
      { status: 500 }
    );
  }
}

// -----------------------------
// DELETE — Admin
// -----------------------------
export async function DELETE(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token)
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!["admin", "administrador"].includes(decoded.rol))
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });

    const id = extractIdFromUrl(req);
    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e.message || "Error interno" },
      { status: 500 }
    );
  }
}
