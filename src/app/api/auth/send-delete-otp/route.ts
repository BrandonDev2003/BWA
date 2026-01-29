import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { correo } = body;

    if (!correo) {
      return NextResponse.json({ ok: false, error: "Correo requerido" });
    }

    // Generar OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Guardar OTP temporalmente
    globalThis.DELETE_OTPS = globalThis.DELETE_OTPS || {};
    globalThis.DELETE_OTPS[correo] = otp;

    console.log("OTP enviado:", otp);

    return NextResponse.json({ ok: true, message: "OTP enviado al correo" });
  } catch {
    return NextResponse.json({ ok: false, error: "Error enviando OTP" });
  }
}
