export function generarPassword(longitud = 10) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
  return Array.from(crypto.getRandomValues(new Uint32Array(longitud)))
    .map((x) => chars[x % chars.length])
    .join("");
}
