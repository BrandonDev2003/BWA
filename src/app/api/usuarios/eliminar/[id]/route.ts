// src/app/api/usuarios/eliminar/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 🔥 params es un Promise → debemos await
    const { id } = await context.params;

    const { otp, correo } = await req.json();

    if (!otp || !correo) {
      return NextResponse.json(
        { error: "OTP y correo requeridos" },
        { status: 400 }
      );
    }

    // Validación OTP en memoria
    globalThis.DELETE_OTPS = globalThis.DELETE_OTPS || {};
    const savedOtp = globalThis.DELETE_OTPS[correo];

    if (!savedOtp || savedOtp !== otp) {
      return NextResponse.json(
        { error: "OTP inválido o expirado" },
        { status: 401 }
      );
    }

    // 1️⃣ Desasignar leads del usuario
    await pool.query(
      "UPDATE leads SET asignado_a = NULL WHERE asignado_a = $1",
      [id]
    );

    // 2️⃣ Eliminar usuario
    await pool.query("DELETE FROM users WHERE id=$1", [id]);

    // 3️⃣ Borrar OTP
    delete globalThis.DELETE_OTPS[correo];

    return NextResponse.json({
      ok: true,
      message: "Usuario eliminado correctamente",
    });
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    return NextResponse.json(
      { error: "Error interno eliminando usuario" },
      { status: 500 }
    );
  }
}
