"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  cedula?: string;

  estado_expediente?: "COMPLETO" | "INCOMPLETO";
  faltantes?: string[];

  [key: string]: any;
}

interface UsuariosTableProps {
  usuarios: User[];
  onEdit?: (user: User) => void;
}

export default function UsuariosTable({ usuarios, onEdit }: UsuariosTableProps) {
  const router = useRouter();

  const [mailing, setMailing] = useState(false);
  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [otp, setOtp] = useState("");

  const handleView = (user: User) => {
    router.push(`/usuarios/${user.id}`);
  };

  const enviarOTP = async (user: User) => {
    try {
      setMailing(true);

      const res = await fetch("/api/auth/send-delete-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ correo: user.correo }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error enviando OTP");
        return;
      }

      setConfirmUser(user);
      alert("Código enviado a su correo");
    } catch (err) {
      console.error(err);
      alert("Error enviando OTP");
    } finally {
      setMailing(false);
    }
  };

  const eliminarUsuario = async () => {
    if (!confirmUser) return;

    try {
      const res = await fetch(`/api/usuarios/eliminar/${confirmUser.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          otp,
          correo: confirmUser.correo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "OTP incorrecto o expirado");
        return;
      }

      alert("Usuario eliminado correctamente");
      setConfirmUser(null);
      setOtp("");
      router.refresh();
    } catch (err) {
      console.error("Error eliminando usuario:", err);
      alert("Error eliminando usuario");
    }
  };

  return (
    <div className="rounded-2xl p-6 border border-white/10 bg-white/5 shadow-xl backdrop-blur-md">
      <div className="overflow-x-auto rounded-xl border border-white/10">
        {/* min-w para que no se aplaste en pantallas chicas */}
        <table className="w-full min-w-[900px] table-fixed text-sm text-white/90">
          <thead>
            <tr className="bg-black/40 text-white uppercase tracking-wide border-b border-white/10">
              <th className="p-4 text-left w-[22%]">👤 Nombre</th>
              <th className="p-4 text-left w-[28%]">📧 Correo</th>
              <th className="p-4 text-left w-[14%]">⚙️ Rol</th>
              <th className="p-4 text-left w-[16%]">📁 Expediente</th>
              <th className="p-4 text-left w-[20%]">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((u, i) => {
              const incompleto = u.estado_expediente === "INCOMPLETO";
              const faltantes = Array.isArray(u.faltantes) ? u.faltantes : [];
              const tooltipText =
                faltantes.length > 0
                  ? `Faltan: ${faltantes.join(", ")}`
                  : "Expediente incompleto";

              return (
                <tr
                  key={u.id}
                  className={[
                    "border-b border-white/10 transition-colors",
                    i % 2 === 0 ? "bg-white/[0.03]" : "bg-white/[0.02]",
                    "hover:bg-white/[0.06]",
                  ].join(" ")}
                >
                  <td className="p-4 font-medium text-white">
                    <span className="truncate block">{u.nombre}</span>
                  </td>

                  <td className="p-4 text-white/80">
                    <span className="truncate block">{u.correo}</span>
                  </td>

                  <td className="p-4">
                    <span className="inline-flex items-center bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/10">
                      {u.rol}
                    </span>
                  </td>

                  <td className="p-4">
                    {incompleto ? (
                      <span className="relative inline-block group">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500 text-black font-bold cursor-help select-none">
                          ?
                        </span>

                        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block whitespace-normal w-72 z-50 bg-black/90 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-white/10">
                          {tooltipText}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-emerald-300 font-semibold">
                        ✔ Completo
                      </span>
                    )}
                  </td>

                  {/* ✅ NO flex en td: flex adentro */}
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleView(u)}
                        className="bg-emerald-600/90 hover:bg-emerald-600 text-white px-3 py-1 rounded-md text-xs border border-white/10"
                      >
                        Ver
                      </button>

                      <button
                        onClick={() => onEdit && onEdit(u)}
                        className="bg-blue-600/90 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs border border-white/10"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => enviarOTP(u)}
                        disabled={mailing}
                        className="bg-red-600/90 hover:bg-red-600 disabled:opacity-60 text-white px-3 py-1 rounded-md text-xs border border-white/10"
                      >
                        {mailing ? "Enviando..." : "Borrar"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {usuarios.length === 0 && (
        <p className="text-center text-white/60 mt-6 text-sm">
          No hay asesores registrados.
        </p>
      )}

      {/* MODAL OTP */}
      {confirmUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md p-6 shadow-2xl text-center text-white">
            <h2 className="text-lg font-bold">Confirmar Eliminación</h2>
            <p className="text-sm mt-2 mb-4 text-white/80">
              Ingresa el código enviado a <b>{confirmUser.correo}</b>
            </p>

            <input
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Código OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <div className="flex justify-between gap-3 mt-4">
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10"
                onClick={() => {
                  setConfirmUser(null);
                  setOtp("");
                }}
              >
                Cancelar
              </button>

              <button
                className="flex-1 px-4 py-2 rounded-lg bg-red-600/90 hover:bg-red-600 text-white border border-white/10"
                onClick={eliminarUsuario}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
