"use client";

import { useState, useEffect } from "react";
import { Settings, LogOut, Menu } from "lucide-react"; // 👈 añadimos Menu
import { useRouter } from "next/navigation";

export default function Header({
  onToggleSidebar,
}: {
  onToggleSidebar?: () => void;
}) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [theme, setTheme] = useState<string>("default");
  const [mounted, setMounted] = useState(false);

  // 🎨 Temas
  const themes = {
    default: {
      bg: "linear-gradient(135deg, #111827 0%, #000000 100%)",
      text: "#ffffff",
      card: "rgba(31, 41, 55, 0.6)",
    },
    ocean: {
      bg: "linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%)",
      text: "#ffffff",
      card: "rgba(30, 64, 175, 0.4)",
    },
    sunset: {
      bg: "linear-gradient(135deg, #c2410c 0%, #db2777 100%)",
      text: "#ffffff",
      card: "rgba(190, 24, 93, 0.4)",
    },
    forest: {
      bg: "linear-gradient(135deg, #065f46 0%, #059669 100%)",
      text: "#ffffff",
      card: "rgba(6, 95, 70, 0.4)",
    },
    violet: {
      bg: "linear-gradient(135deg, #5b21b6 0%, #3730a3 100%)",
      text: "#ffffff",
      card: "rgba(67, 56, 202, 0.4)",
    },
  };

  // 🧠 Cargar tema guardado
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "default";
    setTheme(savedTheme);
    setMounted(true);
  }, []);

  // 🖌️ Aplicar tema global
  useEffect(() => {
    if (!mounted) return;
    const current = themes[theme as keyof typeof themes];
    const root = document.documentElement;

    root.style.setProperty("--app-background", current.bg);
    root.style.setProperty("--app-text-color", current.text);
    root.style.setProperty("--app-card-bg", current.card);
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  // 🚪 Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("theme");
    document.cookie = "token=; Max-Age=0; path=/;";
    router.push("/login");
  };

  if (!mounted) return null;

  return (
    <header
      className="flex justify-between items-center mb-10 relative p-4 rounded-2xl shadow-md transition-all duration-500 bg-card"
      style={{
        background: "var(--app-card-bg)",
        color: "var(--app-text-color)",
      }}
    >
      {/* 🔹 Botón de menú + título */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-white/10 transition"
          >
            <Menu className="w-6 h-6 text-inherit" />
          </button>
        )}
        <h2 className="text-3xl font-bold text-inherit">Leads</h2>
      </div>

      {/* ⚙️ Configuración y temas */}
      <div className="relative">
        <Settings
          className="w-7 h-7 text-inherit hover:scale-110 transition-transform cursor-pointer"
          onClick={() => setShowMenu(!showMenu)}
        />

        {showMenu && (
          <div
            className="absolute right-0 mt-3 w-56 border border-gray-700 rounded-xl shadow-xl p-3 z-50 origin-top-right animate-fade-in"
            style={{
              background: "var(--app-card-bg)",
              color: "var(--app-text-color)",
              backdropFilter: "blur(10px)",
            }}
          >
            <p className="text-sm font-semibold mb-2 opacity-80">🎨 Temas</p>

            <div className="flex flex-col gap-2">
              {Object.entries(themes).map(([key]) => (
                <button
                  key={key}
                  onClick={() => {
                    setTheme(key);
                    setShowMenu(false);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                    theme === key
                      ? "bg-white/20 text-white"
                      : "hover:bg-white/10"
                  }`}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>

            <hr className="my-3 border-gray-600" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {/* 💫 Animación */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.25s ease-out forwards;
        }
      `}</style>
    </header>
  );
}
