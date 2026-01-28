import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const asesorId = searchParams.get("asesor");

    let where = "";
    let params: any[] = [];

    if (asesorId) {
      where = "WHERE asignado_a = $1";
      params.push(Number(asesorId));
    }

    // Total
    const total = await query(
      `SELECT COUNT(*) FROM leads ${where}`,
      params
    );

    // Pendientes (pendiente + nuevo)
    const pendientes = await query(
      `SELECT COUNT(*) FROM leads 
        ${where ? `${where} AND` : "WHERE"} 
        (estado = 'pendiente' OR estado = 'Nuevo')`,
      params
    );

    // Contactados
    const contactados = await query(
      `SELECT COUNT(*) FROM leads 
        ${where ? `${where} AND` : "WHERE"} 
        estado = 'contactado'`,
      params
    );

    // Cerrados
    const cerrados = await query(
      `SELECT COUNT(*) FROM leads 
        ${where ? `${where} AND` : "WHERE"} 
        estado = 'cerrado'`,
      params
    );

    return NextResponse.json({
      total: Number(total.rows[0].count),
      pendientes: Number(pendientes.rows[0].count),
      contactados: Number(contactados.rows[0].count),
      cerrados: Number(cerrados.rows[0].count),
      gestionados:
        Number(contactados.rows[0].count) +
        Number(cerrados.rows[0].count),
    });

  } catch (e) {
    console.error("ERROR EN STATS:", e);
    return NextResponse.json(
      { error: "Error generando estadísticas" },
      { status: 500 }
    );
  }
}
