// src/app/api/auth/send-delete-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { correo } = await req.json();

    if (!correo) {
      return NextResponse.json({ error: "Correo requerido" }, { status: 400 });
    }

    // 1. Generar OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Guardar OTP en memoria temporal
    globalThis.DELETE_OTPS = globalThis.DELETE_OTPS || {};
    globalThis.DELETE_OTPS[correo] = otp;

    // 3. Transporter con tus variables .env correctas
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true, // obligatorio para puerto 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: correo,
      subject: "Código para eliminar tu usuario",
      text: `Tu código para eliminar tu cuenta es: ${otp}`,
    });

    return NextResponse.json({ ok: true, message: "OTP enviado" });
  } catch (error: any) {
    console.error("Error enviando OTP:", error);
    return NextResponse.json(
      { error: "Error enviando OTP" },
      { status: 500 }
    );
  }
}
