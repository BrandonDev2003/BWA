"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TrueFocus from "./components/TrueFocus";

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/logout").catch(() => {});

    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }

    localStorage.removeItem("token");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setError("Tu usuario no está ACTIVO. Contacta a RRHH.");
        } else {
          setError(data.error || "Error al iniciar sesión");
        }
        return;
      }

      if (data.token) localStorage.setItem("token", data.token);

      const rol = String(data?.user?.rol || "").toLowerCase();

      if (rol === "SpA" || rol === "super-admin" || rol === "spa") {
        router.replace("/SpA/home");
      } else if (rol === "admin" || rol === "administrador") {
        router.replace("/Ventas/home");
      } else if (rol === "rrhh") {
        router.replace("/rrhh/home");
      } else if (rol === "RRHH") {
        router.replace("/rrhh/home");
      } else if (rol === "asesor") {
        router.replace("/Asesor/home");
      } else {
        router.replace("/usuarios/home");
      }
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-black flex">
      <div className="flex-1 flex items-center justify-center">
        <img
          src="/bw.png"
          alt="Logo Empresa"
          className="max-w-[450px] opacity-90 drop-shadow-[0_0_30px_rgba(255,255,255,0.25)]"
        />
      </div>

      <div className="w-[50%] flex items-center justify-center relative">
        <div className="relative w-[340px] p-10 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl">
          <div className="flex justify-center mb-6">
            <TrueFocus
              sentence="BLACKWOOD ALLIANCE"
              separator=" "
              blurAmount={5}
              borderColor="#3b82f6"
              glowColor="rgba(59,130,246,0.5)"
              animationDuration={0.55}
              pauseBetweenAnimations={1}
            />
          </div>

          <div className="absolute -inset-0.5 rounded-xl border border-gray-700 animate-glow pointer-events-none"></div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-300 mb-1 font-light tracking-tight">
                Correo electrónico
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full p-3 rounded-md bg-neutral-900 border border-neutral-700 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1 font-light tracking-tight">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-md bg-neutral-900 border border-neutral-700 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 font-semibold transition-transform hover:scale-[1.03] active:scale-[0.96] disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Cargando...
                </span>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            © 2025 Blackwood Alliance. Todos los derechos reservados.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes glow {
          0% { box-shadow: 0 0 8px rgba(0, 153, 255, 0.15); }
          50% { box-shadow: 0 0 18px rgba(0, 153, 255, 0.4); }
          100% { box-shadow: 0 0 8px rgba(0, 153, 255, 0.15); }
        }
        .animate-glow { animation: glow 2.8s infinite ease-in-out; }
      `}</style>
    </div>
  );
}
