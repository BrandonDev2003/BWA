import { cookies } from "next/headers";

export async function getUser() {

  const cookieStore = await cookies();

  const correo = cookieStore.get("otp_correo")?.value;

  return correo;
}