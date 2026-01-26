import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import fs from "fs";
import path from "path";

function extractIdFromUrl(req: NextRequest) {
  const segments = req.nextUrl.pathname.split("/");
  return Number(segments[segments.length - 2]);
}

export async function POST(req: NextRequest) {
  try {
    const userId = extractIdFromUrl(req);

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const requisito = formData.get("requisito") as string;

    if (!file || !requisito) {
      return NextResponse.json(
        { ok: false, error: "Datos incompletos" },
        { status: 400 }
      );
    }

    // Crear carpeta
    const uploadDir = path.join(
      process.cwd(),
      "public/uploads/requisitos",
      String(userId)
    );
    fs.mkdirSync(uploadDir, { recursive: true });

    // Guardar archivo
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, `${requisito}-${Date.now()}.pdf`);
    fs.writeFileSync(filePath, buffer);

    // Crear registro si no existe
    await pool.query(
      `INSERT INTO requisitos_usuario (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    // Marcar requisito como true
    await pool.query(
      `UPDATE requisitos_usuario
       SET ${requisito} = true
       WHERE user_id = $1`,
      [userId]
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e.message || "Error interno" },
      { status: 500 }
    );
  }
}
