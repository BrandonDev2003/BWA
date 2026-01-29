import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function isAllowedUrl(u: string) {
  try {
    const url = new URL(u);
    // ✅ Solo permitir Cloudinary (seguridad)
    return url.hostname.endsWith("res.cloudinary.com");
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const name = searchParams.get("name") || "archivo";

  if (!url) {
    return NextResponse.json({ ok: false, error: "Missing url" }, { status: 400 });
  }

  if (!isAllowedUrl(url)) {
    return NextResponse.json({ ok: false, error: "URL not allowed" }, { status: 400 });
  }

  try {
    const res = await fetch(url); // server-side: no CORS
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "Upstream fetch failed" }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // ✅ Aquí forzamos nombre real
        "Content-Disposition": `attachment; filename="${encodeURIComponent(name)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("DOWNLOAD ERROR:", e);
    return NextResponse.json({ ok: false, error: "Download error" }, { status: 500 });
  }
}
