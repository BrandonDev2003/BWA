"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

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
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((data) => setUsers(Array.isArray(data.users) ? data.users : []))
      .catch((err) => console.error("Error al obtener asesores:", err));
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="
            fixed inset-0 z-50 flex items-center justify-center
            bg-black/70 backdrop-blur-md
          "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="
              relative w-[460px] max-w-[92vw]
              rounded-3xl
              border border-white/10
              bg-white/5
              backdrop-blur-2xl
              shadow-2xl
              overflow-hidden
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* overlay oscuro interno para evitar “lavado” */}
            <div className="pointer-events-none absolute inset-0 bg-black/25" />

            {/* header */}
            <div className="relative p-6 pb-4">
              <button
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
                onClick={onClose}
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-semibold text-white">
                Asignar lead a un asesor
              </h2>
              <p className="mt-1 text-sm text-white/60">
                Selecciona un asesor disponible para asignar el lead.
              </p>
            </div>

            {/* list */}
            <div className="relative px-6 pb-6">
              <div className="max-h-[320px] overflow-y-auto pr-1 space-y-2">
                {users.length === 0 ? (
                  <p className="text-white/50 text-center py-10">
                    No hay asesores disponibles.
                  </p>
                ) : (
                  users.map((user) => {
                    const active = selectedUser === user.id;
                    return (
                      <label
                        key={user.id}
                        className={[
                          "group flex items-start justify-between gap-4",
                          "px-4 py-3 rounded-2xl cursor-pointer",
                          "border transition",
                          active
                            ? "border-emerald-400/30 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(16,185,129,0.12)]"
                            : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20",
                        ].join(" ")}
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-white/90 truncate">
                            {user.nombre}
                          </p>
                          <p className="text-xs text-white/60 mt-1">
                            Rol: <span className="text-white/70">{user.rol}</span>
                          </p>
                          <p className="text-xs text-white/60">
                            Correo:{" "}
                            <span className="text-white/70 break-all">{user.correo}</span>
                          </p>
                        </div>

                        <input
                          type="radio"
                          checked={active}
                          onChange={() => setSelectedUser(user.id)}
                          className="mt-1 h-4 w-4 accent-emerald-400"
                        />
                      </label>
                    );
                  })
                )}
              </div>

              {/* action */}
              <button
                onClick={() => {
                  if (selectedUser) onAssign(selectedUser);
                }}
                disabled={!selectedUser}
                className={[
                  "mt-5 w-full py-2.5 rounded-2xl font-semibold",
                  "transition border",
                  selectedUser
                    ? "bg-emerald-500/90 hover:bg-emerald-500 text-black border-emerald-400/30"
                    : "bg-white/5 text-white/40 border-white/10 cursor-not-allowed",
                ].join(" ")}
              >
                Asignar
              </button>

              {/* hint */}
              {!selectedUser && (
                <p className="mt-3 text-xs text-white/40 text-center">
                  Selecciona un asesor para habilitar el botón.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
