"use client";

import { useEffect, useState } from "react";

interface Lead {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  origen: string;
  estado: string;
  asignado_a: number | null; // 👈 Guardamos el ID
}

interface User {
  id: number;
  nombre: string;
  rol: string;
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [users, setUsers] = useState<User[]>([]);
  const [showAssignUsers, setShowAssignUsers] = useState(false);

  // 📦 Cargar leads al iniciar
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/leads", { credentials: "include" });
      const data = await res.json();
      if (data.ok && Array.isArray(data.leads)) setLeads(data.leads);
    })();
  }, []);

  // 👥 Cargar asesores
  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    if (!token) return console.warn("⚠️ No hay token");

    const res = await fetch("/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return console.warn("❌ Error al obtener usuarios");
    const data = await res.json();
    setUsers(data.users || []);
  };

  // 🧩 Asignar lead(s) a asesor
  const handleAssign = async (userId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No hay token de sesión");

      const responses = await Promise.all(
        selectedLeads.map((leadId) =>
          fetch(`/api/leads/${leadId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ asignado_a: userId }),
          })
        )
      );

      // ✅ Verificamos que todos se asignaron correctamente
      const allOk = responses.every((res) => res.ok);
      if (!allOk) throw new Error("Error en una o más asignaciones");

      // 🧠 Buscar nombre del asesor asignado
      const nombreUsuario = users.find((u) => u.id === userId)?.nombre || "Sin nombre";

      // ✅ Actualizamos el estado local
      setLeads((prev) =>
        prev.map((lead) =>
          selectedLeads.includes(lead.id)
            ? { ...lead, asignado_a: userId }
            : lead
        )
      );

      // 🧹 Limpiar selección y cerrar modal
      setSelectedLeads([]);
      setShowAssignUsers(false);
    } catch (error) {
      console.error("❌ Error asignando leads:", error);
      alert("Error asignando leads");
    }
  };

  // 🎯 Filtrar leads por estado
  const filteredLeads = leads.filter((l) =>
    filtroEstado === "todos" ? true : l.estado === filtroEstado
  );

  return {
    leads: filteredLeads,
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
