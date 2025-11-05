"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, PlusCircle } from "lucide-react";
import Sidebar from "../usuarios/components/Sidebar";
import UsuariosTable from "../usuarios/components/UsuariosTable";
import UsuarioModal from "../usuarios/components/UsuarioModal";
import { useUsuarios } from "../usuarios/components/useUsuarios";

export default function UsuariosPage() {
  const { usuarios, agregarUsuario, cargarUsuarios } = useUsuarios();
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Cargar usuarios al montar solo una vez
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await cargarUsuarios();
      setLoading(false);
    };

    fetchData();
    // ⛔ Evita re-render infinitos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100 text-black overflow-hidden">
      {/* 🧭 Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* 🧩 Contenido principal */}
      <main className="flex-1 p-8 transition-all duration-300">
        {/* 🔹 Encabezado */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 bg-slate-400 rounded-lg hover:bg-[#24375c] transition"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-3xl font-bold">👥 Gestión de Asesores</h1>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-full shadow-lg transition-transform hover:scale-105"
          >
            <PlusCircle className="w-5 h-5" />
            Nuevo asesor
          </button>
        </div>

        {/* 🧾 Tabla de usuarios — transparente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-transparent border border-transparent rounded-2xl shadow-none p-6"
        >
          {loading ? (
            <p className="text-gray-400">Cargando usuarios...</p>
          ) : usuarios.length === 0 ? (
            <p className="text-gray-400 text-center py-10">
              No hay asesores registrados.
            </p>
          ) : (
            <UsuariosTable usuarios={usuarios} />
          )}
        </motion.div>
      </main>

      {/* 🪟 Modal de nuevo usuario */}
      {showModal && (
        <UsuarioModal
          onClose={() => setShowModal(false)}
          onAddUser={agregarUsuario}
        />
      )}
    </div>
  );
}
