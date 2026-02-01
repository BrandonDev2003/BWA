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
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authorized" | "unauthorized"
  >("loading");
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
    fetchLeads,
  } = useLeads();

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const res = await fetch("/api/auth/verify", { cache: "no-store" });
        const data = await res.json();

        if (!data.ok) return setAuthStatus("unauthorized");
        if (!data.user || !data.user.rol) return setAuthStatus("unauthorized");

        if (data.user.rol === "admin" || data.user.rol === "SpA" || data.user.rol === "rrhh" || data.user.rol === "RRHH" || data.user.rol === "Admin" || data.user.rol === "spa") {
          setAuthStatus("authorized");
        } else {
          setAuthStatus("unauthorized");
        }
      } catch {
        setAuthStatus("unauthorized");
      }
    };

    verifyUser();
  }, []);

  useEffect(() => {
    if (authStatus === "unauthorized") router.replace("/login");
  }, [authStatus, router]);

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0B0D10] text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4 shadow-2xl">
          Validando acceso...
        </div>
      </div>
    );
  }

  if (authStatus === "unauthorized") return null;

  return (
  <div className="min-h-screen bg-[#0B0D10] text-white">
    {/* Fondo con “bloom” sutil como la referencia */}
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),rgba(0,0,0,0.85))]" />
      <div className="absolute -top-40 right-[-6rem] h-[34rem] w-[34rem] rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute bottom-[-10rem] left-[-8rem] h-[34rem] w-[34rem] rounded-full bg-slate-400/10 blur-3xl" />
    </div>

    {/* ✅ quitamos h-screen para no “encerrar” el scroll */}
    <div className="relative flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main (scroll natural) */}
      <main className="flex-1 p-4 md:p-6">
        {/* Header card */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl">
          <Header
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
           
          />
        </div>

        {/* Filters card */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl">
          <Filters
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            selectedLeads={selectedLeads}
            onAssignClick={() => {

              setShowAssignUsers(!showAssignUsers);
            }}
          />
        </div>

        {showAssignUsers && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl">
            <AssignUsers
              isOpen={showAssignUsers}
              onAssign={handleAssign}
              onClose={() => setShowAssignUsers(false)}
            />

          </div>
        )}

        {/* Table card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl">
          <LeadTable />
        </div>

        {/* Detalle verde */}
        <div className="mt-6 h-px w-full bg-emerald-500/20" />
      </main>
    </div>
  </div>
);

}
