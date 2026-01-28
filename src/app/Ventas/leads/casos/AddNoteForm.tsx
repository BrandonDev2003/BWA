"use client";

import { useState } from "react";

interface AddNoteFormProps {
  leadId: number;
  onNotaCreada: (nota: any) => void;
}

export default function AddNoteForm({ leadId, onNotaCreada }: AddNoteFormProps) {
  const [contenido, setContenido] = useState("");
  const [loading, setLoading] = useState(false);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenido.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contenido }),
      });

      const data = await res.json();
      if (res.ok) {
        onNotaCreada(data);
        setContenido("");
      } else {
        alert(data.error || "Error al crear nota");
      }
    } catch (error) {
      console.error("Error creando nota:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-md p-6 space-y-3"
    >
      <h2 className="text-lg font-semibold text-gray-700">Agregar nota</h2>
      <textarea
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        rows={3}
        placeholder="Escribe una nota..."
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar nota"}
      </button>
    </form>
  );
}
