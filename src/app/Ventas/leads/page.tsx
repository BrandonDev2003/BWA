"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AssignUsers from "./components/AssignUsers";
import LeadTable from "./components/LeadTable";
import { useLeads } from "./hooks/useLeads";

export default function CRMHome() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authorized" | "unauthorized"
  >("loading");

  const router = useRouter();

  const { showAssignUsers, setShowAssignUsers, handleAssign } = useLeads();

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const res = await fetch("/api/auth/verify", { cache: "no-store" });
        const data = await res.json();

        if (!data.ok) return setAuthStatus("unauthorized");
        if (!data.user || !data.user.rol) return setAuthStatus("unauthorized");

        if (data.user.rol === "spa" || data.user.rol === "admin" || data.user.rol === "SpA" || data.user.rol === "rrhh" || data.user.rol === "RRHH") {
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
      <div className="min-h-screen grid place-items-center bg-black text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4 shadow-2xl">
          Validando acceso...
        </div>
      </div>
    );
  }

  if (authStatus === "unauthorized") return null;

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundImage: "url('/fondo-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay oscuro (como tu chat) */}
      <div className="min-h-screen w-full bg-black/60">
        <div className="relative flex min-h-screen">
          {/* Sidebar */}
          <Sidebar />

          {/* Main */}
          <main className="flex-1 p-4 md:p-6">
            {/* Header */}
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl">
              <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            </div>

            {/* Assign Users */}
            {showAssignUsers && (
              <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl">
                <AssignUsers
                  isOpen={showAssignUsers}
                  onAssign={handleAssign}
                  onClose={() => setShowAssignUsers(false)}
                />
              </div>
            )}

            {/* Table */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl">
              <LeadTable />
            </div>

            {/* Línea decorativa */}
            <div className="mt-6 h-px w-full bg-emerald-500/20" />
          </main>
        </div>
      </div>
    </div>
  );
}
