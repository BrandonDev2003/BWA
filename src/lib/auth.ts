import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key";

export interface UserPayload extends JwtPayload {
  id: number;
  nombre_completo: string;
  correo: string;
  rol: string;
  puede_ver_todo?: boolean;
}

// 🔐 Compara contraseñas
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// 🔒 Genera un hash seguro para nuevos usuarios
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// 🎫 Firma un token JWT
export function signToken(payload: Omit<UserPayload, keyof JwtPayload>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" }); // 7 días de validez
}

// 🧩 Verifica y decodifica un token JWT
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
