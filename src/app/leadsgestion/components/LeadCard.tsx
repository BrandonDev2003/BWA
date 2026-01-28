"use client";
import { useEffect, useMemo, useState } from "react";

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filtro, setFiltro] = useState<"todos" | "pendiente" | "contactado" | "cerrado">("todos");

  // ✅ Modal formulario
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    empresa: "",
    estado: "Nuevo" as Lead["estado"],
  });

  useEffect(() => {
    fetch("/api/leads/asesor", { credentials: "include" })
      .then(async (res) => {
        if (res.status === 401) window.location.href = "/login";
        const data = await res.json();

        const validLeads: Lead[] = (data.leads || []).filter(
          (lead: Lead) => lead && (lead.id || lead.nombre || lead.telefono)
        );

        setLeads(validLeads);
      })
      .catch(() => setError("Error cargando datos"))
      .finally(() => setLoading(false));
  }, []);

  async function crearLead() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/leads/asesor", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "No se pudo crear el lead");
        return;
      }

      // ✅ Añadir el lead nuevo arriba
      setLeads((prev) => [data.lead, ...prev]);

      // ✅ Reset + cerrar
      setForm({ nombre: "", telefono: "", correo: "", empresa: "", estado: "Nuevo" });
      setOpenForm(false);
    } catch {
      setError("Error creando lead");
    } finally {
      setSaving(false);
    }
  }

  const leadsFiltrados = useMemo(() => {
    return leads.filter((lead) => {
      if (filtro === "todos") return true;

      if (filtro === "pendiente") return lead.estado === "Nuevo" || lead.estado === "En Proceso";
      if (filtro === "contactado") return lead.estado === "Contactado";
      if (filtro === "cerrado") return lead.estado === "Cerrado";

      return true;
    });
  }, [leads, filtro]);

  if (loading) return <p className="p-6">Cargando...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 p-6">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestión de Leads del Asesor</h1>

          <button
            onClick={() => setOpenForm(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            + Agregar Lead
          </button>
        </div>

        {/* FILTROS */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setFiltro("todos")}
            className={`px-3 py-1 rounded-lg border ${
              filtro === "todos" ? "bg-blue-600 text-white" : "bg-white text-gray-700"
            }`}
          >
            Todos
          </button>

          <button
            onClick={() => setFiltro("pendiente")}
            className={`px-3 py-1 rounded-lg border ${
              filtro === "pendiente" ? "bg-orange-600 text-white" : "bg-white text-gray-700"
            }`}
          >
            Pendientes
          </button>

          <button
            onClick={() => setFiltro("contactado")}
            className={`px-3 py-1 rounded-lg border ${
              filtro === "contactado" ? "bg-yellow-600 text-white" : "bg-white text-gray-700"
            }`}
          >
            Contactados
          </button>

          <button
            onClick={() => setFiltro("cerrado")}
            className={`px-3 py-1 rounded-lg border ${
              filtro === "cerrado" ? "bg-green-600 text-white" : "bg-white text-gray-700"
            }`}
          >
            Cerrados
          </button>
        </div>

        {/* LISTA */}
        {leadsFiltrados.length === 0 ? (
          <p>No hay leads en esta categoría.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leadsFiltrados.map((lead) => (
              <LeadCard key={lead.id || `${lead.nombre}-${lead.telefono}-${Math.random()}`} lead={lead} />
            ))}
          </div>
        )}

        {/* MODAL NUEVO LEAD */}
        {openForm && (
          <div
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => !saving && setOpenForm(false)}
          >
            <div
              className="bg-white rounded-xl w-full max-w-lg p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold mb-4">Nuevo Lead</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="border rounded-lg p-2"
                  placeholder="Nombre*"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                />

                <input
                  className="border rounded-lg p-2"
                  placeholder="Teléfono*"
                  value={form.telefono}
                  onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                />

                <input
                  className="border rounded-lg p-2"
                  placeholder="Correo"
                  value={form.correo}
                  onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
                />

                <input
                  className="border rounded-lg p-2"
                  placeholder="Empresa"
                  value={form.empresa}
                  onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value }))}
                />

                <select
                  className="border rounded-lg p-2 md:col-span-2"
                  value={form.estado || "Nuevo"}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, estado: e.target.value as Lead["estado"] }))
                  }
                >
                  <option value="Nuevo">Nuevo</option>
                  <option value="Contactado">Contactado</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Cerrado">Cerrado</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setOpenForm(false)}
                  className="px-4 py-2 rounded-lg border"
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  onClick={crearLead}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60"
                  disabled={saving || !form.nombre.trim() || !form.telefono.trim()}
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                * Campos obligatorios: Nombre y Teléfono
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
