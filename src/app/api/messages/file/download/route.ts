import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const filePath = searchParams.get("path");
  const filename = searchParams.get("name");

  if (!filePath || !filename) {
    return new NextResponse("Faltan parámetros", {
      status: 400,
    });
  }

  const absolutePath = path.join(
    process.cwd(),
    "public",
    filePath
  );

  if (!fs.existsSync(absolutePath)) {
    return new NextResponse("Archivo no encontrado", {
      status: 404,
    });
  }

  const fileBuffer = fs.readFileSync(absolutePath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
