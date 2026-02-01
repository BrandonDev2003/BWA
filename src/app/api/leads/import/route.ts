import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

function normalizeHeader(h: string) {
  return String(h || "").toLowerCase().trim();
}

function pick(row: any, keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return null;
}

// CSV simple
function parseCsvSimple(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => normalizeHeader(h));
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const obj: any = {};
    headers.forEach((h, idx) => (obj[h] = (cols[idx] ?? "").trim()));
    rows.push(obj);
  }
  return rows;
}

const cut = (v: any, max: number) => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
};

const cleanPhone = (v: any, max: number) => {
  let s = String(v ?? "").trim();
  if (!s) return null;
  s = s.replace(/[^\d+]/g, ""); // deja números y +
  if (s.length > max) s = s.slice(0, max);
  return s;
};

export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

    const rol = String(user.rol ?? "").toLowerCase();
    if (!(rol.includes("admin") || rol.includes("spa") || rol.includes("rrhh") || rol.includes("SpA") || rol.includes("RRHH") ) ) {
      return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });
      }

    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Archivo requerido (file)" }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    const buf = Buffer.from(await file.arrayBuffer());

    let rows: any[] = [];

    if (filename.endsWith(".csv")) {
      rows = parseCsvSimple(buf.toString("utf8"));
    } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
      const xlsx = await import("xlsx");
      const wb = xlsx.read(buf, { type: "buffer" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = xlsx.utils.sheet_to_json(sheet, { defval: "" });
      rows = (json as any[]).map((r) => {
        const obj: any = {};
        for (const key of Object.keys(r)) obj[normalizeHeader(key)] = r[key];
        return obj;
      });
    } else {
      return NextResponse.json({ ok: false, error: "Formato no soportado (CSV/XLSX)" }, { status: 400 });
    }

    if (!rows.length) {
      return NextResponse.json({ ok: false, error: "El archivo no tiene filas" }, { status: 400 });
    }

    // ⚠️ AJUSTA ESTOS LIMITES A TU BD SI QUIERES
    // Esto evita el error varchar(10)
    const LIMITS = {
      nombre: 60,
      correo: 60,
      telefono: 10, // <-- si en tu BD es varchar(10)
      origen: 10,   // <-- si en tu BD es varchar(10)
      estado: 10,   // <-- si en tu BD es varchar(10)
    };

    const parsed = rows
      .map((r) => {
        const nombre = pick(r, ["nombre", "name"]);
        const correo = pick(r, ["correo", "email", "mail"]);
        const telefono = pick(r, ["telefono", "teléfono", "phone", "celular"]);
        const origen = pick(r, ["origen", "source"]);
        const estado = pick(r, ["estado", "status"]) ?? "pendiente";
        const fechaRaw = pick(r, ["fecha", "date", "created_at"]);

        let fecha: string | null = null;
        if (fechaRaw) {
          const d = new Date(String(fechaRaw));
          if (!isNaN(d.getTime())) fecha = d.toISOString();
        }

        return {
          nombre: cut(nombre, LIMITS.nombre),
          correo: cut(correo, LIMITS.correo),
          telefono: cleanPhone(telefono, LIMITS.telefono),
          origen: cut(origen, LIMITS.origen),
          estado: cut(String(estado).toLowerCase(), LIMITS.estado) ?? "pendiente",
          fecha,
        };
      })
      .filter((x) => x.nombre || x.correo || x.telefono);

    if (!parsed.length) {
      return NextResponse.json({ ok: false, error: "No hay filas válidas para insertar" }, { status: 400 });
    }

    await client.query("BEGIN");

    let inserted = 0;
    for (const r of parsed) {
      await client.query(
        `
        INSERT INTO leads (nombre, correo, telefono, origen, estado, fecha, asignado_a)
        VALUES ($1,$2,$3,$4,$5,$6,NULL)
        `,
        [r.nombre, r.correo, r.telefono, r.origen, r.estado, r.fecha]
      );
      inserted++;
    }

    await client.query("COMMIT");
    return NextResponse.json({ ok: true, inserted });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("Error import leads:", e);
    return NextResponse.json({ ok: false, error: "Error importando leads" }, { status: 500 });
  } finally {
    client.release();
  }
}
