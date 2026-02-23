"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";

type Venta = {
  id: number;
  lead_id: number;

  nombre: string;
  correo: string;
  telefono: string | null;
  telefono_extra: string | null;

  pais: string | null;
  asignado_a: number | null;
  nombre_asesor: string | null;

  tipo_producto: "plazo_fijo" | "profuturo";
  meses: number;
  monto: string | number;
  interes: string | number;

  fecha_lead: string;
  fecha_venta: string;
  creado_en: string;

  estado_revision: "pendiente" | "aprobada" | "rechazada";
};

type User = { id: number; rol: string; nombre?: string };

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "—";
  return x.toLocaleString("es-ES");
}

export default function VentasPage() {
  const router = useRouter();

  const [auth, setAuth] = useState<"loading" | "ok" | "no">("loading");
  const [user, setUser] = useState<User | null>(null);

  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal cambiar estado
  const [editing, setEditing] = useState<Venta | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<
    "pendiente" | "aprobada" | "rechazada"
  >("pendiente");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const canEdit = useMemo(() => {
    const rol = (user?.rol || "").toLowerCase();
    return rol === "admin" || rol === "spa";
  }, [user]);

  const isAsesor = useMemo(
    () => (user?.rol || "").toLowerCase() === "asesor",
    [user]
  );

  // auth
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));

        if (!data?.ok || !data?.user?.rol) {
          setAuth("no");
          return;
        }

        setUser({
          id: Number(data.user.id),
          rol: String(data.user.rol).toLowerCase(),
        });
        setAuth("ok");
      } catch {
        setAuth("no");
      }
    })();
  }, []);

  useEffect(() => {
    if (auth === "no") router.replace("/login");
  }, [auth, router]);

  // cargar ventas
  useEffect(() => {
    if (auth !== "ok") return;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/lead-efectivos", {
          credentials: "include",
          cache: "no-store",
        });

        const text = await res.text();
        const data = text ? JSON.parse(text) : null;

        if (!res.ok) {
          console.log("GET ventas error:", data);
          setVentas([]);
          return;
        }

        let list: Venta[] = Array.isArray(data?.ventas) ? data.ventas : [];
        // el backend ya filtra para asesor, esto es solo extra UX
        if (isAsesor && user?.id) {
          list = list.filter((v) => Number(v.asignado_a) === Number(user.id));
        }

        setVentas(list);
      } catch (e) {
        console.error(e);
        setVentas([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [auth, isAsesor, user?.id]);

  if (auth === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0B0D10] text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4 shadow-2xl">
          Validando...
        </div>
      </div>
    );
  }

  if (auth === "no") return null;

  return (
    <div className="min-h-screen bg-[#0B0D10] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),rgba(0,0,0,0.85))]" />
      </div>

      <div className="relative flex min-h-screen">
        <Sidebar />

        <div className="flex-1 p-6 md:p-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold">Ventas</h1>
              <p className="mt-2 text-sm text-white/55">
                {canEdit
                  ? "Vista admin/SpA: puedes cambiar el estado de revisión."
                  : "Vista asesor: solo lectura, solo tus ventas."}
              </p>
            </div>

            <div className="text-right text-sm text-white/60">
              <div>
                Rol:{" "}
                <span className="text-white/85 font-semibold">{user?.rol}</span>
              </div>
              <div>
                Total:{" "}
                <span className="text-white/85 font-semibold">
                  {ventas.length}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-black/25">
              <div className="text-white/70 text-sm">Listado</div>
            </div>

            {loading ? (
              <div className="p-6 text-white/60">Cargando ventas...</div>
            ) : ventas.length === 0 ? (
              <div className="p-6 text-white/60">No hay ventas para mostrar.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-white/60">
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4">ID</th>
                      <th className="text-left p-4">Cliente</th>
                      <th className="text-left p-4">Teléfono</th>
                      <th className="text-left p-4">Producto</th>
                      <th className="text-left p-4">Fecha venta</th>
                      <th className="text-left p-4">Asesor</th>
                      <th className="text-left p-4">Revisión</th>
                      <th className="text-right p-4">Acción</th>
                    </tr>
                  </thead>

                  <tbody>
                    {ventas.map((v) => (
                      <tr
                        key={v.id}
                        className="border-b border-white/10 hover:bg-white/5"
                      >
                        <td className="p-4 text-white/80 font-semibold">
                          #{v.id}
                        </td>

                        <td className="p-4">
                          <div className="text-white/85 font-semibold">
                            {v.nombre}
                          </div>
                          <div className="text-white/50">{v.correo}</div>
                          <div className="text-white/40 text-xs">
                            Lead #{v.lead_id}
                          </div>
                        </td>

                        <td className="p-4 text-white/80">
                          <div>{v.telefono ?? "—"}</div>
                          <div className="text-white/50 text-xs">
                            Extra: {v.telefono_extra ?? "—"}
                          </div>
                        </td>

                        <td className="p-4 text-white/80">
                          {v.tipo_producto} · {v.meses}m · ${String(v.monto)} ·{" "}
                          {String(v.interes)}%
                        </td>

                        <td className="p-4 text-white/70">
                          {fmtDate(v.fecha_venta)}
                        </td>

                        <td className="p-4 text-white/70">
                          {v.nombre_asesor
                            ? v.nombre_asesor
                            : v.asignado_a
                            ? `Usuario #${v.asignado_a}`
                            : "—"}
                        </td>

                        <td className="p-4">
                          <span
                            className={[
                              "px-3 py-1 rounded-full border text-xs font-semibold",
                              v.estado_revision === "aprobada"
                                ? "bg-emerald-500/15 border-emerald-400/20 text-emerald-200"
                                : v.estado_revision === "rechazada"
                                ? "bg-red-500/15 border-red-400/20 text-red-200"
                                : "bg-white/5 border-white/10 text-white/70",
                            ].join(" ")}
                          >
                            {v.estado_revision}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {/* NUEVO: redirige a /ventas/[id] */}
                            <button
                              onClick={() => router.push(`/Ventas/${v.id}`)}
                              className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition"
                            >
                              Inspeccionar
                            </button>

                            {canEdit ? (
                              <button
                                onClick={() => {
                                  setErr("");
                                  setEditing(v);
                                  setNuevoEstado(v.estado_revision ?? "pendiente");
                                }}
                                className="px-3 py-2 rounded-full bg-sky-500/20 border border-sky-400/20 text-white font-semibold hover:bg-sky-500/30 transition"
                              >
                                Cambiar estado
                              </button>
                            ) : (
                              <span className="text-white/35">Solo lectura</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal (solo admin/spa) */}
          {canEdit && editing && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
              <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0B0D10] shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-white/10 bg-black/25 flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold text-lg">
                      Revisión venta #{editing.id}
                    </div>
                    <div className="text-white/50 text-sm">{editing.nombre}</div>
                  </div>

                  <button
                    onClick={() => setEditing(null)}
                    className="px-3 py-2 rounded-xl border border-white/10 text-white/80 hover:bg-white/5"
                  >
                    Cerrar
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-white/70 text-xs mb-2">
                      Estado de revisión
                    </label>
                    <select
                      value={nuevoEstado}
                      onChange={(e) => setNuevoEstado(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/25 text-white focus:ring-2 focus:ring-emerald-400/30 focus:outline-none"
                    >
                      <option value="pendiente">pendiente</option>
                      <option value="aprobada">aprobada</option>
                      <option value="rechazada">rechazada</option>
                    </select>
                  </div>

                  {err && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-200 text-sm">
                      {err}
                    </div>
                  )}

                  <button
                    disabled={saving}
                    onClick={async () => {
                      try {
                        setSaving(true);
                        setErr("");

                        const res = await fetch(
                          `/api/lead-efectivos/${editing.id}`,
                          {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ estado_revision: nuevoEstado }),
                          }
                        );

                        const text = await res.text();
                        const data = text ? JSON.parse(text) : null;

                        if (!res.ok) {
                          setErr(
                            data?.message || data?.detail || "No se pudo actualizar."
                          );
                          return;
                        }

                        const updated = data?.venta?.estado_revision ?? nuevoEstado;

                        setVentas((prev) =>
                          prev.map((x) =>
                            x.id === editing.id
                              ? { ...x, estado_revision: updated }
                              : x
                          )
                        );

                        setEditing(null);
                      } catch (e) {
                        console.error(e);
                        setErr("Error inesperado.");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className={[
                      "w-full px-5 py-3 rounded-full bg-emerald-500/20 border border-emerald-400/20 text-white font-semibold hover:bg-emerald-500/30 transition",
                      saving ? "opacity-60 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 h-px w-full bg-emerald-500/15" />
        </div>
      </div>
    </div>
  );
} 