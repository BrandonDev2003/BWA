"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XCircle } from "lucide-react";

export interface User {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
}

interface AssignUsersProps {
  isOpen: boolean;
  onAssign: (userId: number) => void;
  onClose: () => void;
}

export default function AssignUsers({ isOpen, onAssign, onClose }: AssignUsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    fetch("/api/users/asesores", { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then(data => setUsers(Array.isArray(data.users) ? data.users : []))
      .catch(err => console.error("Error al obtener asesores:", err));
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-gray-300 rounded-2xl shadow-2xl w-[420px] p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-black transition"
              onClick={onClose}
            >
              <XCircle className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-semibold mb-4 text-center text-gray-800">
              Asignar lead a un asesor
            </h2>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {users.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No hay asesores disponibles.</p>
              ) : (
                users.map(user => (
                  <label
                    key={user.id}
                    className={`flex flex-col justify-between px-4 py-3 rounded-lg cursor-pointer border transition ${
                      selectedUser === user.id
                        ? "border-black bg-blue-100"
                        : "border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{user.nombre}</p>
                      <p className="text-sm text-gray-700">Rol: {user.rol}</p>
                      <p className="text-sm text-gray-700">Correo: {user.correo}</p>
                    </div>
                    <input
                      type="radio"
                      checked={selectedUser === user.id}
                      onChange={() => setSelectedUser(user.id)}
                      className="mt-2 accent-green-600"
                    />
                  </label>
                ))
              )}
            </div>

            <button
              onClick={() => {
                if (selectedUser) onAssign(selectedUser);
              }}
              disabled={!selectedUser}
              className={`mt-6 w-full py-2 rounded-lg font-semibold transition ${
                selectedUser
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-gray-400 text-gray-700 cursor-not-allowed"
              }`}
            >
              Asignar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
