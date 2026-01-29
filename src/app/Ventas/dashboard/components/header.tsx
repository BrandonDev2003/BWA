"use client";

import { Menu, RefreshCw, BarChart3 } from "lucide-react";

export default function Header({
  onToggleSidebar,
  onRefresh,
  onViewAnalytics,
}: {
  onToggleSidebar: () => void;
  onRefresh: () => void;
  onViewAnalytics: () => void;  // <-- AGREGADA para el botón de analíticas
}) {
  return (
    <header className="flex items-center justify-between mb-6">
      {/* Botón sidebar */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg bg-white text-black shadow hover:bg-gray-100 transition"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-3">
        {/* Botón ver analíticas */}
        <button
          onClick={onViewAnalytics}
          className="p-2 rounded-lg bg-indigo-600 text-white shadow hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <BarChart3 size={18} />
          <span>Ver analíticas</span>
        </button>

        {/* Refrescar */}
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg bg-white text-black shadow hover:bg-gray-100 transition"
        >
          <RefreshCw size={20} />
        </button>
      </div>
    </header>
  );
}
