"use client";
import { useEffect, useState } from "react";

import LeadCard from "./components/LeadCard";
import Sidebar from "./components/Sidebar";

interface Lead {
  id?: number;
  nombre?: string;
  telefono?: string;
  estado?: "Nuevo" | "Contactado" | "En Proceso" | "Cerrado";
  correo?: string;
  empresa?: string;
  [key: string]: any;
}

export default function LeadsGestion() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [color, setColor] = useState<"blue" | "red" | "green" | "purple" | "orange">("blue");

  const [filtro, setFiltro] = useState<"todos" | "pendiente" | "contactado" | "cerrado">("todos");

  useEffect(() => {
    fetch("/api/leads/asesor", { credentials: "include" })
      .then(async (res) => {
        if (res.status === 401) window.location.href = "/login";
        const data = await res.json();

        const validLeads: Lead[] = (data.leads || []).filter(
          (lead: Lead) =>
            lead && (lead.id || lead.nombre || lead.telefono)
        );

        setLeads(validLeads);
      })
      .catch(() => setError("Error cargando datos"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6">Cargando...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  // FILTROS
  const leadsFiltrados = leads.filter((lead) => {
    if (filtro === "todos") return true;

    if (filtro === "pendiente")
      return lead.estado === "Nuevo" || lead.estado === "En Proceso";

    if (filtro === "contactado")
      return lead.estado === "Contactado";

    if (filtro === "cerrado")
      return lead.estado === "Cerrado";

    return true;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 p-6">

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestión de Leads del Asesor</h1>
        </div>

        {/* FILTROS */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFiltro("todos")}
            className={`px-3 py-1 rounded-lg border ${
              filtro === "todos"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Todos
          </button>

          <button
            onClick={() => setFiltro("pendiente")}
            className={`px-3 py-1 rounded-lg border ${
              filtro === "pendiente"
                ? "bg-orange-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Pendientes
          </button>

          <button
            onClick={() => setFiltro("contactado")}
            className={`px-3 py-1 rounded-lg border ${
              filtro === "contactado"
                ? "bg-yellow-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Contactados
          </button>

          <button
            onClick={() => setFiltro("cerrado")}
            className={`px-3 py-1 rounded-lg border ${
              filtro === "cerrado"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Cerrados
          </button>
        </div>

        {leadsFiltrados.length === 0 ? (
          <p>No hay leads en esta categoría.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leadsFiltrados.map((lead) => (
              <LeadCard key={lead.id || Math.random()} lead={lead} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
