import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import nodemailer from "nodemailer";

function generarOtp(): string {
  return String(randomInt(100000, 999999));
}

// Función para enviar correo con Nodemailer
async function enviarCorreoOtp(correo: string, otp: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true, // true para 465, false para otros puertos
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Gestión Leads" <${process.env.SMTP_USER}>`,
    to: correo,
    subject: "Tu código OTP para editar usuario",
    text: `Tu código OTP es: ${otp}`,
    html: `<p>Tu código OTP es: <b>${otp}</b></p>`,
  });
}

export async function POST(req: NextRequest) {
  try {
    const otpCorreo = req.cookies.get("otp_correo")?.value;
    if (!otpCorreo) {
      return NextResponse.json(
        { ok: false, error: "Usuario no logeado o correo no encontrado" },
        { status: 400 }
      );
    }

    const otp = generarOtp();

    // Guardar OTP en memoria (temporal)
    globalThis.EDIT_OTPS = globalThis.EDIT_OTPS || {};
    globalThis.EDIT_OTPS[otpCorreo] = otp;

    // Enviar OTP por correo
    await enviarCorreoOtp(otpCorreo, otp);

    return NextResponse.json({ ok: true, message: "OTP enviado al correo" });
  } catch (err) {
    console.error("send-edit-otp error:", err);
    return NextResponse.json(
      { ok: false, error: "Error enviando OTP" },
      { status: 500 }
    );
  }
}
