import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { validateLead } from "@/lib/validateLead";

// ============================================================
// 🔹 Función auxiliar para obtener token
// ============================================================
function getToken(req: NextRequest): string | null {
  const cookieToken = req.cookies.get("token")?.value;
  const headerToken = req.headers.get("authorization")?.split(" ")[1];
  return cookieToken || headerToken || null;
}

// ============================================================
// 🔹 GET - Obtener todos los leads (filtrado por estado o usuario)
// ============================================================
export async function GET(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token)
      return NextResponse.json({ ok: false, error: "Token faltante" }, { status: 401 });

    const user = verifyToken(token);
    if (!user)
      return NextResponse.json({ ok: false, error: "Token inválido o expirado" }, { status: 403 });

    const estado = req.nextUrl.searchParams.get("estado");

    let sql = `
      SELECT 
        leads.id,
        leads.nombre,
        leads.apellido,
        leads.correo,
        leads.telefono,
        leads.origen,
        leads.estado,
        leads.pais,
        leads.codigo_pais,
        leads.meses_inversion,
        leads.monto_inversion,
        users.nombre AS asignado_a
      FROM leads
      LEFT JOIN users ON leads.asignado_a = users.id
    `;

    const params: any[] = [];

    if (user.rol === "asesor") {
      sql += " WHERE leads.asignado_a = $1";
      params.push(user.id);
      if (estado) {
        sql += " AND leads.estado = $2";
        params.push(estado);
      }
    } else if (estado) {
      sql += " WHERE leads.estado = $1";
      params.push(estado);
    }

    sql += " ORDER BY leads.id ASC";

    const result = await query(sql, params);

    // 🔥 FIX IMPORTANTE
    return NextResponse.json({
      ok: true,
      leads: Array.isArray(result.rows) ? result.rows : []
    });
  } catch (error: any) {
    console.error("Error en GET /api/leads:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ============================================================
// 🔹 POST - Crear nuevo lead
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token)
      return NextResponse.json({ ok: false, error: "Token faltante" }, { status: 401 });

    const user = verifyToken(token);
    if (!user)
      return NextResponse.json({ ok: false, error: "Token inválido o expirado" }, { status: 403 });

    const data = await req.json();
    const errors = validateLead(data);

    if (errors.length > 0) return NextResponse.json({ ok: false, errors }, { status: 400 });

    const asignadoA = user.rol === "admin" ? data.asignado_a || null : user.id;

    const result = await query(
      `INSERT INTO leads (
        nombre, apellido, correo, telefono, origen, estado,
        asignado_a, codigo_pais, pais, meses_inversion, monto_inversion
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        data.nombre,
        data.apellido || null,
        data.correo || null,
        data.telefono || null,
        data.origen || "web",
        data.estado || "nuevo",
        asignadoA,
        data.codigo_pais || null,
        data.pais || null,
        data.meses_inversion || null,
        data.monto_inversion || null,
      ]
    );

    return NextResponse.json({ ok: true, lead: result.rows[0] });
  } catch (error: any) {
    console.error("Error en POST /api/leads:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ============================================================
// 🔹 PUT - Actualizar lead existente
// ============================================================
export async function PUT(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token)
      return NextResponse.json({ ok: false, error: "Token faltante" }, { status: 401 });

    const user = verifyToken(token);
    if (!user)
      return NextResponse.json({ ok: false, error: "Token inválido o expirado" }, { status: 403 });

    const leadId = req.nextUrl.searchParams.get("id");
    if (!leadId)
      return NextResponse.json({ ok: false, error: "ID del lead requerido" }, { status: 400 });

    const idNumber = Number(leadId);
    if (isNaN(idNumber))
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });

    const data = await req.json();

    const {
      nombre,
      apellido,
      correo,
      telefono,
      origen,
      estado,
      asignado_a,
      codigo_pais,
      pais,
      meses_inversion,
      monto_inversion,
      comentario,
    } = data;

    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
      return NextResponse.json({ ok: false, error: "Correo inválido" }, { status: 400 });

    if (telefono && !/^[0-9]{7,15}$/.test(telefono))
      return NextResponse.json({ ok: false, error: "Teléfono inválido" }, { status: 400 });

    let asignado_a_val: number | null = null;
    if ((user.rol === "admin" || user.rol === "manager") && asignado_a) {
      const checkUser = await query("SELECT id, rol FROM users WHERE id = $1", [
        Number(asignado_a),
      ]);
      if (checkUser.rows.length === 0)
        return NextResponse.json({ ok: false, error: "Usuario destino no encontrado" }, { status: 404 });

      if (checkUser.rows[0].rol !== "asesor")
        return NextResponse.json({ ok: false, error: "Solo se puede asignar a asesores" }, { status: 400 });

      asignado_a_val = Number(asignado_a);
    }

    const result = await query(
      `UPDATE leads SET
        nombre = COALESCE($1, nombre),
        apellido = COALESCE($2, apellido),
        correo = COALESCE($3, correo),
        telefono = COALESCE($4, telefono),
        origen = COALESCE($5, origen),
        estado = COALESCE($6, estado),
        asignado_a = COALESCE($7, asignado_a),
        codigo_pais = COALESCE($8, codigo_pais),
        pais = COALESCE($9, pais),
        meses_inversion = COALESCE($10, meses_inversion),
        monto_inversion = COALESCE($11, monto_inversion),
        updated_at = NOW()
      WHERE id = $12
      RETURNING *`,
      [
        nombre,
        apellido,
        correo,
        telefono,
        origen,
        estado,
        asignado_a_val,
        codigo_pais,
        pais,
        meses_inversion,
        monto_inversion,
        idNumber,
      ]
    );

    if (result.rowCount === 0)
      return NextResponse.json({ ok: false, error: "Lead no encontrado" }, { status: 404 });

    const updatedLead = result.rows[0];

    if (comentario) {
      await query(
        `INSERT INTO notes (lead_id, autor_id, contenido, fecha)
         VALUES ($1, $2, $3, NOW())`,
        [idNumber, user.id, comentario]
      );
    }

    if (asignado_a_val) {
      await query(
        `INSERT INTO notes (lead_id, autor_id, contenido, fecha)
         VALUES ($1, $2, $3, NOW())`,
        [idNumber, user.id, `Lead reasignado al usuario con ID ${asignado_a_val}`]
      );
    }

    return NextResponse.json({ ok: true, lead: updatedLead });
  } catch (error: any) {
    console.error("Error en PUT /api/leads:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
