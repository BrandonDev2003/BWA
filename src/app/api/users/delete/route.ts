// src/app/api/auth/send-delete-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { pool } from "@/lib/db";
console.log("ENV_CHECK", {
  HOST: process.env.SMTP_HOST,
  PORT: process.env.SMTP_PORT,
  USER: process.env.SMTP_USER,
  PASS: process.env.SMTP_PASS,
});


export async function POST(req: NextRequest) {
  try {
    // 1. Obtener correo desde cookie (igual que edit)
    const otpCorreo = req.cookies.get("otp_correo")?.value;

    if (!otpCorreo) {
      return NextResponse.json(
        { error: "No se encontró el correo en la sesión" },
        { status: 400 }
      );
    }

    // 2. Verificar usuario
    const userQuery = await pool.query(
      "SELECT * FROM users WHERE correo = $1",
      [otpCorreo]
    );

    if (userQuery.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // 3. Generar OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Guardar OTP en memoria temporal (igual que edit)
    globalThis.DELETE_OTPS = globalThis.DELETE_OTPS || {};
    globalThis.DELETE_OTPS[otpCorreo] = otp;

    // 5. Transportador SMTP (igual que edit)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 6. Enviar correo
    await transporter.sendMail({
      from: `"Gestión Leads" <${process.env.SMTP_USER}>`,
      to: otpCorreo,
      subject: "Código OTP para eliminar usuario",
      text: `Tu código para eliminar tu cuenta es: ${otp}`,
      html: `<p>Tu código para eliminar tu cuenta es: <b>${otp}</b></p>`,
    });

    return NextResponse.json({ ok: true, message: "OTP enviado" });
  } catch (error) {
    console.error("Error enviando OTP:", error);
    return NextResponse.json(
      { error: "Error enviando OTP" },
      { status: 500 }
    );
  }
}
