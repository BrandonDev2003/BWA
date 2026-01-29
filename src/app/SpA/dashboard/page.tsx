"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "./components/Sidebar";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center bg-[#0B0D10] text-white">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4 shadow-2xl">
            Cargando dashboard...
          </div>
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const router = useRouter();
  const search = useSearchParams();
  const asesorId = search.get("asesor");

  const [authStatus, setAuthStatus] = useState<
    "loading" | "authorized" | "unauthorized"
  >("loading");
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [openSidebar, setOpenSidebar] = useState(true);

  // ✅ Redirect SIN hooks condicionales
  useEffect(() => {
    if (authStatus === "unauthorized") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  /* -----------------------------
        VALIDACIÓN DE SESIÓN
  ------------------------------ */
  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch("/api/auth/verify", { cache: "no-store" });
        const data = await res.json();

        if (
          !data.ok || 
          !data.user?.rol ||
          !(data.user.rol === "SpA" || data.user.rol === "SPA" || data.user.rol === "spa")
        ) {
          setAuthStatus("unauthorized");
          return;
        }

        setAuthStatus("authorized");
      } catch {
        setAuthStatus("unauthorized");
      }
    };

    verify();
  }, []);

  /* -----------------------------
          CARGAR ESTADÍSTICAS
  ------------------------------ */
  useEffect(() => {
    if (authStatus !== "authorized") return;

    const cargarStats = async () => {
      try {
        setLoadingStats(true);
        const url = asesorId
          ? `/api/dashboard/stats?asesor=${asesorId}`
          : "/api/dashboard/stats";

        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingStats(false);
      }
    };

    cargarStats();
  }, [authStatus, asesorId]);

  /* -----------------------------
              ESTADOS
  ------------------------------ */
  if (authStatus === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0B0D10] text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4 shadow-2xl">
          Validando...
        </div>
      </div>
    );
  }

  if (authStatus === "unauthorized") {
    return null; // el useEffect de arriba se encarga del redirect
  }

  if (loadingStats || !stats) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0B0D10] text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4 shadow-2xl">
          Cargando estadísticas...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0D10] text-white">
      {/* Fondo con bloom sutil */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),rgba(0,0,0,0.85))]" />
        <div className="absolute -top-40 right-[-6rem] h-[34rem] w-[34rem] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[-8rem] h-[34rem] w-[34rem] rounded-full bg-slate-400/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen">
        {/* SIDEBAR (ajusta props según tu componente real) */}
        <Sidebar />

        <div className="flex-1 p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-4xl font-semibold text-white">
              Dashboard{" "}
              <span className="text-white/60 font-medium">
                {asesorId ? `(Asesor #${asesorId})` : "General"}
              </span>
            </h1>
            <p className="mt-2 text-sm text-white/50">
              Resumen rápido del estado de los leads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
            <StatCard title="Total Leads" value={stats.total} tone="info" />
            <StatCard title="Pendientes" value={stats.pendientes} tone="warn" />
            <StatCard title="Contactados" value={stats.contactados} tone="blue" />
            <StatCard title="Cerrados" value={stats.cerrados} tone="ok" />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl p-6 mb-6 overflow-hidden relative">
            <div className="pointer-events-none absolute inset-0 bg-black/25" />
            <div className="relative">
              <h2 className="text-lg font-semibold text-white/85 mb-3">
                Leads Gestionados
              </h2>
              <p className="text-3xl font-semibold text-white">{stats.gestionados}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl p-6 overflow-hidden relative">
            <div className="pointer-events-none absolute inset-0 bg-black/25" />
            <div className="relative">
              <h2 className="text-lg font-semibold text-white/85 mb-4">
                Distribución de estados
              </h2>

              <SimpleChart
                pendientes={stats.pendientes}
                contactados={stats.contactados}
                cerrados={stats.cerrados}
              />

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/60">
                <LegendDot label="Pendientes" className="bg-amber-400/80" />
                <LegendDot label="Contactados" className="bg-sky-400/80" />
                <LegendDot label="Cerrados" className="bg-emerald-400/80" />
              </div>
            </div>
          </div>

          <div className="mt-8 h-px w-full bg-emerald-500/15" />
        </div>
      </div>
    </div>
  );
}

/* ================================
   COMPONENTES
================================ */

function StatCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: any;
  tone: "info" | "warn" | "blue" | "ok";
}) {
  const badge =
    tone === "ok"
      ? "bg-emerald-500/15 border-emerald-400/20 text-emerald-200"
      : tone === "warn"
      ? "bg-amber-500/15 border-amber-400/20 text-amber-200"
      : tone === "blue"
      ? "bg-sky-500/15 border-sky-400/20 text-sky-200"
      : "bg-white/5 border-white/10 text-white/80";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl p-6 overflow-hidden relative">
      <div className="pointer-events-none absolute inset-0 bg-black/25" />
      <div className="relative">
        <p className="text-sm text-white/55 font-medium">{title}</p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="text-3xl font-semibold text-white">{value}</p>
          <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${badge}`}>
            {tone === "ok" ? "OK" : tone === "warn" ? "Pend" : tone === "blue" ? "Cont" : "Info"}
          </span>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ label, className }: { label: string; className: string }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function SimpleChart({ pendientes, contactados, cerrados }: any) {
  const total = pendientes + contactados + cerrados;

  if (total === 0) return <p className="text-white/60">No hay datos suficientes.</p>;

  const p = (n: number) => `${(n / total) * 100}%`;

  return (
    <div className="w-full rounded-2xl h-6 flex overflow-hidden border border-white/10 bg-black/30">
      <div className="bg-amber-400/80" style={{ width: p(pendientes) }} />
      <div className="bg-sky-400/80" style={{ width: p(contactados) }} />
      <div className="bg-emerald-400/80" style={{ width: p(cerrados) }} />
    </div>
  );
}
