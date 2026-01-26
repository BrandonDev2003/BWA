"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Home,
  MessageSquare,
  Mail,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Server,
} from "lucide-react";
import Link from "next/link";

const adminMenu = [
  { label: "Inicio", href: "/home", icon:  Home },
  { label: "Dashboard", href: "/dashboard", icon: Server },
  { label: "Chats", href: "/chats", icon: MessageSquare },
  { label: "Leads", href: "/leads", icon: Mail },
  { label: "Usuarios", href: "/usuarios", icon: Users },
  
];

export default function SidebarAdmin() {
  const [open, setOpen] = useState(true);

  return (
    <motion.aside
      animate={{ width: open ? 240 : 76 }}
      transition={{ duration: 0.28, ease: "easeInOut" }}
      className="
        relative m-4 p-3 flex flex-col
        overflow-visible
        rounded-3xl
        border border-white/10
        bg-white/5
        backdrop-blur-2xl
        shadow-2xl

        /* ✅ esto hace que NO sea fijo y se mueva con la página */
        min-h-[calc(100vh-2rem)]
      "
    >
      {/* overlay oscuro interno */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-black/25" />

      {/* BOTÓN TOGGLE */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="
          absolute top-8 right-0 z-50
          translate-x-1/2
          h-9 w-9 rounded-full
          bg-black/45 backdrop-blur-xl
          border border-white/20
          text-white/90
          flex items-center justify-center
          hover:bg-black/60 hover:border-white/30
          active:scale-95
          transition
        "
        aria-label={open ? "Cerrar sidebar" : "Abrir sidebar"}
      >
        {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* HEADER */}
      <div className="relative z-10 px-2 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10" />
          {open && (
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">Admin</p>
              <p className="text-xs text-white/60">Ventas</p>
            </div>
          )}
        </div>
      </div>

      {/* MENU */}
      <div className="relative z-10 flex flex-col gap-2">
        {adminMenu.map((item) => (
          <SidebarItem
            key={item.href}
            icon={<item.icon size={20} />}
            text={item.label}
            href={item.href}
            open={open}
          />
        ))}
      </div>

      {/* SALIR */}
      <div className="relative z-10 mt-auto mb-3">
        <div className="my-3 h-px w-full bg-white/10" />
        <SidebarItem
          icon={<LogOut size={20} />}
          text="Salir"
          href="/login"
          open={open}
          danger
        />
      </div>

      {/* acento inferior suave */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-emerald-500/15" />
    </motion.aside>
  );
}

function SidebarItem({
  icon,
  text,
  href,
  open,
  danger,
}: {
  icon: React.ReactNode;
  text: string;
  href: string;
  open: boolean;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "group flex items-center gap-3 px-3 py-3 rounded-2xl",
        "border transition",
        danger
          ? "border-transparent hover:bg-red-500/10 hover:border-red-500/20"
          : "border-transparent hover:bg-white/10 hover:border-white/10",
      ].join(" ")}
    >
      <div className="w-6 h-6 flex items-center justify-center text-white/70 group-hover:text-white transition">
        {icon}
      </div>

      {open && (
        <span className="text-sm font-medium text-white/80 group-hover:text-white whitespace-nowrap transition">
          {text}
        </span>
      )}
    </Link>
  );
}
