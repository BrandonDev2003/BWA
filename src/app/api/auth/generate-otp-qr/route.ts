import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {

    const { userId, correo } = await req.json();

    if (!userId || !correo) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    const secret = speakeasy.generateSecret({
      length: 20,
      name: `CRM:${correo}`,
    });

    // guardar secret en DB
    await query(
      `UPDATE users 
       SET totp_secret = $1, totp_enabled = true 
       WHERE id = $2`,
      [secret.base32, userId]
    );

    const qr = await QRCode.toDataURL(secret.otpauth_url!);

    return NextResponse.json({
      qr,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error generando QR" },
      { status: 500 }
    );
  }
}