import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

type OtpData = {
  code: string;
  expires: number;
};

declare global {
  var EDIT_OTPS: Record<string, OtpData>;
}

export async function POST(req: NextRequest) {

  try {

    const { otp } = await req.json();

    if (!otp) {
      return NextResponse.json(
        { ok: false, error: "OTP requerido" },
        { status: 400 }
      );
    }

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Usuario no logeado" },
        { status: 401 }
      );
    }

    let payload: any;

    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Token inválido" },
        { status: 401 }
      );
    }

    const correo = payload.correo;

    if (!correo) {
      return NextResponse.json(
        { ok: false, error: "Correo no encontrado en token" },
        { status: 400 }
      );
    }

    if (!globalThis.EDIT_OTPS) {
      globalThis.EDIT_OTPS = {};
    }

    const data = globalThis.EDIT_OTPS[correo];

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "OTP no encontrado" },
        { status: 400 }
      );
    }

    if (Date.now() > data.expires) {
      delete globalThis.EDIT_OTPS[correo];

      return NextResponse.json(
        { ok: false, error: "OTP expirado" },
        { status: 400 }
      );
    }

    if (data.code !== otp) {
      return NextResponse.json(
        { ok: false, error: "OTP incorrecto" },
        { status: 400 }
      );
    }

    // OTP válido
    delete globalThis.EDIT_OTPS[correo];

    return NextResponse.json({
      ok: true,
      message: "OTP verificado correctamente"
    });

  } catch (error) {

    console.error("verify-edit-otp error:", error);

    return NextResponse.json(
      { ok: false, error: "Error verificando OTP" },
      { status: 500 }
    );

  }

}