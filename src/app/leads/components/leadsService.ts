export interface LeadDTO {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  codigo_pais: string;
  pais: string;
  meses: number;
  monto: number;
  origen: string;
  estado: string;
  asignado_a?: string;
}

// 🔹 Obtener todos los leads
export async function fetchLeads(): Promise<LeadDTO[]> {
  try {
    const res = await fetch("/api/leads", { cache: "no-store" });

    if (!res.ok) {
      console.error("Error en la respuesta del servidor:", res.status);
      return [];
    }

    const data = await res.json();

    // 🟢 Garantiza que siempre devuelva un array válido
    if (Array.isArray(data)) {
      return data.filter((l) => l && l.id && l.nombre);
    }

    // Si el backend devuelve un objeto con `rows`
    if (data && Array.isArray(data.rows)) {
      return data.rows.filter((l) => l && l.id && l.nombre);
    }

    console.warn("La respuesta de la API no es un array:", data);
    return [];
  } catch (err) {
    console.error("Error al obtener leads:", err);
    return [];
  }
}

// 🔹 Actualizar estado del lead
export async function updateLeadStatus(id: number, nuevoEstado: string) {
  try {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado }),
    });

    if (!res.ok) {
      console.error("Error al actualizar estado:", res.status);
      throw new Error("No se pudo actualizar el estado del lead");
    }

    return await res.json();
  } catch (err) {
    console.error("Error en updateLeadStatus:", err);
    throw err;
  }
}
