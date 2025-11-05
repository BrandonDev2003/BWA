"use client";

import { useState, useEffect } from "react";

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
    } catch (err: any) {
      setMensaje("❌ Error al guardar la nota");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[400px] text-black">
        <h2 className="text-lg font-semibold mb-4">
          Registrar Nota – Lead #{leadId}
        </h2>

        {/* Estado */}
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="w-full border rounded-lg p-2 mb-3 text-black"
        >
          <option value="pendiente">Pendiente</option>
          <option value="contactado">Contactado</option>
          <option value="cerrado">Cerrado</option>
        </select>

        {/* Comentario */}
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Escribe un comentario..."
          className="w-full border rounded-lg p-2 h-24 mb-3 resize-none text-black placeholder-gray-500"
        />

        <button
          onClick={handleGuardar}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 w-full hover:bg-blue-700 transition"
        >
          Guardar
        </button>

        {mensaje && (
          <p className="text-center text-sm mt-2 text-black">{mensaje}</p>
        )}

        {/* Historial */}
        <div className="mt-4 border-t pt-3 max-h-40 overflow-y-auto">
          <h3 className="font-medium text-sm mb-2">Historial</h3>
          {historial.length === 0 ? (
            <p className="text-sm">Sin notas registradas</p>
          ) : (
            historial.map((n, i) => (
              <div
                key={i}
                className="border rounded-lg p-2 mb-2 text-sm bg-gray-100"
              >
                <p className="font-semibold capitalize">{n.estado}</p>
                <p>{n.comentario}</p>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 text-sm text-gray-500 hover:text-black w-full"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
