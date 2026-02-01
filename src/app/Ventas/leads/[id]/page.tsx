"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// ✅ Ajusta la ruta a tu Sidebar real
import Sidebar from "../components/Sidebar";

type Note = {
  id: number;
  contenido: string;
  autor_id: number;
  autor_nombre?: string;
  fecha_hora: string;
};

type Lead = {
  id: number;
  nombre: string;
  apellido?: string;
  correo: string;
  telefono: string;

  codigo_pais?: string;
  pais?: string;
  meses_inversion?: number;
  monto_inversion?: number;

  origen: string;
  estado: "pendiente" | "contactado" | "cerrado";

  asignado_a?: number | null;
  nombre_asesor?: string | null;

  fecha?: string | null;
};

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = Array.isArray(params.id) ? params.id[0] : params.id;

  const router = useRouter();

  const [validando, setValidando] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);

  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(true);

  /* ===========================================================
     VALIDAR SESIÓN + VALIDAR ROL OBLIGATORIO (NO TOCAR)
  ============================================================ */
  useEffect(() => {
    fetch("/api/auth/verify", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) {
          router.push("/login");
          return;
        }

        if (!data.user?.rol || data.user.rol.trim() === "") {
          router.push("/login");
          return;
        }

        setUsuario(data.user);
        setValidando(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  /* ===========================================================
     CARGAR LEAD + NOTAS
     ✅ Soporta respuesta { ok, lead } o lead directo
     ✅ Si no viene nombre_asesor, lo resuelve con /api/users/:id
  ============================================================ */
  useEffect(() => {
    if (!usuario) return;
    if (!leadId) return;

    async function cargarLead() {
      try {
        setLoading(true);

        const leadRes = await fetch(`/api/leads/${leadId}`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!leadRes.ok) {
          router.push("/no-autorizado");
          return;
        }

        const leadJson = await leadRes.json();

        const leadData: Lead | null =
          leadJson?.lead && typeof leadJson?.lead === "object" ? leadJson.lead : leadJson;

        if (!leadData?.id) {
          router.push("/no-autorizado");
          return;
        }

        // Restricción adicional: asesor solo ve sus leads
        const esAsesor = usuario.rol === "asesor";
        if (esAsesor && Number(leadData.asignado_a) !== Number(usuario.id)) {
          router.push("/no-autorizado");
          return;
        }

        // ✅ Si viene nombre_asesor desde backend, perfecto
        // ✅ Si NO viene, hacemos fetch al usuario asignado para traer users.nombre
        let resolvedLead = { ...leadData };
        if (!resolvedLead.nombre_asesor && resolvedLead.asignado_a) {
          try {
            const uRes = await fetch(`/api/users/${resolvedLead.asignado_a}`, {
              credentials: "include",
              cache: "no-store",
            });
            if (uRes.ok) {
              const uJson = await uRes.json();
              const u = uJson?.user ?? uJson; // soporta {ok,user} o user directo
              if (u?.nombre) resolvedLead.nombre_asesor = String(u.nombre);
            }
          } catch {}
        }

        setLead(resolvedLead);

        // notas
        const notesRes = await fetch(`/api/leads/${leadId}/notes`, {
          credentials: "include",
          cache: "no-store",
        });

        const notesData = await notesRes.json();
        setNotes(Array.isArray(notesData) ? notesData : []);
      } catch (err) {
        console.error(err);
        router.push("/no-autorizado");
      } finally {
        setLoading(false);
      }
    }

    cargarLead();
  }, [usuario, leadId, router]);

  /* ===========================================================
     ESTADOS DE CARGA
  ============================================================ */
  if (validando)
    return (
      <div className="flex justify-center items-center h-screen text-white">
        Validando acceso...
      </div>
    );

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-white/70">
        Cargando...
      </div>
    );

  if (!lead)
    return (
      <div className="flex justify-center items-center h-screen text-red-400">
        Lead no encontrado
      </div>
    );

  /* ===========================================================
     CAMBIAR ESTADO
     ✅ Soporta respuesta { ok, lead } o lead directo
  ============================================================ */
  const handleChangeEstado = async (nuevoEstado: string) => {
    if (!leadId) return;

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!res.ok) return;

      const updatedJson = await res.json();
      const updatedLead =
        updatedJson?.lead && typeof updatedJson?.lead === "object"
          ? updatedJson.lead
          : updatedJson;

      if (updatedLead?.estado) {
        setLead((prev) =>
          prev ? { ...prev, estado: updatedLead.estado } : prev
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ===========================================================
     AGREGAR NOTA
  ============================================================ */
  const handlePostNote = async () => {
    if (!noteText.trim()) return;

    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ contenido: noteText }),
      });

      if (!res.ok) return;

      const updatedNotes = await fetch(`/api/leads/${leadId}/notes`, {
        credentials: "include",
        cache: "no-store",
      }).then((r) => r.json());

      setNotes(Array.isArray(updatedNotes) ? updatedNotes : []);
      setNoteText("");
    } catch (err) {
      console.error(err);
    }
  };

  const asignado =
    lead.nombre_asesor?.trim()
      ? lead.nombre_asesor
      : lead.asignado_a
      ? `Usuario #${lead.asignado_a}`
      : "Sin asignar";

  const fechaFmt = lead.fecha
    ? new Date(lead.fecha).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `url(/fondobg.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex min-h-screen bg-black/55">
        {/* SIDEBAR */}
        <Sidebar />

        {/* CONTENT */}
        <div className="flex-1 p-6">
          <div className="mx-auto w-full max-w-5xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden">
            {/* TOP BAR */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-6 border-b border-white/10 bg-black/25">
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {lead.nombre} {lead.apellido || ""}
                </h2>
                <div className="text-sm text-white/60 mt-1">
                  {fechaFmt ? (
                    <>
                      Fecha: <span className="text-white/85 font-semibold">{fechaFmt}</span>
                    </>
                  ) : (
                    <>Fecha: <span className="text-white/40">—</span></>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-white/70 font-semibold">Estado:</span>
                <select
                  value={lead.estado}
                  onChange={(e) => handleChangeEstado(e.target.value)}
                  className={[
                    "px-4 py-2 rounded-full font-semibold text-sm outline-none border",
                    lead.estado === "pendiente"
                      ? "bg-yellow-500/20 text-yellow-100 border-yellow-400/20"
                      : lead.estado === "contactado"
                      ? "bg-amber-500/20 text-amber-100 border-amber-400/20"
                      : "bg-emerald-500/20 text-emerald-100 border-emerald-400/20",
                  ].join(" ")}
                >
                  <option value="pendiente" className="bg-[#0B0D10] text-white">
                    Pendiente
                  </option>
                  <option value="contactado" className="bg-[#0B0D10] text-white">
                    Contactado
                  </option>
                  <option value="cerrado" className="bg-[#0B0D10] text-white">
                    Cerrado
                  </option>
                </select>
              </div>
            </div>

            {/* BODY */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/85">
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
                  <div className="space-y-2">
                    <p>
                      <span className="text-white/60">Correo:</span>{" "}
                      <span className="text-white/90 font-semibold">{lead.correo || "—"}</span>
                    </p>
                    <p>
                      <span className="text-white/60">Teléfono:</span>{" "}
                      <span className="text-white/90 font-semibold">
                        {lead.codigo_pais || ""} {lead.telefono || "—"}
                      </span>
                    </p>
                    <p>
                      <span className="text-white/60">País:</span>{" "}
                      <span className="text-white/90 font-semibold">{lead.pais || "—"}</span>
                    </p>
                    <p>
                      <span className="text-white/60">Origen:</span>{" "}
                      <span className="text-white/90 font-semibold">{lead.origen || "—"}</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
                  <div className="space-y-2">
                    <p>
                      <span className="text-white/60">Meses inversión:</span>{" "}
                      <span className="text-white/90 font-semibold">
                        {lead.meses_inversion ?? "—"}
                      </span>
                    </p>
                    <p>
                      <span className="text-white/60">Monto inversión:</span>{" "}
                      <span className="text-white/90 font-semibold">
                        ${lead.monto_inversion ?? "—"}
                      </span>
                    </p>
                    <p>
                      <span className="text-white/60">Asignado a:</span>{" "}
                      <span className="text-white/90 font-semibold">{asignado}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* AGREGAR NOTA */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
                <label className="block mb-2 font-semibold text-white/85">
                  Agregar nota:
                </label>
                <textarea
                  className="w-full p-3 rounded-xl border border-white/10 bg-black/25 text-white placeholder:text-white/40 focus:ring-2 focus:ring-emerald-400/30 focus:outline-none"
                  rows={3}
                  placeholder="Escribe aquí tu nota..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <button
                  onClick={handlePostNote}
                  className="mt-3 px-5 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/20 text-white font-semibold hover:bg-emerald-500/30 transition"
                >
                  Guardar nota
                </button>
              </div>

              {/* HISTORIAL */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
                <h3 className="text-2xl font-bold mb-4 text-white">
                  Historial de notas
                </h3>

                {notes.length === 0 ? (
                  <p className="text-white/50">No hay notas aún.</p>
                ) : (
                  <ul className="space-y-4">
                    {notes.map((n) => (
                      <li
                        key={`${n.id}-${n.fecha_hora}`}
                        className="p-4 rounded-2xl border border-white/10 bg-black/20"
                      >
                        <div className="text-white/85">{n.contenido}</div>

                        <div className="mt-2 text-xs text-white/50">
                          Por: {n.autor_nombre || `Usuario #${n.autor_id}`} ·{" "}
                          {new Date(n.fecha_hora).toLocaleString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
  