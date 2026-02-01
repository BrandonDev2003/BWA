import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs/promises";

function getToken(req: NextRequest) {
  return req.cookies.get("token")?.value || null;
}

function verifyToken(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no configurado");
  return jwt.verify(token, secret) as any;
}

function isAdminRole(rol: string) {
  return (
    rol === "admin" ||
    rol === "administrador" ||
    rol === "Administrador" ||
    rol === "RRHH" ||
    rol === "SpA" ||
    rol === "spa"
  );
}

// ✅ helper para guardar archivos en /public/uploads
async function saveUpload(file: File, folder = "uploads") {
  const maxBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxBytes) throw new Error("Archivo demasiado grande (máx 10MB)");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", folder);
  await fs.mkdir(uploadDir, { recursive: true });

  const safeName = file.name
    .replaceAll("..", "")
    .replaceAll("/", "_")
    .replaceAll("\\", "_")
    .trim();

  const ext = path.extname(safeName);
  const base = path.basename(safeName, ext) || "archivo";
  const filename = `${base}-${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;

  await fs.writeFile(path.join(uploadDir, filename), buffer);

  return {
    url: `/${folder}/${filename}`,
    originalName: file.name,
    mime: file.type,
  };
}

export async function GET(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const decoded = verifyToken(token);

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.contenido,
        p.created_at,
        p.user_id AS author_id,
        u.nombre AS author_nombre,
        u.rol AS author_rol,

        p.image_url,
        p.document_url,
        p.document_name,

        -- ✅ contadores por reacción
        COUNT(*) FILTER (WHERE pr.reaction = 'like')::int    AS likes,
        COUNT(*) FILTER (WHERE pr.reaction = 'love')::int    AS loves,
        COUNT(*) FILTER (WHERE pr.reaction = 'dislike')::int AS dislikes,
        COUNT(*) FILTER (WHERE pr.reaction = 'haha')::int    AS hahas,

        -- ✅ mi reacción (0 o 1 valor)
        MAX(pr_me.reaction) AS my_reaction,

        -- ✅ usuarios por cada reacción (máx 30)
        COALESCE((
          SELECT json_agg(x.nombre ORDER BY x.nombre)
          FROM (
            SELECT u2.nombre
            FROM post_reactions pr2
            JOIN users u2 ON u2.id = pr2.user_id
            WHERE pr2.post_id = p.id AND pr2.reaction = 'like'
            ORDER BY u2.nombre
            LIMIT 30
          ) x
        ), '[]'::json) AS like_users,

        COALESCE((
          SELECT json_agg(x.nombre ORDER BY x.nombre)
          FROM (
            SELECT u2.nombre
            FROM post_reactions pr2
            JOIN users u2 ON u2.id = pr2.user_id
            WHERE pr2.post_id = p.id AND pr2.reaction = 'love'
            ORDER BY u2.nombre
            LIMIT 30
          ) x
        ), '[]'::json) AS love_users,

        COALESCE((
          SELECT json_agg(x.nombre ORDER BY x.nombre)
          FROM (
            SELECT u2.nombre
            FROM post_reactions pr2
            JOIN users u2 ON u2.id = pr2.user_id
            WHERE pr2.post_id = p.id AND pr2.reaction = 'dislike'
            ORDER BY u2.nombre
            LIMIT 30
          ) x
        ), '[]'::json) AS dislike_users,

        COALESCE((
          SELECT json_agg(x.nombre ORDER BY x.nombre)
          FROM (
            SELECT u2.nombre
            FROM post_reactions pr2
            JOIN users u2 ON u2.id = pr2.user_id
            WHERE pr2.post_id = p.id AND pr2.reaction = 'haha'
            ORDER BY u2.nombre
            LIMIT 30
          ) x
        ), '[]'::json) AS haha_users,

        -- ✅ conteo comentarios
        (
          SELECT COUNT(*)::int
          FROM post_comments pc
          WHERE pc.post_id = p.id
        ) AS comments_count,

        -- ✅ comentarios (máx 50)
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', c.id,
              'contenido', c.contenido,
              'created_at', c.created_at,
              'user_id', c.user_id,
              'user_nombre', cu.nombre
            )
            ORDER BY c.created_at ASC
          )
          FROM (
            SELECT *
            FROM post_comments
            WHERE post_id = p.id
            ORDER BY created_at ASC
            LIMIT 50
          ) c
          JOIN users cu ON cu.id = c.user_id
        ), '[]'::json) AS comments

      FROM posts p
      JOIN users u ON u.id = p.user_id

      -- reacciones para contar
      LEFT JOIN post_reactions pr ON pr.post_id = p.id

      -- mi reacción (solo del usuario logueado)
      LEFT JOIN post_reactions pr_me
        ON pr_me.post_id = p.id AND pr_me.user_id = $1

      GROUP BY
        p.id,
        p.contenido,
        p.created_at,
        p.user_id,
        u.id,
        u.nombre,
        u.rol,
        p.image_url,
        p.document_url,
        p.document_name

      ORDER BY p.created_at DESC
      LIMIT 50
      `,
      [decoded.id]
    );

    return NextResponse.json({
      ok: true,
      posts: result.rows,
      me: { id: decoded.id, rol: decoded.rol },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!isAdminRole(decoded.rol)) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
    }

    const formData = await req.formData();
    const contenido = String(formData.get("contenido") || "").trim();
    const imagen = formData.get("imagen");
    const documento = formData.get("documento");

    if (!contenido && !(imagen instanceof File) && !(documento instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Contenido o archivo requerido" },
        { status: 400 }
      );
    }

    let image_url: string | null = null;
    let document_url: string | null = null;
    let document_name: string | null = null;

    if (imagen instanceof File && imagen.size > 0) {
      if (!imagen.type.startsWith("image/")) {
        return NextResponse.json({ ok: false, error: "La imagen no es válida" }, { status: 400 });
      }
      const saved = await saveUpload(imagen);
      image_url = saved.url;
    }

    if (documento instanceof File && documento.size > 0) {
      const saved = await saveUpload(documento);
      document_url = saved.url;
      document_name = saved.originalName;
    }

    const result = await pool.query(
      `
      INSERT INTO posts (user_id, contenido, image_url, document_url, document_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, contenido, created_at, image_url, document_url, document_name
      `,
      [decoded.id, contenido, image_url, document_url, document_name]
    );

    return NextResponse.json({ ok: true, post: result.rows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
