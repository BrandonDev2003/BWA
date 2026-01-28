"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Home,
  MessageSquare,
  Mail,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Server,
  ClipboardList,
  Users,
} from "lucide-react";
import Link from "next/link";

type MeUser = {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
};

const spaMenu = [
  { label: "Chats", href: "/SpA/chats", icon: MessageSquare },
  { label: "Dashboard", href: "/SpA/dashboard", icon: Server },
  { label: "Home", href: "/SpA/home", icon: Home },
  { label: "Leads", href: "/SpA/leads", icon: Mail },
  { label: "Leads Gestión", href: "/SpA/leadsgestion", icon: ClipboardList },
  { label: "Usuarios", href: "/SpA/usuarios", icon: Users },
];

export default function SidebarSpA() {
  const [open, setOpen] = useState(true);
  const [me, setMe] = useState<MeUser | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json().catch(() => ({}));
        if (!mounted) return;

        if (!res.ok) {
          setMe(null);
          return;
        }

        setMe(data.user || null);
      } catch {
        if (!mounted) return;
        setMe(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const initial = (me?.nombre?.trim()?.[0] || "S").toUpperCase();
  const title = me?.nombre?.trim() || "SpA";
  const subtitle = me?.correo?.trim() || "Super Admin";
  const roleLabel = (me?.rol || "SpA").toUpperCase();

  const wOpen = 240;
  const wClosed = 76;

  return (
    <>
      {/* ✅ ESPACIADOR REAL: empuja el contenido */}
      <div style={{ width: open ? wOpen + 32 : wClosed + 32 }} />

      {/* ✅ SIDEBAR FIXED */}
      <motion.aside
        animate={{ width: open ? wOpen : wClosed }}
        transition={{ duration: 0.28, ease: "easeInOut" }}
        className="
          fixed left-4 top-4 bottom-4 z-50
          flex flex-col
          overflow-hidden
          rounded-3xl
          border border-white/10
          bg-white/5
          backdrop-blur-2xl
          shadow-2xl
        "
      >
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-black/25" />

        {/* TOGGLE */}
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
            <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
              <span className="text-white/80 font-semibold">{initial}</span>
            </div>

            {open && (
              <div className="leading-tight min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {title}
                </p>
                <p className="text-xs text-white/60 truncate">{subtitle}</p>
                <p className="text-[11px] text-emerald-300/80 mt-1">
                  {roleLabel}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* MENU */}
        <div className="relative z-10 flex-1 overflow-y-auto px-2 pb-2">
          <div className="flex flex-col gap-2">
            {spaMenu.map((item) => (
              <SidebarItem
                key={item.href}
                icon={<item.icon size={20} />}
                text={item.label}
                href={item.href}
                open={open}
              />
            ))}
          </div>
        </div>

        {/* SALIR */}
        <div className="relative z-10 px-2 pb-4">
          <div className="my-3 h-px w-full bg-white/10" />
          <SidebarItem
            icon={<LogOut size={20} />}
            text="Salir"
            href="/login"
            open={open}
            danger
          />
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-emerald-500/15" />
      </motion.aside>
    </>
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
