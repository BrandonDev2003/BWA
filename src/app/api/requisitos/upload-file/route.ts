import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

// ✅ Mantengo tus campos permitidos
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

  // ✅ SOLO ESTO SE AGREGÓ
  "acuerdo_privacidad",

  "certificado_discapacidad",
  "partida_matrimonio",
  "partida_nacimiento_hijos",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

// ✅ Para no llenar Cloudinary con PDFs enormes sin querer, limita tamaño (ej 10MB)
const MAX_BYTES = 10 * 1024 * 1024;

// ✅ Opcional: permitir pdf + imágenes
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

function mimeToResourceType(mime: string): "image" | "raw" {
  // PDF debe ir como raw en Cloudinary
  if (mime === "application/pdf") return "raw";
  return "image";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const userId = Number(formData.get("userId"));
    const fieldRaw = String(formData.get("field") || "");
    const file = formData.get("file");

    if (!userId || !fieldRaw || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Datos incompletos" },
        { status: 400 }
      );
    }

    if (!ALLOWED_FIELDS.includes(fieldRaw as AllowedField)) {
      return NextResponse.json(
        { ok: false, error: "Campo inválido" },
        { status: 400 }
      );
    }

    const field = fieldRaw as AllowedField;

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Archivo demasiado grande (máx 10MB)" },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: `Tipo de archivo no permitido: ${file.type}` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const resourceType = mimeToResourceType(file.type);

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `requisitos/${userId}`,
          resource_type: resourceType,
          public_id: `${field}-${Date.now()}`,
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(buffer);
    });

    const url: string = uploadResult.secure_url;

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
  } catch (e: any) {
    console.error("UPLOAD ERROR:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno" },
      { status: 500 }
    );
  }
}