import { NextResponse } from "next/server";
import { initSocket } from "@/lib/socket";

export async function GET(req: Request) {
  //@ts-ignore
  const server = (global as any).server;

  if (!server) {
    console.log("🟡 Guardando servidor HTTP...");

    //@ts-ignore
    (global as any).server = (req as any).socket?.server;
  }

  //@ts-ignore
  initSocket((global as any).server);

  return NextResponse.json({ ok: true });
}
