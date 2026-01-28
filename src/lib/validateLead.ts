// src/lib/validateLead.ts
export function validateLead(data: any) {
  const errors: string[] = [];

  // Nombre (solo si viene)
  if (data.nombre !== undefined && data.nombre.trim().length < 3) {
    errors.push("El nombre debe tener al menos 3 caracteres.");
  }

  // Correo (solo si viene)
  if (data.correo) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.correo)) {
      errors.push("El formato del correo no es válido.");
    }
  }

  // Teléfono (solo si viene)
  if (data.telefono) {
    const phoneRegex = /^[+\d][\d\s-]{8,15}$/;
    if (!phoneRegex.test(data.telefono)) {
      errors.push("El número de teléfono no es válido.");
    }
  }

  // Estado (solo si viene)
  const estadosValidos = ["nuevo", "contactado", "en progreso", "cerrado"];
  if (data.estado && !estadosValidos.includes(data.estado)) {
    errors.push(`El estado debe ser uno de: ${estadosValidos.join(", ")}`);
  }

  return errors;
}
