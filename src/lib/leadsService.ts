// src/lib/leadsService.ts
export type LeadNoteDTO = {
  id: number;
  contenido: string;      // ✅ correcto
  fecha_hora: string;     // ✅ correcto
  autor_id?: number | null;
};

export type LeadDTO = {
  id: number;

  nombre: string;
  apellido?: string | null;

  correo: string;
  telefono: string;
  codigo_pais?: string | null;

  origen: string;
  estado: "pendiente" | "contactado" | "cerrado" | "Nuevo";

  pais?: string | null;

  meses_inversion?: number | null;
  monto_inversion?: number | null;

  creado_en?: string | null; // ✅ AGREGADO

  asignado_a?: number | null;
  nombre_asesor?: string | null;
  notas?: LeadNoteDTO[];
};

// ------------------- Leads -------------------

export async function fetchLeads(token: string): Promise<LeadDTO[]> {
  const res = await fetch("/api/leads", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`fetchLeads ${res.status} ${txt}`);
  }

  return res.json();
}

// ------------------- Actualizar estado -------------------

export async function updateLeadStatus(
  leadId: number,
  estado: string,
  token: string
) {
  const res = await fetch(`/api/leads/${leadId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ estado }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`updateLeadStatus ${res.status} ${txt}`);
  }

  return res.json();
}

// ------------------- Notas -------------------

export async function fetchNotes(leadId: number, token: string) {
  const res = await fetch(`/api/leads/${leadId}/notes`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`fetchNotes ${res.status} ${txt}`);
  }

  return res.json();
}

export async function postNote(
  leadId: number,
  contenido: string,
  token: string
) {
  const res = await fetch(`/api/leads/${leadId}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contenido }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`postNote ${res.status} ${txt}`);
  }

  return res.json();
}
