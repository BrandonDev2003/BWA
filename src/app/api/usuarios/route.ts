import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query("SELECT id, nombre, email, rol FROM usuarios");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}
