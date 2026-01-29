import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await ctx.params;
    const id = Number(idParam);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const {
      nombre,
      correo,
      rol,
      cedula,
      permiso_ver_todo,
      password, // puede venir o no
      foto_asesor,
      cedula_frontal,
      cedula_reverso,
    } = body;

    if (!nombre || !correo || !rol) {
      return NextResponse.json(
        { error: "Faltan campos requeridos (nombre, correo, rol)" },
        { status: 400 }
      );
    }

    const permiso = !!permiso_ver_todo;

    // ✅ Si mandan password, la hasheamos antes de guardar
    let hashedPassword: string | null = null;
    if (password && typeof password === "string" && password.trim().length > 0) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    if (hashedPassword) {
      await pool.query(
        `
        UPDATE users
        SET nombre = $1,
            correo = $2,
            rol = $3,
            cedula = $4,
            permiso_ver_todo = $5,
            password = $6,
            foto_asesor = COALESCE($7, foto_asesor),
            cedula_frontal = COALESCE($8, cedula_frontal),
            cedula_reverso = COALESCE($9, cedula_reverso)
        WHERE id = $10
        `,
        [
          nombre,
          correo,
          rol,
          cedula || null,
          permiso,
          hashedPassword,
          foto_asesor || null,
          cedula_frontal || null,
          cedula_reverso || null,
          id,
        ]
      );
    } else {
      await pool.query(
        `
        UPDATE users
        SET nombre = $1,
            correo = $2,
            rol = $3,
            cedula = $4,
            permiso_ver_todo = $5,
            foto_asesor = COALESCE($6, foto_asesor),
            cedula_frontal = COALESCE($7, cedula_frontal),
            cedula_reverso = COALESCE($8, cedula_reverso)
        WHERE id = $9
        `,
        [
          nombre,
          correo,
          rol,
          cedula || null,
          permiso,
          foto_asesor || null,
          cedula_frontal || null,
          cedula_reverso || null,
          id,
        ]
      );
    }

    const result: any = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, user: result.rows[0] }, { status: 200 });
  } catch (error: any) {
    console.error("Error editando usuario:", error);
    return NextResponse.json(
      { error: "Error interno editando usuario" },
      { status: 500 }
    );
  }
}
