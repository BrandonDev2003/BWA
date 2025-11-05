import nodemailer from "nodemailer";

export async function enviarCorreoNuevoUsuario(destinatario: string, nombre: string, correo: string, password: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const linkSistema = "https://tusistema.com/login";

  await transporter.sendMail({
    from: `"CRM Blackwood" <${process.env.SMTP_USER}>`,
    to: destinatario,
    subject: "Tu cuenta de acceso al CRM",
    html: `
      <h2>Hola ${nombre}, ¡bienvenido a CRM Blackwood!</h2>
      <p>Se ha creado tu cuenta como <b>Asesor</b>.</p>
      <ul>
        <li><b>Correo:</b> ${correo}</li>
        <li><b>Contraseña:</b> ${password}</li>
      </ul>
      <p>Puedes ingresar al sistema aquí:</p>
      <a href="${linkSistema}" target="_blank" style="background:#6b21a8;color:white;padding:10px 15px;border-radius:6px;text-decoration:none;">Ingresar al CRM</a>
      <p style="margin-top:20px;">Por seguridad, cambia tu contraseña al iniciar sesión.</p>
    `,
  });
}
