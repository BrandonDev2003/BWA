"use client";

import { motion } from "framer-motion";
import { Home, Users, LogOut, Mail } from "lucide-react"; // 👈 reemplazamos UserPlus por Mail
import Link from "next/link";

export default function Sidebar({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  return (
    <motion.aside
      animate={{ width: open ? 220 : 70 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-950 h-screen border-r border-gray-800 flex flex-col p-4 overflow-hidden"
    >
      <div className="flex flex-col gap-6 mt-10">
        <SidebarItem icon={<Home />} text="Inicio" open={open} href="/home" />

        {/* ✅ Opción Leads con ícono de correo */}
        <SidebarItem
          icon={<Mail />} // 👈 Aquí el nuevo ícono
          text="Leads"
          open={open}
          href="/leads"
        />

        <SidebarItem
          icon={<Users />}
          text="Usuarios"
          open={open}
          href="/usuarios"
        />
      </div>

      <div className="mt-auto mb-6">
        <SidebarItem
          icon={<LogOut />}
          text="Salir"
          open={open}
          href="/login"
        />
      </div>
    </motion.aside>
  );
}

function SidebarItem({
  icon,
  text,
  href,
  open,
}: {
  icon: React.ReactNode;
  text: string;
  href: string;
  open: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 text-gray-300 hover:text-white hover:bg-gray-800 p-3 rounded-lg transition"
    >
      {icon}
      {open && <span className="text-sm font-medium">{text}</span>}
    </Link>
  );
}
