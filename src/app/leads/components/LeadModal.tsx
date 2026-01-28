"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface LeadModalProps {
  leadId: number;
  onClose: () => void;
}

export default function LeadModal({ leadId, onClose }: LeadModalProps) {
  const [estado, setEstado] = useState("pendiente");
  const [comentario, setComentario] = useState("");
  const [historial, setHistorial] = useState<any[]>([]);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const fetchNotas = async () => {
      const res = await fetch(`/api/leads/${leadId}/notes`);
      const data = await res.json();
      if (Array.isArray(data)) setHistorial(data);
    };
    fetchNotas();
  }, [leadId]);

  const handleGuardar = async () => {
    if (!comentario.trim()) return;

    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado, comentario }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar nota");

      setHistorial((prev) => [...prev, data]);
      setComentario("");
      setMensaje("✅ Nota guardada correctamente");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("❌ Error al guardar la nota");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="
          relative w-[520px] max-w-[95vw]
          rounded-3xl
          border border-white/10
          bg-white/5
          backdrop-blur-2xl
          shadow-2xl
          overflow-hidden
          text-white
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* overlay oscuro interno */}
        <div className="pointer-events-none absolute inset-0 bg-black/25" />

        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={onClose}
            className="
              absolute right-4 top-4
              h-9 w-9 rounded-full
              border border-white/10
              bg-black/30
              text-white/70
              hover:text-white hover:bg-black/45 hover:border-white/20
              transition
              flex items-center justify-center
            "
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-lg font-semibold text-white">
            Registrar Nota – Lead #{leadId}
          </h2>
          <p className="mt-1 text-sm text-white/60">
            Actualiza el estado y deja una nota para el historial.
          </p>
        </div>

        {/* Form */}
        <div className="relative px-6 pb-6">
          {/* Estado */}
          <label className="block text-xs font-semibold text-white/50 mb-2">
            ESTADO
          </label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="
              w-full
              rounded-2xl
              border border-white/10
              bg-black/25
              px-4 py-3
              text-sm text-white/90
              outline-none
              focus:border-emerald-400/30 focus:ring-2 focus:ring-emerald-500/15
              transition
            "
          >
            <option className="bg-[#0B0D10]" value="pendiente">Pendiente</option>
            <option className="bg-[#0B0D10]" value="contactado">Contactado</option>
            <option className="bg-[#0B0D10]" value="cerrado">Cerrado</option>
          </select>

          {/* Comentario */}
          <label className="block text-xs font-semibold text-white/50 mt-4 mb-2">
            COMENTARIO
          </label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Escribe un comentario..."
            className="
              w-full h-28 resize-none
              rounded-2xl
              border border-white/10
              bg-black/20
              px-4 py-3
              text-sm text-white/90 placeholder:text-white/35
              outline-none
              focus:border-emerald-400/30 focus:ring-2 focus:ring-emerald-500/15
              transition
            "
          />

          {/* Guardar */}
          <button
            onClick={handleGuardar}
            disabled={!comentario.trim()}
            className={[
              "mt-4 w-full py-2.5 rounded-2xl font-semibold transition border",
              comentario.trim()
                ? "bg-emerald-500/90 hover:bg-emerald-500 text-black border-emerald-400/30"
                : "bg-white/5 text-white/40 border-white/10 cursor-not-allowed",
            ].join(" ")}
          >
            Guardar
          </button>

          {mensaje && (
            <p className="text-center text-sm mt-3 text-white/80">{mensaje}</p>
          )}

          {/* Historial */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-white/80">Historial</h3>
              <span className="text-xs text-white/40">
                {historial.length} nota(s)
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-3 max-h-44 overflow-y-auto space-y-2">
              {historial.length === 0 ? (
                <p className="text-sm text-white/50 text-center py-6">
                  Sin notas registradas
                </p>
              ) : (
                historial.map((n, i) => (
                  <div
                    key={i}
                    className="
                      rounded-2xl
                      border border-white/10
                      bg-white/5
                      px-4 py-3
                      text-sm
                    "
                  >
                    <p className="font-semibold capitalize text-white/90">
                      {n.estado}
                    </p>
                    <p className="text-white/70 mt-1">{n.comentario}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cerrar */}
          <button
            onClick={onClose}
            className="
              mt-4 w-full text-sm
              text-white/60 hover:text-white
              transition
            "
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
