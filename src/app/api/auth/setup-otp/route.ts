import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { query } from "@/lib/db";

export async function GET() {

  const correo = "areadereunion@gmail.com";

  // generar secret único
  const secret = speakeasy.generateSecret({
    length: 20,
    name: `Blackwood Alliance (${correo})`,
  });

  // generar QR
  const qr = await QRCode.toDataURL(secret.otpauth_url!);

  // guardar secret en la base de datos
  await query(
    "UPDATE users SET totp_secret=$1, totp_enabled=true WHERE correo=$2",
    [secret.base32, correo]
  );

  return NextResponse.json({
    correo,
    secret: secret.base32,
    qr
  });
}