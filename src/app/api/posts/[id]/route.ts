import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import jwt from "jsonwebtoken";

function getToken(req: NextRequest) {
  return req.cookies.get("token")?.value || null;
}
function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET || "") as any;
}
function isAdminRole(rol: string) {
  return rol === "admin" || rol === "administrador" || rol === "Administrador";
}

function extractIdFromUrl(req: NextRequest) {
  const segments = req.nextUrl.pathname.split("/");
  const id = Number(segments.pop());
  if (Number.isNaN(id)) throw new Error("ID inválido");
  return id;
}

export async function DELETE(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

    const decoded = verifyToken(token);
    const postId = extractIdFromUrl(req);

    const found = await pool.query(`SELECT user_id FROM posts WHERE id=$1`, [postId]);
    if (!found.rows.length) {
      return NextResponse.json({ ok: false, error: "No existe" }, { status: 404 });
    }

    const authorId = found.rows[0].user_id;

    if (!isAdminRole(decoded.rol) && decoded.id !== authorId) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
    }

    await pool.query(`DELETE FROM posts WHERE id=$1`, [postId]); // cascades reactions/comments
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ ok: false, error: err.message || "Error interno" }, { status: 500 });
  }
}
