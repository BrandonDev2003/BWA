// src/types/Lead.ts
export interface Lead {
  id: number;

  // asignación
  asignado_a?: number | null;
  nombre_asesor?: string | null;

  // datos lead
  nombre: string;
  apellido?: string | null;
  correo: string;
  telefono: string;

  codigo_pais?: string | null;
  pais?: string | null;

  meses_inversion?: number | null;
  monto_inversion?: number | null;

  origen: string;
  estado: "pendiente" | "contactado" | "cerrado" | string;

  // fecha en BD
  fecha?: string | null;
}
// src/components/LeadDetails.tsx
import type { Lead as LeadType } from "@/types/Lead";

export function LeadDetails({ lead }: { lead: LeadType }) {
  const fecha =
    lead.fecha
      ? new Date(lead.fecha).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "—";

  const asignado =
    lead.nombre_asesor?.trim()
      ? lead.nombre_asesor
      : lead.asignado_a
      ? `Usuario #${lead.asignado_a}`
      : "Sin asignar";

  return (
    <section className="bg-gray-100 border border-gray-300 rounded-xl p-6 shadow-sm">
      <h2 className="text-2xl font-semibold mb-4 text-black">Detalles del Lead</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-black">
        <p>
          <strong>Nombre:</strong> {lead.nombre} {lead.apellido || ""}
        </p>
        <p>
          <strong>Correo:</strong> {lead.correo || "—"}
        </p>

        <p>
          <strong>Código país:</strong> {lead.codigo_pais || "—"}
        </p>
        <p>
          <strong>Teléfono:</strong> {lead.telefono || "—"}
        </p>

        <p>
          <strong>País:</strong> {lead.pais || "—"}
        </p>
        <p>
          <strong>Origen:</strong> {lead.origen || "—"}
        </p>

        <p>
          <strong>Meses de inversión:</strong> {lead.meses_inversion ?? "—"}
        </p>
        <p>
          <strong>Monto de inversión:</strong> ${lead.monto_inversion ?? "—"}
        </p>

        <p>
          <strong>Estado:</strong> {lead.estado || "—"}
        </p>
        <p>
          <strong>Asignado a:</strong> {asignado}
        </p>

        <p>
          <strong>Fecha:</strong> {fecha}
        </p>
      </div>
    </section>
  );
}