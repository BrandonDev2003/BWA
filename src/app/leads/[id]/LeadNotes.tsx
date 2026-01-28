"use client";

import { useEffect, useState } from "react";
import LeadNoteItem from "./LeadNoteItem";

interface Note {
  id: number;
  contenido: string;
  fecha: string;
  autor: string;
}

export default function LeadNotes({ leadId }: { leadId: number }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchNotes() {
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`);
      const data = await res.json();
      if (data.ok) setNotes(data.notes);
    } catch (error) {
      console.error("Error cargando notas:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: newNote }),
      });
      const data = await res.json();
      if (data.ok) {
        setNotes((prev) => [data.note, ...prev]);
        setNewNote("");
      }
    } catch (error) {
      console.error("Error guardando nota:", error);
    }
  }

  useEffect(() => {
    fetchNotes();
  }, [leadId]);

  return (
    <section className="bg-gray-100 border border-gray-300 rounded-xl p-6 shadow-sm">
      <h2 className="text-2xl font-semibold mb-4 text-black">Historial de notas</h2>

      {/* Nueva nota */}
      <div className="mb-4">
        <textarea
          className="w-full p-3 border border-gray-400 rounded-lg text-black resize-none"
          rows={3}
          placeholder="Escribe una observación..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleAddNote}
            disabled={!newNote.trim()}
            className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50"
          >
            Registrar nota
          </button>
        </div>
      </div>

      {/* Listado de notas */}
      {loading ? (
        <p className="text-gray-500">Cargando notas...</p>
      ) : notes.length === 0 ? (
        <p className="text-gray-500">Aún no hay notas registradas.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <LeadNoteItem key={note.id} note={note} />
          ))}
        </ul>
      )}
    </section>
  );
}
