import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

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
    const formData = await req.formData();

    const userId = Number(formData.get("userId"));
    const fieldRaw = String(formData.get("field") || "");
    const file = formData.get("file");

    if (!userId || !fieldRaw || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });
    }

    if (!ALLOWED_FIELDS.includes(fieldRaw as AllowedField)) {
      return NextResponse.json({ ok: false, error: "Campo inválido" }, { status: 400 });
    }

    const field = fieldRaw as AllowedField;

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name || "").toLowerCase();
    const safeExt = ext && ext.length <= 10 ? ext : "";
    const filename = `${field}-${randomUUID()}${safeExt}`;

    const dir = path.join(process.cwd(), "public", "uploads", "requisitos", String(userId));
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);

    const url = `/uploads/requisitos/${userId}/${filename}`;

    await pool.query(
      `
      INSERT INTO requisitos_usuario (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
      `,
      [userId]
    );

    const result = await pool.query(
      `
      UPDATE requisitos_usuario
      SET ${field} = true,
          ${field}_file = $2
      WHERE user_id = $1
      RETURNING ${field}, ${field}_file
      `,
      [userId, url]
    );

    return NextResponse.json({ ok: true, url, data: result.rows[0] });
  } catch (e) {
    console.error("UPLOAD ERROR:", e);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
