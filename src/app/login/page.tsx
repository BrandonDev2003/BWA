"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
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
        body: JSON.stringify({ correo, password }),
      });

      const data = await res.json();
      console.log("📥 Respuesta del servidor:", data);

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.user.rol === "admin") {
        router.push("/leads");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("❌ Error en login:", err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <div className="backdrop-blur-xl bg-white/10 p-10 rounded-3xl shadow-2xl w-[360px] border border-white/20">
        <h2 className="text-3xl font-bold text-center mb-6">Bienvenido 👋</h2>
        <p className="text-center text-gray-300 mb-8 text-sm">
          Ingresa tus credenciales para continuar
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm mb-1 text-gray-300">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-300">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center pt-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold transition-transform transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
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

        <p className="text-xs text-gray-400 text-center mt-6">
          © 2025 Tu Empresa. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
