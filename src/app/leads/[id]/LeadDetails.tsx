export interface Lead {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  codigo_pais: string;
  pais: string;
  meses_inversion: number;
  monto_inversion: number;
  origen: string;
  estado: string;
  asignado_a?: string | null;
}

import type { Lead as LeadType } from "@/types/Lead";


export function LeadDetails({ lead }: { lead: LeadType }) {

  return (
    <section className="bg-gray-100 border border-gray-300 rounded-xl p-6 shadow-sm">
      <h2 className="text-2xl font-semibold mb-4 text-black">Detalles del Lead</h2>

      <div className="grid grid-cols-2 gap-4 text-black">
        <p><strong>Nombre:</strong> {lead.nombre} {lead.apellido}</p>
        <p><strong>Correo:</strong> {lead.correo || "—"}</p>

        <p><strong>Código país:</strong> {lead.codigo_pais || "—"}</p>
        <p><strong>Teléfono:</strong> {lead.telefono || "—"}</p>

        <p><strong>País:</strong> {lead.pais || "—"}</p>
        <p><strong>Origen:</strong> {lead.origen}</p>

        <p><strong>Meses de inversión:</strong> {lead.meses_inversion}</p>
        <p><strong>Monto de inversión:</strong> ${lead.monto_inversion}</p>

        <p><strong>Estado:</strong> {lead.estado}</p>
        <p><strong>Asignado a:</strong> {lead.asignado_a || "Sin asignar"}</p>
      </div>
    </section>
  );
}
