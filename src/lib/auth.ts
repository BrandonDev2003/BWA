import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

// 🧩 Verificar JWT
export function verifyToken(token: string): UserPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "string") return null;
    return decoded as UserPayload;
  } catch (err) {
    console.error("Error verificando token:", err);
    return null;
  }
}
