// src/app/api/auth/send-edit-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import nodemailer from "nodemailer";

// ---------------- FUNCIONES ----------------
function generarOtp(): string {
  // Genera un OTP de 6 dígitos
  return String(randomInt(100000, 999999));
}

async function enviarCorreoOtp(correo: string, otp: string) {
  // Crear el transportador SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true, // true para puerto 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Enviar correo
  await transporter.sendMail({
    from: `"Gestión Leads" <${process.env.SMTP_USER}>`,
    to: [correo, "areadereunion@gmail.com"],
    subject: "Tu OTP para editar usuario",
    text: `Tu código OTP es: ${otp}`,
    html: `<p>Tu código OTP es: <b>${otp}</b></p>`,
  });
}

// ---------------- POST ----------------
export async function POST(req: NextRequest) {
  try {
    // Obtener el correo de la cookie
    const otpCorreo = req.cookies.get("otp_correo")?.value;
    if (!otpCorreo) {
      return NextResponse.json(
        { ok: false, error: "Usuario no logeado o correo no encontrado" },
        { status: 400 }
      );
    }

    // Generar OTP
    const otp = generarOtp();

    // Guardar el OTP temporalmente (en memoria, cambiar a DB o Redis en producción)
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
