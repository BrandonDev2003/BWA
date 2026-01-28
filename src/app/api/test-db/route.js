import { query } from "@/lib/db";

export async function GET() {
  try {
    const r = await query("SELECT NOW() as now");
    return Response.json({ ok: true, now: r.rows[0].now });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
