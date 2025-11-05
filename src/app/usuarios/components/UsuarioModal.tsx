"use client";

import { useState } from "react";
import { User, Mail, Lock } from "lucide-react";

export default function UsuarioModal({
  onClose,
  onAddUser,
}: {
  onClose: () => void;
  onAddUser: (user: any) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  const generarPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    setPassword(pass);
  };

  const handleSubmit = async () => {
    if (!nombre || !correo || !password) return alert("Completa todos los campos");
    await onAddUser({ nombre, correo, password });
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-semibold mb-6 text-center">🆕 Nuevo Asesor</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
            <User className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="bg-transparent w-full outline-none text-white"
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
            <Mail className="w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="bg-transparent w-full outline-none text-white"
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
            <Lock className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent w-full outline-none text-white"
            />
            <button
              onClick={generarPassword}
              className="text-sm bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg"
            >
              Generar
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-full"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-full shadow"
          >
            Crear usuario
          </button>
        </div>
      </div>
    </div>
  );
}
