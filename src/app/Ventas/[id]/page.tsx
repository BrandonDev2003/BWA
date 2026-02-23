"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";


type User = { id: number; rol: string; nombre?: string };

type Venta = {
  id: number;
  lead_id: number;

  nombre: string;
  correo: string;
  telefono: string | null;
  telefono_extra: string | null;

  pais: string | null;
  asignado_a: number | null;
  nombre_asesor?: string | null;

  tipo_producto: "plazo_fijo" | "profuturo" | string;
  meses: number;
  monto: string | number;
  interes: string | number;

  fecha_lead: string;
  fecha_venta: string;
  creado_en: string;

  estado_revision: "pendiente" | "aprobada" | "rechazada" | string;
};

type Lead = {
  id: number;
  asignado_a: number | null;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  correo: string | null;
  origen: string | null;
  estado: string | null;
  codigo_pais: string | null;
  pais: string | null;
  meses_inversion: number | null;
  monto_inversion: number | null;
  fecha: string | null;
};

type Note = {
  id?: number;
  lead_id: number;
  asesor_id?: number | null;
  autor_id?: number | null;
  nota_texto?: string | null;
  contenido?: string | null;
  fecha_hora?: string | null;
  creado_en?: string | null;
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "—";
  return x.toLocaleString("es-ES");
}

function pickNoteText(n: Note) {
  return (n.contenido ?? n.nota_texto ?? "").trim();
}

export default function VentaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = useMemo(() => String(params?.id ?? ""), [params]);

  const [auth, setAuth] = useState<"loading" | "ok" | "no">("loading");
  const [user, setUser] = useState<User | null>(null);

  const [venta, setVenta] = useState<Venta | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);

  const [loading, setLoading] = useState(true);
  const [pageErr, setPageErr] = useState("");

  // Agregar nota
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteErr, setNoteErr] = useState("");

  // Auth
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
          nombre: data.user.nombre ? String(data.user.nombre) : undefined,
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

  const load = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setPageErr("");

      const res = await fetch(`/api/ventas/${id}`, {
        credentials: "include",
        cache: "no-store",
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        setVenta(null);
        setLead(null);
        setNotes([]);
        setPageErr(data?.message || data?.error || "No se pudo cargar la venta.");
        return;
      }

      setVenta(data?.venta ?? null);
      setLead(data?.lead ?? null);
      setNotes(Array.isArray(data?.notes) ? data.notes : []);
    } catch (e) {
      console.error(e);
      setPageErr("Error inesperado cargando la venta.");
      setVenta(null);
      setLead(null);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (auth !== "ok") return;
    void load();
  }, [auth, load]);

  async function handleAddNote() {
    const contenido = noteText.trim();
    if (!contenido) {
      setNoteErr("Escribe una nota antes de guardar.");
      return;
    }

    try {
      setNoteSaving(true);
      setNoteErr("");

      const res = await fetch(`/api/ventas/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ contenido }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        setNoteErr(data?.message || data?.error || "No se pudo guardar la nota.");
        return;
      }

      setNoteText("");
      setShowNoteForm(false);

      // Reload para tener orden/fechas reales desde DB
      await load();
    } catch (e) {
      console.error(e);
      setNoteErr("Error inesperado guardando la nota.");
    } finally {
      setNoteSaving(false);
    }
  }

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


        <div className="flex-1 p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold">
                Venta #{id}
              </h1>
              <div className="mt-2 text-sm text-white/55">
                Rol:{" "}
                <span className="text-white/85 font-semibold">
                  {user?.rol}
                </span>
              </div>
            </div>

            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-xl border border-white/10 text-white/80 hover:bg-white/5"
            >
              ← Volver
            </button>
          </div>

          {/* Estado */}
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">
              Cargando información...
            </div>
          ) : pageErr ? (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
              {pageErr}
            </div>
          ) : (
            <>
              {/* Venta */}
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-black/25 flex items-center justify-between">
                  <div className="text-white/80 font-semibold">Datos de la venta</div>
                  <span
                    className={[
                      "px-3 py-1 rounded-full border text-xs font-semibold",
                      venta?.estado_revision === "aprobada"
                        ? "bg-emerald-500/15 border-emerald-400/20 text-emerald-200"
                        : venta?.estado_revision === "rechazada"
                        ? "bg-red-500/15 border-red-400/20 text-red-200"
                        : "bg-white/5 border-white/10 text-white/70",
                    ].join(" ")}
                  >
                    {venta?.estado_revision ?? "—"}
                  </span>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/70">
                  <div>
                    <div className="text-white/40 text-xs mb-1">Cliente</div>
                    <div className="text-white/85 font-semibold">{venta?.nombre ?? "—"}</div>
                    <div className="text-white/55">{venta?.correo ?? "—"}</div>
                  </div>

                  <div>
                    <div className="text-white/40 text-xs mb-1">Contacto</div>
                    <div className="text-white/80">Tel: {venta?.telefono ?? "—"}</div>
                    <div className="text-white/55 text-xs">Extra: {venta?.telefono_extra ?? "—"}</div>
                  </div>

                  <div>
                    <div className="text-white/40 text-xs mb-1">Producto</div>
                    <div className="text-white/80">
                      {venta?.tipo_producto ?? "—"} · {venta?.meses ?? "—"}m
                    </div>
                    <div className="text-white/55">
                      ${String(venta?.monto ?? "—")} · {String(venta?.interes ?? "—")}%
                    </div>
                  </div>

                  <div>
                    <div className="text-white/40 text-xs mb-1">Fechas</div>
                    <div className="text-white/80">Lead: {fmtDate(venta?.fecha_lead)}</div>
                    <div className="text-white/55">Venta: {fmtDate(venta?.fecha_venta)}</div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-white/40 text-xs mb-1">Relación</div>
                    <div className="text-white/70">
                      lead_id:{" "}
                      <span className="text-white/85 font-semibold">
                        {venta?.lead_id ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lead */}
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-black/25">
                  <div className="text-white/80 font-semibold">Datos del lead</div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/70">
                  <div>
                    <div className="text-white/40 text-xs mb-1">Nombre</div>
                    <div className="text-white/85 font-semibold">
                      {(lead?.nombre ?? "—") + (lead?.apellido ? ` ${lead.apellido}` : "")}
                    </div>
                  </div>

                  <div>
                    <div className="text-white/40 text-xs mb-1">Origen / Estado</div>
                    <div className="text-white/80">{lead?.origen ?? "—"}</div>
                    <div className="text-white/55">{lead?.estado ?? "—"}</div>
                  </div>

                  <div>
                    <div className="text-white/40 text-xs mb-1">Contacto</div>
                    <div className="text-white/80">{lead?.correo ?? "—"}</div>
                    <div className="text-white/55">Tel: {lead?.telefono ?? "—"}</div>
                  </div>

                  <div>
                    <div className="text-white/40 text-xs mb-1">País</div>
                    <div className="text-white/80">
                      {lead?.pais ?? "—"} {lead?.codigo_pais ? `(${lead.codigo_pais})` : ""}
                    </div>
                  </div>

                  <div>
                    <div className="text-white/40 text-xs mb-1">Inversión</div>
                    <div className="text-white/80">
                      Meses: {lead?.meses_inversion ?? "—"}
                    </div>
                    <div className="text-white/55">
                      Monto: ${String(lead?.monto_inversion ?? "—")}
                    </div>
                  </div>

                  <div>
                    <div className="text-white/40 text-xs mb-1">Fecha lead</div>
                    <div className="text-white/80">{fmtDate(lead?.fecha ?? null)}</div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-black/25 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-white/80 font-semibold">Notas</div>
                    <div className="text-white/50 text-xs">
                      Total: <span className="text-white/80 font-semibold">{notes.length}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setNoteErr("");
                      setShowNoteForm((v) => !v);
                    }}
                    className="px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/20 text-white font-semibold hover:bg-emerald-500/30 transition"
                  >
                    {showNoteForm ? "Cerrar" : "Agregar nota"}
                  </button>
                </div>

                {showNoteForm && (
                  <div className="p-4 border-b border-white/10 bg-black/20">
                    <label className="block text-white/70 text-xs mb-2">
                      Nueva nota
                    </label>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-black/25 text-white focus:ring-2 focus:ring-emerald-400/30 focus:outline-none"
                      placeholder="Escribe el seguimiento, estatus, próximo paso, etc..."
                    />

                    {noteErr && (
                      <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-200 text-sm">
                        {noteErr}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setShowNoteForm(false);
                          setNoteText("");
                          setNoteErr("");
                        }}
                        className="px-4 py-2 rounded-xl border border-white/10 text-white/80 hover:bg-white/5"
                        disabled={noteSaving}
                      >
                        Cancelar
                      </button>

                      <button
                        onClick={handleAddNote}
                        disabled={noteSaving}
                        className={[
                          "px-5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/20 text-white font-semibold hover:bg-emerald-500/30 transition",
                          noteSaving ? "opacity-60 cursor-not-allowed" : "",
                        ].join(" ")}
                      >
                        {noteSaving ? "Guardando..." : "Guardar nota"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {notes.length === 0 ? (
                    <div className="text-white/50">No hay notas todavía.</div>
                  ) : (
                    <div className="space-y-4">
                      {notes.map((n, idx) => {
                        const when = n.creado_en ?? n.fecha_hora ?? null;
                        const txt = pickNoteText(n) || "(Sin contenido)";
                        return (
                          <div
                            key={String(n.id ?? idx)}
                            className="rounded-2xl border border-white/10 bg-black/25 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-white/40 text-xs">
                                {fmtDate(when)}
                              </div>
                              <div className="text-white/40 text-xs">
                                Autor:{" "}
                                <span className="text-white/70 font-semibold">
                                  {n.autor_id ?? n.asesor_id ?? "—"}
                                </span>
                              </div>
                            </div>

                            <div className="mt-2 text-white/85 text-sm whitespace-pre-wrap">
                              {txt}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="mt-8 h-px w-full bg-emerald-500/15" />
        </div>
      </div>
    </div>
  );
}