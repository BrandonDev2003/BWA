import { NextResponse } from "next/server";
import { query } from "@/lib/db";

type ReqField =
  | "hoja_vida"
  | "copia_cedula"
  | "certificado_votacion"
  | "foto_carnet"
  | "titulo_estudios"
  | "certificados_cursos"
  | "certificados_laborales"
  | "certificados_honorabilidad"
  | "historial_iess"
  | "antecedentes_penales"
  | "certificado_bancario"
  | "ruc"
  | "certificado_discapacidad"
  | "partida_matrimonio"
  | "partida_nacimiento_hijos";

const ALLOWED_FIELDS: ReqField[] = [
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
];

const TABLE_NAME = "requisitos_usuario";

// para evitar inyección en identificadores
function safeId(x: string) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(x);
}

async function pickUserIdColumn() {
  const candidates = ["user_id", "usuario_id", "id_usuario", "asesor_id"];

  const r = await query<{ column_name: string }>(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = ANY($2::text[])
    `,
    [TABLE_NAME, candidates]
  );

  return r.rows[0]?.column_name ?? null;
}

export async function POST(req: Request) {
  try {
    const { userId, field } = (await req.json()) as {
      userId?: string | number;
      field?: string;
    };

    if (!userId || !field) {
      return NextResponse.json({ ok: false, error: "Faltan datos" }, { status: 400 });
    }

    if (!ALLOWED_FIELDS.includes(field as ReqField)) {
      return NextResponse.json({ ok: false, error: "Campo inválido" }, { status: 400 });
    }

    const uid = Number(userId);
    if (!Number.isFinite(uid)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    if (!safeId(TABLE_NAME) || !safeId(field)) {
      return NextResponse.json({ ok: false, error: "Config inválida" }, { status: 500 });
    }

    // ✅ detecta la columna real de usuario
    const userIdCol = await pickUserIdColumn();
    if (!userIdCol || !safeId(userIdCol)) {
      return NextResponse.json(
        { ok: false, error: "No se encontró columna de usuario (user_id / usuario_id / id_usuario / asesor_id)" },
        { status: 500 }
      );
    }

    // ✅ UPDATE garantizado y confirmado
    const sql = `
      UPDATE "${TABLE_NAME}"
      SET "${field}" = NULL
      WHERE "${userIdCol}" = $1
      RETURNING "${userIdCol}" as id_ok
    `;

    const updated = await query<{ id_ok: number }>(sql, [uid]);

    if (updated.rowCount === 0) {
      return NextResponse.json(
        { ok: false, error: "No se encontró el registro para ese usuario" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete-file error:", err);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
