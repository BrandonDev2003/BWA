"use client";

import { useState } from "react";
import { generarPassword } from "@/lib/utils";

export default function AddUserModal({ onClose, onSave }: any) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState(generarPassword());

  const handleSubmit = async () => {
    await onSave({ nombre, correo, password });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-[400px]">
        <h2 className="text-xl font-bold mb-4 text-center">Agregar Asesor</h2>

        <label className="block mb-2 text-sm text-gray-300">Nombre</label>
        <input
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white mb-4"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <label className="block mb-2 text-sm text-gray-300">Correo</label>
        <input
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white mb-4"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />

        <label className="block mb-2 text-sm text-gray-300">
          Contraseña generada
        </label>
        <div className="flex mb-4">
          <input
            className="w-full p-2 rounded-l bg-gray-800 border border-gray-700 text-white"
            value={password}
            readOnly
          />
          <button
            onClick={() => setPassword(generarPassword())}
            className="px-3 bg-purple-600 rounded-r hover:bg-purple-700"
          >
            🔄
          </button>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
