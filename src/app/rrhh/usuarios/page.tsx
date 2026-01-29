"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, PlusCircle } from "lucide-react";

import Sidebar from "../usuarios/components/Sidebar";
import UsuariosTable from "../usuarios/components/UsuariosTable";
import UsuarioModal from "../usuarios/components/UsuarioModal";
import { useUsuarios, User } from "../usuarios/components/useUsuarios";

export default function UsuariosPage() {
  const router = useRouter();
  const { usuarios, loading, agregarUsuario, editarUsuario, cargarUsuarios } =
    useUsuarios();

  // --- Estados ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // --- OTP edición ---
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpUser, setOtpUser] = useState<User | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");

  // --- Filtros ---
  const [filterCorreo, setFilterCorreo] = useState("");
  const [filterRol, setFilterRol] = useState("");

  // --- Auth ---
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authorized" | "unauthorized"
  >("loading");
  const [userRol, setUserRol] = useState<string | null>(null);

  // --- Filtrado ---
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const matchCorreo = u.correo?.includes(filterCorreo);
      const matchRol = filterRol ? u.rol === filterRol : true;
      return matchCorreo && matchRol;
    });
  }, [usuarios, filterCorreo, filterRol]);

  // --- Verificación ---
  useEffect(() => {
    const verifyUser = async () => {
      try {
        const res = await fetch("/api/auth/verify", { cache: "no-store" });
        const data = await res.json();

        if (
          data.ok &&
          (data.user.rol === "admin" ||
            data.user.rol === "Administrador" ||
            data.user.rol === "rrhh")
        ) {
          setUserRol(data.user.rol);
          setAuthStatus("authorized");
        } else {
          setAuthStatus("unauthorized");
        }
      } catch {
        setAuthStatus("unauthorized");
      }
    };
    verifyUser();
  }, []);

  // --- Redirección ---
  useEffect(() => {
    if (authStatus === "unauthorized") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0B0D10] text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4 shadow-2xl">
          Validando acceso...
        </div>
      </div>
    );
  }

  if (authStatus === "unauthorized") return null;

  // --- CRUD ---
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setModalMode("view");
    setShowModal(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setModalMode("add");
    setShowModal(true);
  };

  // --------------------------
  //   OTP PARA EDITAR
  // --------------------------
  const handleEditUser = async (user: User) => {
    try {
      const otpRes = await fetch("/api/auth/send-edit-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: user.correo }),
      });

      const otpData = await otpRes.json();
      if (!otpRes.ok || !otpData.ok) return alert("Error enviando OTP");

      setOtpUser(user);
      setOtpInput("");
      setOtpError("");
      setShowOtpModal(true);
    } catch {
      alert("Error enviando OTP");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpUser) return;

    try {
      const verifyRes = await fetch("/api/auth/verify-edit-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: otpUser.correo,
          otp: otpInput,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.ok)
        return setOtpError("OTP inválido o expirado");

      setSelectedUser(otpUser);
      setModalMode("edit");
      setShowModal(true);
      setShowOtpModal(false);
    } catch {
      setOtpError("Error verificando OTP");
    }
  };

  // --------------------------
  //    OTP PARA ELIMINAR
  // --------------------------
  const handleDeleteUser = async (user: User) => {
    try {
      const otpRes = await fetch("/api/auth/send-delete-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: user.correo }),
      });

      const otpData = await otpRes.json();
      if (!otpRes.ok || !otpData.ok) return alert("Error enviando OTP");

      const inputOtp = prompt(
        `Se envió un código de 6 dígitos al correo ${user.correo}. Ingresa el OTP:`
      );
      if (!inputOtp) return;

      const delRes = await fetch("/api/users/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: user.correo, otp: inputOtp }),
      });

      const delData = await delRes.json();

      if (!delRes.ok || !delData.ok) return alert("OTP inválido o expirado");

      alert("Usuario eliminado exitosamente");
      cargarUsuarios();
    } catch {
      alert("Error eliminando usuario");
    }
  };

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundImage: "url('/fondo-bg.png')",
        backgroundSize: "cover", // ✅ igual que el Home (llena toda la pantalla)
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* overlay para legibilidad */}
      <div className="min-h-screen w-full bg-black/60">
        {/* ✅ NO overflow-hidden aquí (deja scrollear la página) */}
        <div className="relative flex min-h-screen">
          <Sidebar />

          {/* main con scroll natural */}
          <main className="flex-1 p-4 md:p-8">
            {/* Header */}
            <div
              className="
                mb-6
                rounded-3xl
                border border-white/10
                bg-white/5
                backdrop-blur-2xl
                shadow-2xl
                p-4
              "
            >
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="
                      h-11 w-11
                      rounded-2xl
                      border border-white/10
                      bg-white/5
                      backdrop-blur-2xl
                      hover:bg-white/10
                      transition
                      flex items-center justify-center
                    "
                    aria-label="Abrir/Cerrar sidebar"
                  >
                    <Menu className="w-6 h-6 text-white/90" />
                  </button>

                  <h1 className="text-2xl md:text-3xl font-bold text-white/90">
                    👥 Gestión de Asesores
                  </h1>
                </div>

                <button
                  onClick={handleAddUser}
                  className="
                    flex items-center gap-2
                    h-11
                    px-4
                    rounded-full
                    border border-emerald-400/20
                    bg-emerald-500/90
                    text-black font-semibold
                    hover:bg-emerald-500
                    active:scale-[0.98]
                    transition
                  "
                >
                  <PlusCircle className="w-5 h-5" />
                  Nuevo asesor
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div
              className="
                mb-6
                rounded-3xl
                border border-white/10
                bg-white/5
                backdrop-blur-2xl
                shadow-2xl
                p-4
              "
            >
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-white/80">
                    Correo:
                  </label>
                  <input
                    type="text"
                    value={filterCorreo}
                    onChange={(e) => setFilterCorreo(e.target.value)}
                    className="
                      w-64 max-w-full
                      rounded-2xl
                      border border-white/10
                      bg-black/25
                      px-4 py-2.5
                      text-sm text-white/85 placeholder:text-white/35
                      outline-none
                      focus:border-emerald-400/30 focus:ring-2 focus:ring-emerald-500/15
                      transition
                    "
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-white/80">
                    Rol:
                  </label>
                  <select
                    value={filterRol}
                    onChange={(e) => setFilterRol(e.target.value)}
                    className="
                      w-56 max-w-full
                      rounded-2xl
                      border border-white/10
                      bg-black/25
                      px-4 py-2.5
                      text-sm text-white/85
                      outline-none
                      focus:border-emerald-400/30 focus:ring-2 focus:ring-emerald-500/15
                      transition
                    "
                  >
                    <option value="">Todos</option>
                    <option value="asesor">Asesor</option>
                    <option value="admin">Administrador</option>
                    <option value="rrhh">RRHH</option>
                    <option value="SpA">SpA</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabla */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="
                rounded-3xl
                border border-white/10
                bg-white/5
                backdrop-blur-2xl
                shadow-2xl
                p-4 md:p-6
                overflow-hidden
              "
            >
              {loading ? (
                <p className="text-white/55">Cargando usuarios...</p>
              ) : usuariosFiltrados.length === 0 ? (
                <p className="text-white/55 text-center py-10">
                  No hay asesores que coincidan con los filtros.
                </p>
              ) : (
                <UsuariosTable
                  usuarios={usuariosFiltrados} 
                  onEdit={handleEditUser}

                />
              )}
            </motion.div>
          </main>

          {/* Modal Crear/Editar */}
          {showModal && (
            <UsuarioModal
              mode={modalMode}
              user={selectedUser}
              onClose={() => setShowModal(false)}
              onAddUser={agregarUsuario}
              onEditUser={async (user) => {
                await editarUsuario(user);
                cargarUsuarios();
              }}
            />
          )}

          {/* Modal OTP editar */}
          {showOtpModal && otpUser && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
              <div className="w-80 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden relative">
                <div className="pointer-events-none absolute inset-0 bg-black/35" />

                <div className="relative p-6">
                  <h2 className="text-lg font-bold mb-3 text-center text-white/90">
                    Ingresa el OTP enviado a
                    <div className="text-sm font-semibold text-white/70 mt-1 break-all">
                      {otpUser.correo}
                    </div>
                  </h2>

                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="Código OTP"
                    className="
                      w-full
                      rounded-2xl
                      border border-white/10
                      bg-black/25
                      px-4 py-2.5
                      text-sm text-white/85 placeholder:text-white/35
                      outline-none
                      focus:border-emerald-400/30 focus:ring-2 focus:ring-emerald-500/15
                      transition
                      mb-2
                    "
                  />

                  {otpError && (
                    <p className="text-red-400 text-sm mb-2 text-center">
                      {otpError}
                    </p>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      className="
                        px-4 py-2 rounded-2xl
                        border border-white/10 bg-white/5
                        text-white/80 hover:bg-white/10
                        transition
                      "
                      onClick={() => setShowOtpModal(false)}
                    >
                      Cancelar
                    </button>

                    <button
                      className="
                        px-4 py-2 rounded-2xl
                        border border-emerald-400/20
                        bg-emerald-500/90 text-black font-semibold
                        hover:bg-emerald-500
                        transition
                      "
                      onClick={handleVerifyOtp}
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
