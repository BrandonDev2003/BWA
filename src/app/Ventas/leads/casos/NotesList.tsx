"use client";

import { motion } from "framer-motion";

interface Note {
  id: number;
  contenido: string;
  fecha_hora: string;
  autor_id?: number;
}

export default function NotesList({ notas }: { notas: Note[] }) {
  if (notas.length === 0)
    return (
      <p className="text-center text-gray-500 mt-6">
        No hay notas registradas para este caso.
      </p>
    );

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mt-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-700">Notas del caso</h2>
      <div className="space-y-3">
        {notas.map((nota) => (
          <motion.div
            key={nota.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="border border-gray-200 rounded-lg p-3 bg-gray-50"
          >
            <p className="text-gray-800 whitespace-pre-line">{nota.contenido}</p>
            <div className="text-xs text-gray-500 mt-2">
              {new Date(nota.fecha_hora).toLocaleString()} — Autor #{nota.autor_id}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
