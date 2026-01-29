import { NextRequest, NextResponse } from "next/server";

function decodeJwt(token: string) {
  try {
    const payload = token.split(".")[1];
    const json = Buffer.from(payload, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value; // ✅ tu cookie real
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const payload = decodeJwt(token);
    if (!payload?.correo) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // En tu token guardas nombre_completo/correo/rol (según tu login)
    // Si luego lo cambias a "nombre", ajusta aquí.
    const user = {
      id: payload.id,
      nombre: payload.nombre_completo || payload.nombre || "",
      correo: payload.correo || "",
      rol: payload.rol || "",
    };

    return NextResponse.json({ ok: true, user }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
        