"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AssignUsers from "./AssignUsers";

interface Lead {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  origen: string;
  estado?: "pendiente" | "contactado" | "cerrado" | string;
  asignado_a?: number;
}

interface FiltersProps {
  filtroEstado: string;
  setFiltroEstado: (estado: string) => void;
  selectedLeads: number[];
  onAssignClick: () => void;
}

const Filters: React.FC<FiltersProps> = ({
  filtroEstado,
  setFiltroEstado,
  selectedLeads,
  onAssignClick,
}) => {
  const estados = ["todos", "pendiente", "contactado", "cerrado"];
  return (
    <div className="flex flex-wrap gap-3 mb-8 items-center">
      {estados.map((estado) => (
        <button
          key={estado}
          className={`px-4 py-2 rounded-full font-medium transition ${
            filtroEstado === estado
              ? "bg-[#C0D0EF] text-white shadow-lg"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
          onClick={() => setFiltroEstado(estado)}
        >
          {estado.charAt(0).toUpperCase() + estado.slice(1)}
        </button>
      ))}

      {selectedLeads.length > 0 && (
        <button
          className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow"
          onClick={onAssignClick}
        >
          Asignar a usuario
        </button>
      )}
    </div>
  );
};

export default function LeadTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // 🔹 Cargar leads y normalizar estado
  useEffect(() => {
    fetch("/api/leads", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        const raw = Array.isArray(data) ? data : data?.leads || [];
        const normalized = raw.map((l: any) => ({
          ...l,
          estado: l.estado?.toLowerCase() || "pendiente",
        }));
        setLeads(normalized);
      })
      .catch(console.error);
  }, []);

  // 🔹 Filtrado
  const leadsFiltrados = leads.filter(l =>
    filtroEstado === "todos" ? true : l.estado === filtroEstado
  );

  // 🔹 Selección individual y global
  const toggleSelect = (leadId: number) => {
    setSelectedLeads(prev =>
      prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
    );
  };

  const toggleSelectAll = () => {
    if (!leadsFiltrados.length) return;
    const allSelected = leadsFiltrados.every(l => selectedLeads.includes(l.id));
    setSelectedLeads(prev =>
      allSelected
        ? prev.filter(id => !leadsFiltrados.some(l => l.id === id))
        : Array.from(new Set([...prev, ...leadsFiltrados.map(l => l.id)]))
    );
  };

  // 🔹 Modal de asignación
  const handleAssignClick = () => {
    if (selectedLeads.length > 0) setIsAssignOpen(true);
  };

  const handleAssignUser = async (userId: number) => {
    if (!selectedLeads.length) return;
    try {
      const res = await fetch("/api/leads/assigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ leadIds: selectedLeads, asesorId: userId }),
      });
      if (!res.ok) throw new Error("Error asignando usuario");

      setLeads(prev =>
        prev.map(l =>
          selectedLeads.includes(l.id) ? { ...l, asignado_a: userId } : l
        )
      );
      setSelectedLeads([]);
      setIsAssignOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* 🔹 Filtros */}
      <Filters
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
        selectedLeads={selectedLeads}
        onAssignClick={handleAssignClick}
      />

      {/* 🔹 Tabla */}
      <motion.div
        className="bg-[#C2C6CE] rounded-2xl border border-gray-800 overflow-hidden shadow-lg"
        layout
      >
        <table className="w-full text-left text-sm">
          <thead className="bg-black text-gray-300">
            <tr>
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={
                    leadsFiltrados.length > 0 &&
                    leadsFiltrados.every(l => selectedLeads.includes(l.id))
                  }
                  onChange={toggleSelectAll}
                  className="accent-green-800 w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Correo</th>
              <th className="p-3">Teléfono</th>
              <th className="p-3">Origen</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Asignado a</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {leadsFiltrados.map(lead => (
                <motion.tr
                  key={lead.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="border-t border-gray-800 hover:bg-gray-800/20"
                >
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={e => {
                        e.stopPropagation();
                        toggleSelect(lead.id);
                      }}
                      className="accent-green-500 w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="p-3 text-black font-medium">{lead.nombre}</td>
                  <td className="p-3 text-black">{lead.correo}</td>
                  <td className="p-3 text-black">{lead.telefono}</td>
                  <td className="p-3 capitalize text-black">{lead.origen}</td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        lead.estado === "cerrado"
                          ? "bg-green-500/20 text-green-700"
                          : lead.estado === "contactado"
                          ? "bg-yellow-500/20 text-yellow-600"
                          : "bg-gray-700/40 text-gray-800"
                      }`}
                    >
                      {lead.estado || "pendiente"}
                    </span>
                  </td>
                  <td className="p-3 text-black">{lead.asignado_a || "Sin asignar"}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => (window.location.href = `/leads/${lead.id}`)}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg font-medium"
                    >
                      Ver caso
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </motion.div>

      {/* 🔹 Modal Asignar */}
      <AssignUsers
        key={selectedLeads.join("-")}
        isOpen={isAssignOpen}
        onAssign={handleAssignUser}
        onClose={() => setIsAssignOpen(false)}
      />
    </div>
  );
}
