"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Settings, LogOut, Menu, Check } from "lucide-react";
import { useRouter } from "next/navigation";

/* =========================
   PORTAL (para dropdown)
========================= */
function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(children, document.body);
}

/* =========================
   HEADER
========================= */
export default function Header({
  onToggleSidebar,
}: {
  onToggleSidebar?: () => void;
}) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [theme, setTheme] = useState("default");
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  const themes = {
    default: {},
    ocean: {},
    sunset: {},
    forest: {},
    violet: {},
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "default";
    setTheme(saved);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}

    localStorage.removeItem("token");
    localStorage.removeItem("theme");
    document.cookie = "token=; Max-Age=0; path=/;";
    router.push("/login");
  };

  return (
    <header
      className="
        relative
        flex items-center justify-between
        rounded-2xl
        border border-white/10
        bg-white/5
        backdrop-blur-2xl
        shadow-2xl
        px-4 py-3
        text-white
      "
    >
      {/* IZQUIERDA */}
      <div className="flex items-center gap-3">


        <div>
          <h2 className="text-xl md:text-2xl font-semibold">Leads</h2>
          <p className="text-xs text-white/50 -mt-0.5">
            Panel administrativo
          </p>
        </div>
      </div>

      {/* DERECHA */}
      <div className="flex items-center gap-3">
        <button
          ref={menuButtonRef}
          onClick={() => setShowMenu((v) => !v)}
          className="
            h-10 w-10 rounded-xl
            border border-white/10
            bg-black/20
            text-white/80
            hover:bg-white/10 hover:text-white
            transition
            flex items-center justify-center
          "
          aria-label="Configuración"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* =========================
          DROPDOWN (PORTAL)
      ========================= */}
      {showMenu && (
        <Portal>
          {/* backdrop */}
          <div
            className="fixed inset-0 z-[9999]"
            onClick={() => setShowMenu(false)}
          >
            {/* menu */}
            <div
              className="
                absolute right-6 top-20 w-72
                rounded-2xl
                border border-white/10
                bg-white/5
                backdrop-blur-2xl
                shadow-2xl
                overflow-hidden
              "
              onClick={(e) => e.stopPropagation()}
            >
              {/* overlay oscuro */}
              <div className="pointer-events-none absolute inset-0 bg-black/25" />

              <div className="relative p-3">
                <p className="text-xs tracking-wide text-white/50 font-semibold mb-2">
                  TEMAS
                </p>

                <div className="flex flex-col gap-1">
                  {Object.keys(themes).map((k) => {
                    const active = theme === k;
                    return (
                      <button
                        key={k}
                        onClick={() => {
                          setTheme(k);
                          localStorage.setItem("theme", k);
                          setShowMenu(false);
                        }}
                        className={[
                          "flex items-center justify-between",
                          "px-3 py-2 rounded-xl text-sm",
                          "border transition",
                          active
                            ? "bg-emerald-500/10 border-emerald-400/20 text-white"
                            : "border-transparent text-white/70 hover:bg-white/10 hover:text-white",
                        ].join(" ")}
                      >
                        <span>{k.charAt(0).toUpperCase() + k.slice(1)}</span>
                        {active && (
                          <Check className="w-4 h-4 text-emerald-300" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="my-3 h-px w-full bg-white/10" />

                <button
                  onClick={handleLogout}
                  className="
                    w-full flex items-center justify-center gap-2
                    py-2.5 rounded-xl
                    bg-red-500/15 border border-red-500/20
                    text-white/90 font-semibold
                    hover:bg-red-500/25 hover:border-red-500/30
                    transition
                  "
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </header>
  );
}
