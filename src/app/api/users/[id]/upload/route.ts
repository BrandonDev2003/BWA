import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

const ALLOWED_FIELDS = [
  "foto_asesor",
  "cedula_frontal",
  "cedula_reverso",
];

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "ID no proporcionado" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const field = formData.get("field") as string;
    const file = formData.get("file") as File;

    if (!field || !file) {
      return NextResponse.json(
        { ok: false, error: "Campo o archivo faltante" },
        { status: 400 }
      );
    }

    if (!ALLOWED_FIELDS.includes(field)) {
      return NextResponse.json(
        { ok: false, error: "Campo no permitido" },
        { status: 400 }
      );
    }

    // Convertir archivo a base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await pool.query(
      `
      UPDATE users
      SET ${field} = $1
      WHERE id = $2
      RETURNING id, nombre, correo, cedula, rol,
        foto_asesor, cedula_frontal, cedula_reverso
      `,
      [base64, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500 }
    );
  }
}
