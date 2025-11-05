import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { destinatario, nombre, correo, password } = await req.json();

    if (!destinatario || !nombre || !correo || !password) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const linkSistema = "https://tusistema.com/login";

    const html = `
      <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f1f5f9; padding: 20px; border-radius: 10px; max-width: 500px; margin: auto; border: 1px solid #312e81;">
        <h2 style="text-align: center; color: #a855f7;">🚀 Bienvenido a CRM Blackwood</h2>
        <p>Hola <b>${nombre}</b>, se ha creado tu cuenta como <b>Asesor</b>.</p>
        <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin-top: 10px;">
          <p><b>Correo:</b> ${correo}</p>
          <p><b>Contraseña:</b> ${password}</p>
        </div>
        <p style="margin-top: 20px;">Accede al sistema aquí:</p>
        <a href="${linkSistema}" target="_blank"
           style="display:inline-block;background:#7e22ce;color:white;padding:10px 15px;border-radius:6px;text-decoration:none;font-weight:bold;">
           Ingresar al CRM
        </a>
        <p style="margin-top:25px;font-size:14px;color:#94a3b8;">
          🔒 Por seguridad, cambia tu contraseña al iniciar sesión.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"CRM Blackwood" <${process.env.SMTP_USER}>`,
      to: destinatario,
      subject: "Tu cuenta de acceso al CRM Blackwood",
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error al enviar correo:", error);
    return NextResponse.json({ error: "Error al enviar correo" }, { status: 500 });
  }
}
