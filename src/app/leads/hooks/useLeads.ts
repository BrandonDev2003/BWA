"use client";

import { useState } from "react";

export function useLeads() {
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [showAssignUsers, setShowAssignUsers] = useState(false);

  // Obtener leads
  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads", {
        credentials: "include",
      });

      const data = await res.json();

      // 🔥 FIX: asegurar array
      setLeads(Array.isArray(data.leads) ? data.leads : []);
    } catch (err) {
      console.error("Error al obtener leads:", err);
      setLeads([]);
    }
  };

  // Obtener usuarios
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", {
        credentials: "include",
      });

      const data = await res.json();

      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      console.error("Error al obtener usuarios:", err);
      setUsers([]);
    }
  };

  // Asignar leads
  const handleAssign = async (userId: number) => {
    try {
      const res = await fetch("/api/leads/assigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          leadIds: selectedLeads,
          asesorId: userId,
        }),
      });

      if (!res.ok) throw new Error("Error asignando usuario");

      // Refrescar la tabla
      await fetchLeads();

      setSelectedLeads([]);
      setShowAssignUsers(false);
    } catch (err) {
      console.error(err);
    }
  };

  return {
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
  };
}
