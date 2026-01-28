import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

const ALLOWED_FIELDS = [
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
  "certificado_discapacidad",
  "partida_matrimonio",
  "partida_nacimiento_hijos",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

export async function POST(req: NextRequest) {
  try {
    const { userId, field: fieldRaw } = await req.json();

    if (!userId || !fieldRaw) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    if (!ALLOWED_FIELDS.includes(fieldRaw as AllowedField)) {
      return NextResponse.json({ ok: false, error: "Campo inválido" }, { status: 400 });
    }

    const field = fieldRaw as AllowedField;

    await pool.query(
      `
      UPDATE requisitos_usuario
      SET ${field} = false,
          ${field}_file = NULL
      WHERE user_id = $1
      `,
      [userId]
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
