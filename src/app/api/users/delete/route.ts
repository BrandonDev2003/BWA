import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function DELETE(req: NextRequest) {
  const client = await pool.connect();

  try {
    const body = await req.json().catch(() => ({}));
    const { correo, otp } = body as { correo?: string; otp?: string };

    if (!correo || !otp) {
      return NextResponse.json(
        { ok: false, error: "Correo y OTP requeridos" },
        { status: 400 }
      );
    }

    // ✅ Validar OTP guardado en memoria
    const saved = globalThis.DELETE_OTPS?.[correo];
    if (!saved || saved !== otp) {
      return NextResponse.json(
        { ok: false, error: "OTP inválido o expirado" },
        { status: 401 }
      );
    }

    // ✅ Buscar el usuario por correo para obtener su ID
    const userRes = await client.query(
      "SELECT id FROM users WHERE correo = $1",
      [correo]
    );

    const id = userRes.rows[0]?.id;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    await client.query("BEGIN");

    // ✅ Borrar mensajes
    await client.query("DELETE FROM messages WHERE sender_id = $1", [id]);
    // Si tienes receiver_id, descomenta:
    // await client.query("DELETE FROM messages WHERE receiver_id = $1", [id]);

    // ✅ Borrar usuario
    await client.query("DELETE FROM users WHERE id = $1", [id]);

    await client.query("COMMIT");

    // ✅ limpiar OTP
    if (globalThis.DELETE_OTPS) delete globalThis.DELETE_OTPS[correo];

    return NextResponse.json({ ok: true, message: "Usuario eliminado" });
  } catch (error: any) {
    try {
      await client.query("ROLLBACK");
    } catch {}

    console.error("Error eliminando usuario:", error);

    return NextResponse.json(
      { ok: false, error: "Error eliminando usuario", detail: error?.detail || String(error) },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
