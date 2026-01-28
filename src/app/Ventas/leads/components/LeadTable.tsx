"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import AssignUsers from "./AssignUsers";
import { RefreshCcw } from "lucide-react";
import { useLeads } from "../hooks/useLeads";

export default function LeadTable() {
  const {
    leads,
    fetchLeads,
    filtroEstado,
    setFiltroEstado,
    selectedLeads,
    setSelectedLeads,
    showAssignUsers,
    setShowAssignUsers,
    users,
    fetchUsers,
    handleAssign,
  } = useLeads();

  // 🔹 NORMALIZAR ESTADO: "nuevo" → "pendiente"
  const leadsNormalizados = (leads as any[]).map((l) => {
    l.estado = l.estado === "Nuevo" ? "pendiente" : l.estado;
    return l;
  });


  // 🔹 Filtrar por estado ya normalizado
  const leadsFiltrados = leadsNormalizados.filter((l) =>
    filtroEstado === "todos" ? true : l.estado === filtroEstado
  );

  // Selección individual
  const toggleSelect = (id: number) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Selección global
  const toggleSelectAll = () => {
    const allSelected =
      leadsFiltrados.length > 0 &&
      leadsFiltrados.every((l) => selectedLeads.includes(l.id));

    setSelectedLeads(allSelected ? [] : leadsFiltrados.map((l) => l.id));
  };

  const isAllChecked =
    leadsFiltrados.length > 0 &&
    leadsFiltrados.every((l) => selectedLeads.includes(l.id));

  const estados = ["todos", "pendiente", "contactado", "cerrado"] as const;

  return (
    <div>
      {/* 🔹 Top bar: refresh + contador */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <button
          onClick={fetchLeads}
          className="
            flex items-center gap-2
            rounded-2xl
            border border-white/10
            bg-white/5
            backdrop-blur-xl
            px-4 py-2.5
            text-sm font-semibold text-white/85
            hover:bg-white/10
            transition
            shadow-2xl
          "
        >
          <RefreshCcw className="w-4 h-4 text-white/80" />
          Refrescar tabla
        </button>

        <div className="text-sm text-white/60">
          Total:{" "}
          <span className="text-white/85 font-semibold">
            {leadsFiltrados.length}
          </span>
          {selectedLeads.length > 0 && (
            <>
              {" "}
              • Seleccionados:{" "}
              <span className="text-emerald-300 font-semibold">
                {selectedLeads.length}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 🔹 Filtros */}
      <div className="flex flex-wrap gap-2 mb-5 items-center">
        {estados.map((estado) => {
          const active = filtroEstado === estado;
          return (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={[
                "px-4 py-2 rounded-full text-sm font-semibold transition",
                "border",
                active
                  ? "bg-emerald-500/15 border-emerald-400/20 text-white"
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              {estado}
            </button>
          );
        })}

        {selectedLeads.length > 0 && (
          <button
            onClick={() => {

              setShowAssignUsers(true);
            }}
            className="
              ml-auto
              px-4 py-2 rounded-full
              text-sm font-semibold
              border border-emerald-400/20
              bg-emerald-500/15
              text-white/90
              hover:bg-emerald-500/25 hover:border-emerald-400/30
              transition
              shadow-2xl
            "
          >
            Asignar a usuario
          </button>
        )}
      </div>

      {/* 🔹 Tabla */}
      <motion.div
        className="
          rounded-3xl
          border border-white/10
          bg-white/5
          backdrop-blur-2xl
          shadow-2xl
          overflow-hidden
        "
        layout
      >
        {/* header interno para darle contraste */}
        <div className="h-px w-full bg-emerald-500/15" />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[980px]">
            <thead className="bg-black/35 text-white/70">
              <tr className="border-b border-white/10">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllChecked}
                    onChange={toggleSelectAll}
                    className="accent-emerald-400 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="p-3 text-xs font-semibold tracking-wide uppercase whitespace-nowrap">
                  Nombre
                </th>
                <th className="p-3 text-xs font-semibold tracking-wide uppercase whitespace-nowrap">
                  Correo
                </th>
                <th className="p-3 text-xs font-semibold tracking-wide uppercase whitespace-nowrap">
                  Teléfono
                </th>
                <th className="p-3 text-xs font-semibold tracking-wide uppercase whitespace-nowrap">
                  Origen
                </th>
                <th className="p-3 text-xs font-semibold tracking-wide uppercase whitespace-nowrap">
                  Estado
                </th>
                <th className="p-3 text-xs font-semibold tracking-wide uppercase whitespace-nowrap">
                  Asignado a
                </th>
                <th className="p-3 text-xs font-semibold tracking-wide uppercase whitespace-nowrap text-center">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              <AnimatePresence>
                {leadsFiltrados.map((lead) => (
                  <motion.tr
                    key={lead.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="
                      border-t border-white/10
                      hover:bg-white/5
                      transition-colors
                    "
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="accent-emerald-400 w-4 h-4 cursor-pointer"
                      />
                    </td>

                    <td className="p-3 text-white/85 font-medium">
                      {lead.nombre}
                    </td>
                    <td className="p-3 text-white/70">{lead.correo}</td>
                    <td className="p-3 text-white/70">{lead.telefono}</td>
                    <td className="p-3 capitalize text-white/70">
                      {lead.origen}
                    </td>

                    <td className="p-3">
                      <span
                        className={[
                          "px-3 py-1 rounded-full text-xs font-semibold border",
                          lead.estado === "cerrado"
                            ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/20"
                            : lead.estado === "contactado"
                            ? "bg-amber-500/15 text-amber-200 border-amber-400/20"
                            : "bg-white/5 text-white/70 border-white/10",
                        ].join(" ")}
                      >
                        {lead.estado}
                      </span>
                    </td>

                    <td className="p-3 text-white/70">
                      {lead.asignado_a || "Sin asignar"}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() =>
                          (window.location.href = `/leads/${lead.id}`)
                        }
                        className="
                          px-3 py-1.5
                          rounded-xl
                          text-xs font-semibold
                          border border-white/10
                          bg-white/5
                          text-white/80
                          hover:bg-white/10 hover:text-white
                          transition
                        "
                      >
                        Ver caso
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {leadsFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-10 text-center text-white/50"
                  >
                    No hay leads para mostrar con este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* footer line */}
        <div className="h-px w-full bg-emerald-500/15" />
      </motion.div>

      {/* 🔹 Modal Asignar */}
      <AssignUsers
        isOpen={showAssignUsers}
        onAssign={handleAssign}
        onClose={() => setShowAssignUsers(false)}
      />

    </div>
  );
}
