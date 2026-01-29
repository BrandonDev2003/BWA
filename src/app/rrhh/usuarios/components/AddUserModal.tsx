"use client";

import { useState, useEffect } from "react";
import { generarPassword } from "@/lib/utils";

interface UsuarioModalProps {
  onClose: () => void;
  onSave: (usuario: any) => void;
  user?: any; // Para editar
}

export default function UsuarioModal({ onClose, onSave, user }: UsuarioModalProps) {
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    cedula: "",
    rol: "asesor",
    password: generarPassword(),
    // Otros campos que quieras agregar:
    telefono: "",
    direccion: "",
    notas: "",
  });

  // Si recibimos user, precargamos datos para editar
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        ...user,
        password: user.password || prev.password || generarPassword(),
      }));
    }
  }, [user]);

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    await onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-[480px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-center">
          {user ? "Editar Usuario" : "Agregar Usuario"}
        </h2>

        {/* Nombre */}
        <label className="block mb-2 text-sm text-gray-300">Nombre</label>
        <input
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white mb-4"
          value={form.nombre}
          onChange={(e) => handleChange("nombre", e.target.value)}
        />

        {/* Correo */}
        <label className="block mb-2 text-sm text-gray-300">Correo</label>
        <input
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white mb-4"
          value={form.correo}
          onChange={(e) => handleChange("correo", e.target.value)}
        />

        {/* Cédula */}
        <label className="block mb-2 text-sm text-gray-300">Cédula</label>
        <input
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white mb-4"
          value={form.cedula}
          onChange={(e) => handleChange("cedula", e.target.value)}
        />

        {/* Rol */}
        <label className="block mb-2 text-sm text-gray-300">Rol</label>
        <select
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white mb-4"
          value={form.rol}
          onChange={(e) => handleChange("rol", e.target.value)}
        >
          <option value="asesor">Asesor</option>
          <option value="admin">Administrador</option>
          <option value="rrhh">RRHH</option>
          <option value="SpA">SpA</option>
        </select>

        {/* Password */}
        <label className="block mb-2 text-sm text-gray-300">Contraseña</label>
        <div className="flex mb-4">
          <input
            className="w-full p-2 rounded-l bg-gray-800 border border-gray-700 text-white"
            value={form.password}
            readOnly
          />
          <button
            type="button"
            onClick={() => handleChange("password", generarPassword())}
            className="px-3 bg-purple-600 rounded-r hover:bg-purple-700"
          >
            🔄
          </button>
        </div>

        {/* Campos adicionales */}
        <label className="block mb-2 text-sm text-gray-300">Teléfono</label>
        <input
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white mb-4"
          value={form.telefono}
          onChange={(e) => handleChange("telefono", e.target.value)}
        />

        <label className="block mb-2 text-sm text-gray-300">Dirección</label>
        <input
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white mb-4"
          value={form.direccion}
          onChange={(e) => handleChange("direccion", e.target.value)}
        />

        <label className="block mb-2 text-sm text-gray-300">Notas</label>
        <textarea
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white mb-4"
          value={form.notas}
          onChange={(e) => handleChange("notas", e.target.value)}
        />

        {/* Botones */}
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
