// app/api/auth/generate-otp/route.ts

import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { query } from "@/lib/db";

// GET solo para pruebas desde el navegador
export async function GET() {

  const correo = "areadereunion@gmail.com";

  const secret = speakeasy.generateSecret({
    length: 20,
    name: `BlackwoodAlliance:${correo}`,
  });

  const base32 = secret.base32;

  await query(
    "UPDATE users SET totp_secret = $1 WHERE correo = $2",
    [base32, correo]
  );

  const qr = await QRCode.toDataURL(secret.otpauth_url!);

  return NextResponse.json({
    correo,
    secret: base32,
    qr
  });
}