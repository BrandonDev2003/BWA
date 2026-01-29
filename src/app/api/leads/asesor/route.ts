import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

function getTokenFromCookie(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match?.[1] || null;
}

function getUserFromToken(token: string) {
  const payloadBase64 = token.split(".")[1];
  if (!payloadBase64) return null;

  const decodedJson = Buffer.from(payloadBase64, "base64").toString("utf8");
  return JSON.parse(decodedJson);
}

export async function GET(req: Request) {
  try {
    const token = getTokenFromCookie(req);

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = getUserFromToken(token);
    if (!user?.id) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT * FROM leads WHERE asignado_a = $1 ORDER BY id DESC`,
      [user.id]
    );

    return NextResponse.json({ ok: true, leads: result.rows });
  } catch (error: any) {
    console.error("⛔ Error cargando leads:", error);
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const token = getTokenFromCookie(req);

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = getUserFromToken(token);
    if (!user?.id) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // ✅ asignado_a automático
    const asignado_a = user.id;

    // ✅ origen automático = nombre del usuario
    const origen = (user?.nombre || "Asesor").toString().trim().slice(0, 50);

    const body = await req.json().catch(() => ({}));

    // Obligatorios
    const nombre = (body?.nombre || "").toString().trim();
    const telefono = (body?.telefono || "").toString().trim();

    if (!nombre || !telefono) {
      return NextResponse.json(
        { error: "Nombre y Teléfono son obligatorios" },
        { status: 400 }
      );
    }

    // Opcionales
    const apellido = (body?.apellido || "").toString().trim() || null;
    const correo = (body?.correo || "").toString().trim() || null;

    const estado = (body?.estado || "Nuevo").toString().trim();

    // ✅ Ecuador por defecto
    let codigo_pais = (body?.codigo_pais || "+593").toString().trim();
    let pais = (body?.pais || "Ecuador").toString().trim();

    // ✅ limpiar codigo_pais
    codigo_pais = codigo_pais.replace(/[^\d+]/g, "");

    // ✅ validar varchar(10)
    if (codigo_pais.length > 10) {
      return NextResponse.json(
        { error: "El código de país es demasiado largo (máx 10 caracteres)" },
        { status: 400 }
      );
    }
    codigo_pais = codigo_pais.slice(0, 10);

    // ✅ cortar pais por seguridad (ajusta si tu columna es más corta)
    pais = pais.slice(0, 50);

    const meses_inversion = Number(body?.meses_inversion) || 0;
    const monto_inversion = Number(body?.monto_inversion) || 0;

    const insert = await pool.query(
      `
      INSERT INTO leads (
        asignado_a,
        origen,
        nombre,
        apellido,
        telefono,
        correo,
        estado,
        codigo_pais,
        pais,
        meses_inversion,
        monto_inversion
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
      `,
      [
        asignado_a,
        origen,
        nombre,
        apellido,
        telefono,
        correo,
        estado,
        codigo_pais,
        pais,
        meses_inversion,
        monto_inversion,
      ]
    );

    return NextResponse.json({ ok: true, lead: insert.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("⛔ Error creando lead:", error);
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
