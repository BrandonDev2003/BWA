"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  estado: "pendiente" | "contactado" | "cerrado" | "venta";

  asignado_a?: number | null;
  nombre_asesor?: string | null;

  fecha?: string | null; // fecha lead
};

type TipoProducto = "plazo_fijo" | "profuturo";

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

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

  // ===== Panel Venta =====
  const [ventaOpen, setVentaOpen] = useState(false);

  const [tipoProducto, setTipoProducto] = useState<TipoProducto>("plazo_fijo");
  const [meses, setMeses] = useState<number>(12);
  const [monto, setMonto] = useState<number>(2000);
  const [interes, setInteres] = useState<number>(1);
  const [telefonoExtra, setTelefonoExtra] = useState<string>("");

  const [fechaVenta, setFechaVenta] = useState<string>(() =>
    toDatetimeLocalValue(new Date())
  );

  const [savingVenta, setSavingVenta] = useState(false);
  const [ventaError, setVentaError] = useState<string>("");

  // ===== Reglas por producto (SIN useMemo para no romper hooks) =====
  const reglas =
    tipoProducto === "plazo_fijo"
      ? {
          mesesOptions: [12],
          minMonto: 2000,
          interesFijo: false,
          interesMin: 1,
          interesMax: 3,
        }
      : {
          mesesOptions: [36, 48, 60],
          minMonto: 5000,
          interesFijo: true,
          interesMin: 3,
          interesMax: 3,
        };

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
     Ajustes automáticos al cambiar producto
  ============================================================ */
  useEffect(() => {
    setVentaError("");

    // meses default
    setMeses(reglas.mesesOptions[0]);

    // monto al mínimo
    setMonto((prev) => {
      const next = Number.isFinite(prev) ? prev : reglas.minMonto;
      return next < reglas.minMonto ? reglas.minMonto : next;
    });

    // interés fijo o capado
    if (reglas.interesFijo) {
      setInteres(3);
    } else {
      setInteres((prev) => {
        const next = Number.isFinite(prev) ? prev : 1;
        if (next < 1) return 1;
        if (next > 3) return 3;
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoProducto]);

  /* ===========================================================
     CARGAR LEAD + NOTAS
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
          leadJson?.lead && typeof leadJson?.lead === "object"
            ? leadJson.lead
            : leadJson;

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

        // resolver nombre asesor si falta
        let resolvedLead = { ...leadData };
        if (!resolvedLead.nombre_asesor && resolvedLead.asignado_a) {
          try {
            const uRes = await fetch(`/api/users/${resolvedLead.asignado_a}`, {
              credentials: "include",
              cache: "no-store",
            });
            if (uRes.ok) {
              const uJson = await uRes.json();
              const u = uJson?.user ?? uJson;
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
     Helpers (NO hooks)
  ============================================================ */
  const asignado =
    lead?.nombre_asesor?.trim()
      ? lead.nombre_asesor
      : lead?.asignado_a
      ? `Usuario #${lead.asignado_a}`
      : "Sin asignar";

  const fechaFmt = lead?.fecha
    ? new Date(lead.fecha).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const leadFullName = lead
    ? `${lead.nombre} ${lead.apellido || ""}`.trim()
    : "";

  /* ===========================================================
     CAMBIAR ESTADO
     ✅ abre panel venta si selecciona venta
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

      if (nuevoEstado === "venta") setVentaOpen(true);
      else setVentaOpen(false);
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

  /* ===========================================================
     GUARDAR VENTA -> POST lead_efectivos
  ============================================================ */
  const handleSubmitVenta = async () => {
    if (!lead) return;

    setVentaError("");

    const montoNum = Number(monto);
    const interesNum = Number(interes);

    if (!Number.isFinite(montoNum) || montoNum < reglas.minMonto) {
      setVentaError(`El monto mínimo para este producto es ${reglas.minMonto}.`);
      return;
    }

    if (!reglas.interesFijo) {
      if (!Number.isFinite(interesNum) || interesNum < 1 || interesNum > 3) {
        setVentaError("El interés debe estar entre 1% y 3%.");
        return;
      }
    }

    if (!fechaVenta) {
      setVentaError("Selecciona la fecha de venta.");
      return;
    }

    const payload = {
      lead_id: lead.id,
      nombre: leadFullName,
      correo: lead.correo,
      telefono: `${lead.codigo_pais || ""} ${lead.telefono || ""}`.trim(),
      telefono_extra: telefonoExtra?.trim() || null,
      pais: lead.pais || null,
      asignado_a: lead.asignado_a ?? null,

      tipo_producto: tipoProducto,
      meses,
      monto: montoNum,
      interes: reglas.interesFijo ? 3 : interesNum,

      fecha_lead: lead.fecha ? new Date(lead.fecha).toISOString().slice(0, 10) : null,
      fecha_venta: new Date(fechaVenta).toISOString(),
    };

    try {
      setSavingVenta(true);

      const res = await fetch("/api/lead-efectivos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setVentaError("No se pudo guardar la venta.");
        return;
      }

      setVentaOpen(false);
      setVentaError("");
    } catch (e) {
      console.error(e);
      setVentaError("Error inesperado guardando la venta.");
    } finally {
      setSavingVenta(false);
    }
  };

  /* ===========================================================
     ESTADOS DE CARGA (DESPUÉS DE TODOS LOS HOOKS)
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


        <div className="flex-1 p-6 relative">
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
                      Fecha:{" "}
                      <span className="text-white/85 font-semibold">{fechaFmt}</span>
                    </>
                  ) : (
                    <>
                      Fecha: <span className="text-white/40">—</span>
                    </>
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
                      : lead.estado === "cerrado"
                      ? "bg-emerald-500/20 text-emerald-100 border-emerald-400/20"
                      : "bg-sky-500/20 text-sky-100 border-sky-400/20",
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
                  <option value="venta" className="bg-[#0B0D10] text-white">
                    Venta
                  </option>
                </select>

                {lead.estado === "venta" && (
                  <button
                    onClick={() => setVentaOpen(true)}
                    className="ml-2 px-4 py-2 rounded-full bg-sky-500/20 border border-sky-400/20 text-white font-semibold hover:bg-sky-500/30 transition"
                  >
                    Ver venta
                  </button>
                )}
              </div>
            </div>

            {/* BODY */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/85">
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
                  <div className="space-y-2">
                    <p>
                      <span className="text-white/60">Correo:</span>{" "}
                      <span className="text-white/90 font-semibold">
                        {lead.correo || "—"}
                      </span>
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
                      <span className="text-white/90 font-semibold">
                        {lead.origen || "—"}
                      </span>
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

          {/* ==========================
              PANEL LATERAL - VENTA
          =========================== */}
          <div
            className={[
              "fixed top-0 right-0 h-full w-full sm:w-[520px] z-50 transition-transform duration-300",
              ventaOpen ? "translate-x-0" : "translate-x-full",
            ].join(" ")}
          >
            {/* Overlay */}
            <div
              className={[
                "fixed inset-0 bg-black/60 transition-opacity duration-300",
                ventaOpen ? "opacity-100" : "opacity-0 pointer-events-none",
              ].join(" ")}
              onClick={() => setVentaOpen(false)}
            />

            {/* Panel */}
            <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] border-l border-white/10 bg-[#0B0D10]/95 backdrop-blur-2xl shadow-2xl p-6 overflow-y-auto">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-bold text-white">Venta</h3>
                  <p className="text-white/50 text-sm mt-1">
                    Completa los datos del producto vendido.
                  </p>
                </div>
                <button
                  onClick={() => setVentaOpen(false)}
                  className="px-3 py-2 rounded-xl border border-white/10 text-white/80 hover:bg-white/5"
                >
                  Cerrar
                </button>
              </div>

              {/* Auto info */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-white/85">
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-white/60">Nombre:</span>{" "}
                    <span className="text-white/90 font-semibold">{leadFullName}</span>
                  </p>
                  <p>
                    <span className="text-white/60">Correo:</span>{" "}
                    <span className="text-white/90 font-semibold">{lead.correo}</span>
                  </p>
                  <p>
                    <span className="text-white/60">Teléfono:</span>{" "}
                    <span className="text-white/90 font-semibold">
                      {`${lead.codigo_pais || ""} ${lead.telefono || ""}`.trim() || "—"}
                    </span>
                  </p>
                  <p>
                    <span className="text-white/60">País:</span>{" "}
                    <span className="text-white/90 font-semibold">{lead.pais || "—"}</span>
                  </p>
                  <p>
                    <span className="text-white/60">Asignado a:</span>{" "}
                    <span className="text-white/90 font-semibold">{asignado}</span>
                  </p>
                  <p>
                    <span className="text-white/60">Fecha lead:</span>{" "}
                    <span className="text-white/90 font-semibold">{fechaFmt || "—"}</span>
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Teléfono extra (opcional)
                    </label>
                    <input
                      value={telefonoExtra}
                      onChange={(e) => setTelefonoExtra(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/25 text-white placeholder:text-white/40 focus:ring-2 focus:ring-sky-400/30 focus:outline-none"
                      placeholder="Ej: +507 69998877"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm mb-2">Producto</label>
                    <select
                      value={tipoProducto}
                      onChange={(e) => setTipoProducto(e.target.value as TipoProducto)}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/25 text-white focus:ring-2 focus:ring-sky-400/30 focus:outline-none"
                    >
                      <option value="plazo_fijo" className="bg-[#0B0D10] text-white">
                        Plazo fijo
                      </option>
                      <option value="profuturo" className="bg-[#0B0D10] text-white">
                        Profuturo
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm mb-2">Meses</label>
                    <select
                      value={meses}
                      onChange={(e) => setMeses(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/25 text-white focus:ring-2 focus:ring-sky-400/30 focus:outline-none"
                    >
                      {reglas.mesesOptions.map((m) => (
                        <option key={m} value={m} className="bg-[#0B0D10] text-white">
                          {m} {m === 12 ? "(1 año)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Monto (mínimo {reglas.minMonto})
                    </label>
                    <input
                      type="number"
                      min={reglas.minMonto}
                      step="1"
                      value={monto}
                      onChange={(e) => setMonto(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/25 text-white focus:ring-2 focus:ring-sky-400/30 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Interés {reglas.interesFijo ? "(fijo)" : "(1% a 3%)"}
                    </label>
                    <input
                      type="number"
                      min={reglas.interesMin}
                      max={reglas.interesMax}
                      step="0.1"
                      value={interes}
                      disabled={reglas.interesFijo}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!Number.isFinite(v)) return;
                        if (v < 1) setInteres(1);
                        else if (v > 3) setInteres(3);
                        else setInteres(v);
                      }}
                      className={[
                        "w-full px-4 py-3 rounded-xl border border-white/10 bg-black/25 text-white focus:ring-2 focus:ring-sky-400/30 focus:outline-none",
                        reglas.interesFijo ? "opacity-70 cursor-not-allowed" : "",
                      ].join(" ")}
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Fecha de venta
                    </label>
                    <input
                      type="datetime-local"
                      value={fechaVenta}
                      onChange={(e) => setFechaVenta(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/25 text-white focus:ring-2 focus:ring-sky-400/30 focus:outline-none"
                    />
                  </div>

                  {ventaError && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-200 text-sm">
                      {ventaError}
                    </div>
                  )}

                  <button
                    onClick={handleSubmitVenta}
                    disabled={savingVenta}
                    className={[
                      "mt-2 px-5 py-3 rounded-full bg-sky-500/20 border border-sky-400/20 text-white font-semibold hover:bg-sky-500/30 transition",
                      savingVenta ? "opacity-60 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    {savingVenta ? "Guardando..." : "Guardar venta"}
                  </button>
                </div>
              </div>

              <div className="mt-4 text-xs text-white/40">
                * Esto enviará la venta a{" "}
                <span className="text-white/60">/api/lead-efectivos</span>.
              </div>
            </div>
          </div>
          {/* FIN PANEL */}
        </div>
      </div>
    </div>
  );
}
