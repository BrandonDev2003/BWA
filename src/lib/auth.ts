import bcrypt from "bcrypt";
import jwt, { JwtPayload, SignOptions, Secret } from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET as Secret;

export interface UserPayload extends JwtPayload {
  id: number;
  nombre_completo: string;
  correo: string;
  rol: string;
  puede_ver_todo?: boolean;
}

// 🔐 Comparar contraseñas
export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// 🔒 Hashear contraseña
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

// 🎫 Firmar JWT
export function signToken(payload: Omit<UserPayload, keyof JwtPayload>) {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// 🧩 Verificar JWT
export function verifyToken(token: string): UserPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "string") return null;
    return decoded as UserPayload;
  } catch {
    return null;
  }
}

/**
 * ✅ Retorna sesión mínima: { userId }
 * Asume que guardas el JWT en una cookie llamada "token"
 * (si tu cookie se llama diferente, cambia el nombre aquí)
 */
export async function getUserSession(): Promise<{ userId: number } | null> {
  const cookieStore = await cookies(); // ✅ aquí el fix
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded?.id) return null;

  return { userId: decoded.id };
}