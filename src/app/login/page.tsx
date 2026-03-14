"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TrueFocus from "./components/TrueFocus";

export default function LoginPage() {
  const router = useRouter();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password, otp }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      redirectByRole(data.user.rol);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = (rol: string) => {
    if (rol === "SpA" || rol === "super-admin" || rol === "spa") {
      router.replace("/SpA/home");
    } else if (rol === "admin" || rol === "administrador") {
      router.replace("/Ventas/home");
    } else if (rol === "rrhh" || rol === "RRHH") {
      router.replace("/rrhh/home");
    } else if (rol === "asesor") {
      router.replace("/Asesor/home");
    } else {
      router.replace("/usuarios/home");
    }
  };

  return (
    <div className="w-full h-screen bg-black flex">
      <div className="flex-1 flex items-center justify-center">
        <img src="/bw.png" alt="Logo" className="max-w-[450px] opacity-90" />
      </div>

      <div className="w-[50%] flex items-center justify-center">
        <div className="w-[340px] p-10 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
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

          <form onSubmit={handleLogin} className="space-y-5">
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Correo"
              className="w-full p-3 rounded-md bg-neutral-900 border border-neutral-700"
              required
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full p-3 rounded-md bg-neutral-900 border border-neutral-700"
              required
            />

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Código OTP (Google Authenticator)"
              className="w-full p-3 rounded-md bg-neutral-900 border border-neutral-700 text-center text-lg tracking-widest"
              required
            />

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-md bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Cargando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}