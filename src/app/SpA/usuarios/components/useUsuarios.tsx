"use client";

import { useState, useEffect, useCallback } from "react";

export type EstadoLaboral = "ACTIVO" | "DESVINCULADO" | "RENUNCIA";

export interface User {
  id: number;
  nombre: string;

  // a veces correo / email según tu BD
  correo?: string;
  email?: string;

  rol: string;
  cedula?: string;
  puede_ver_todo?: boolean;

  // ✅ laboral
  estado_laboral?: EstadoLaboral;
  motivo_salida?: string | null;
  fecha_salida?: string | null;

  motivo_reingreso?: string | null;
  fecha_reingreso?: string | null;

  [key: string]: any;
}

function pickUsuarios(data: any): User[] {
  // ✅ formato 1: { meta, rows }
  if (Array.isArray(data?.rows)) return data.rows;

  // ✅ formato 2: { usuarios: [...] }
  if (Array.isArray(data?.usuarios)) return data.usuarios;

  // ✅ formato 3: array directo
  if (Array.isArray(data)) return data;

  return [];
}

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // -------------------------------------------------
  // CARGAR USUARIOS
  // -------------------------------------------------
  const cargarUsuarios = useCallback(async () => {
    setLoading(true);

    try {
      // ✅ USA el endpoint correcto (el que devuelve estado_laboral)
      // Si tu endpoint bueno es /api/usuarios (como en tu screenshot), usa ese.
      const res = await fetch("/api/usuarios", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Error cargando usuarios:", data?.error || data);
        setUsuarios([]);
        return;
      }

      const list = pickUsuarios(data);
      setUsuarios(list);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // -------------------------------------------------
  // AGREGAR USUARIO
  // -------------------------------------------------
  const agregarUsuario = async (usuario: Partial<User>) => {
    try {
      const res = await fetch("/api/usuarios/crear", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        setUsuarios((prev) => [data.user, ...prev]);
      } else {
        console.error("Error creando usuario:", data?.error || data);
      }
    } catch (err) {
      console.error("Error creando usuario:", err);
    }
  };

  // -------------------------------------------------
  // EDITAR USUARIO
  // -------------------------------------------------
  const editarUsuario = async (usuario: Partial<User> & { id: number }) => {
    try {
      const res = await fetch(`/api/usuarios/editar/${usuario.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        setUsuarios((prev) =>
          prev.map((u) => (u.id === data.user.id ? data.user : u))
        );
      } else {
        console.error("Error editando usuario:", data?.error || data);
      }
    } catch (err) {
      console.error("Error editando usuario:", err);
    }
  };

  // -------------------------------------------------
  // Cargar al montar
  // -------------------------------------------------
  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  return { usuarios, loading, agregarUsuario, editarUsuario, cargarUsuarios };
}
