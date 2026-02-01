import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export type SessionUser = {
  id: number;
  email?: string;
  rol: string;
};

export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return null;

    const user = verifyToken(token);
    if (!user) return null;

    return {
      id: Number(user.id),
      email: user.email,
      rol: String(user.rol).toLowerCase(),
    };
  } catch (e) {
    console.error("getSessionUser error:", e);
    return null;
  }
}
