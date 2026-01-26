import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { pool } from "@/lib/db";

export async function PUT(req: NextRequest) {
  try {
    // Extraemos el id desde la URL
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1]; // último segmento

    if (!id) {
      return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
    }

    const body = await req.json();

    const allowedFields = [
      "nombre",
      "correo",
      "cedula",
      "rol",
      "password",
      "foto_asesor",
      "cedula_frontal",
      "cedula_reverso",
    ];

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined && body[field] !== null) {
        if (field === "password" && body[field].trim() !== "") {
          const hashed = await bcrypt.hash(body[field], 10);
          fieldsToUpdate.push(field);
          values.push(hashed);
        } else if (field !== "password") {
          fieldsToUpdate.push(field);
          values.push(body[field]);
        }
      }
    }

    if (fieldsToUpdate.length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    const setClause = fieldsToUpdate.map((f, i) => `${f}=$${i + 1}`).join(", ");
    const query = `UPDATE users SET ${setClause} WHERE id=$${values.length + 1} RETURNING *`;
    values.push(id);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (err: any) {
    console.error("Error real actualizando usuario:", err);
    return NextResponse.json(
      { error: err.message || "Error actualizando usuario" },
      { status: 500 }
    );
  }
}
