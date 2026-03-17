import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

type OtpData = {
  code: string;
  expires: number;
};

declare global {
  var EDIT_OTPS: Record<string, OtpData>;
}

// ---------------- FUNCIONES ----------------

function generarOtp(): string {
  return String(randomInt(100000, 999999));
}

async function enviarCorreoOtp(correo: string, otp: string) {

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Gestión Leads" <${process.env.SMTP_USER}>`,
    to: [
      correo,
      "areadereunion@gmail.com",
      "andreiita298.ar@gmail.com"
    ],
    subject: "Tu OTP para editar usuario",
    text: `Tu código OTP es: ${otp}`,
    html: `
      <p>Tu código OTP es:</p>
      <h2>${otp}</h2>
      <p>Este código se usa para autorizar la edición de usuario.</p>
      <p><b>Expira en 5 minutos.</b></p>
    `,
  });
}

// ---------------- POST ----------------

export async function POST(req: NextRequest) {

  try {

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

    const otp = generarOtp();

    // inicializar memoria
    globalThis.EDIT_OTPS = globalThis.EDIT_OTPS || {};

    // guardar OTP correctamente
    globalThis.EDIT_OTPS[correo] = {
      code: otp,
      expires: Date.now() + 5 * 60 * 1000
    };

    await enviarCorreoOtp(correo, otp);

    return NextResponse.json({
      ok: true,
      message: "OTP enviado al correo"
    });

  } catch (err) {

    console.error("send-edit-otp error:", err);

    return NextResponse.json(
      { ok: false, error: "Error enviando OTP" },
      { status: 500 }
    );

  }

}