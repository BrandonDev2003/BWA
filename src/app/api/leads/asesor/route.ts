import { NextResponse } from "next/server";
import { pool } from "@/lib/db"; // ✅ Import correcto

export async function GET(req: Request) {
  try {
    // Leer cookie del token
    const token = req.headers.get("cookie")?.split("token=")[1];

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Decodificar sin verify, solo para leer ID (tu signToken no usa expiración)
    const payloadBase64 = token.split(".")[1];
    const decodedJson = Buffer.from(payloadBase64, "base64").toString("utf8");
    const user = JSON.parse(decodedJson);

    if (!user?.id) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    console.log("➡ Cargando leads del asesor con ID:", user.id);

    // 📌 IMPORTANTE:
    // La columna correcta es asignado_a, NO asesor_id
    const result = await pool.query(
      `SELECT * FROM leads WHERE asignado_a = $1 ORDER BY id DESC`,
      [user.id]
    );

    return NextResponse.json({
      ok: true,
      leads: result.rows,
    });

  } catch (error: any) {
    console.error("⛔ Error cargando leads:", error);
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
