interface Lead {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  origen: string;
  estado: string;
  asignado_a?: string | null;
}

export  function LeadDetails({ lead }: { lead: Lead }) {
  return (
    <section className="bg-gray-100 border border-gray-300 rounded-xl p-6 shadow-sm">
      <h2 className="text-2xl font-semibold mb-4 text-black">Detalles del Lead</h2>
      <div className="grid grid-cols-2 gap-4 text-black">
        <p><strong>Nombre:</strong> {lead.nombre}</p>
        <p><strong>Correo:</strong> {lead.correo || "—"}</p>
        <p><strong>Teléfono:</strong> {lead.telefono || "—"}</p>
        <p><strong>Origen:</strong> {lead.origen || "—"}</p>
        <p><strong>Estado:</strong> {lead.estado}</p>
        <p><strong>Asignado a:</strong> {lead.asignado_a || "Sin asignar"}</p>
      </div>
    </section>
  );
}
