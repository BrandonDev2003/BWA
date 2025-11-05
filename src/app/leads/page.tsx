"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Filters from "./components/Filters";
import AssignUsers from "./components/AssignUsers";
import LeadTable from "./components/LeadTable";
import { useLeads } from "./hooks/useLeads";

export default function CRMHome() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true); // para bloquear render hasta validar
  const router = useRouter();

  const {
    leads,
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

  // 🔒 Validar cookie en el servidor vía fetch
  useEffect(() => {
    fetch("/api/auth/validate")
      .then(res => {
        if (!res.ok) {
          router.push("/login"); // redirige si no hay cookie válida
        } else {
          setLoading(false);
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  if (loading) return <div className="flex justify-center items-center h-screen text-black">Cargando...</div>;

  return (
    <div className="flex h-screen bg-slate-200 text-white">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Contenido principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <Filters
          filtroEstado={filtroEstado}
          setFiltroEstado={setFiltroEstado}
          selectedLeads={selectedLeads}
          onAssignClick={() => {
            fetchUsers();
            setShowAssignUsers(!showAssignUsers);
          }}
        />

        {showAssignUsers && (
          <AssignUsers users={users} onAssign={handleAssign} />
        )}

        <LeadTable
          leads={leads}
          selectedLeads={selectedLeads}
          setSelectedLeads={setSelectedLeads}
        />
      </main>
    </div>
  );
}
