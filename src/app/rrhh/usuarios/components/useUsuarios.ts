"use client";

import { useState, useEffect, useCallback } from "react";

export type EstadoLaboral = "ACTIVO" | "DESVINCULADO" | "RENUNCIA";

export interface User {
  id: number;
  nombre: string;

  // correo puede venir undefined, por eso opcional
  correo?: string;
  email?: string;

  rol: string;
  cedula?: string;
  puede_ver_todo?: boolean;

  // extras que usa la tabla (vienen del backend)
  estado_expediente?: "COMPLETO" | "INCOMPLETO";
  faltantes?: string[];

  estado_laboral?: EstadoLaboral;
  motivo_salida?: string | null;

  motivo_reingreso?: string | null;
  fecha_reingreso?: string | null;

  [key: string]: any;
}

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // -------------------------------------------------
  // CARGAR USUARIOS (USA COOKIE TOKEN AUTOMÁTICAMENTE)
  // -------------------------------------------------
  const cargarUsuarios = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/usuarios/listar", {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Error cargando usuarios:", data.error);
        return;
      }

      setUsuarios(Array.isArray(data.usuarios) ? data.usuarios : []);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(usuario),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        setUsuarios((prev) => [...prev, data.user]);
      } else {
        console.error("Error creando usuario:", data.error);
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(usuario),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        setUsuarios((prev) =>
          prev.map((u) => (u.id === data.user.id ? data.user : u))
        );
      } else {
        console.error("Error editando usuario:", data.error);
      }
    } catch (err) {
      console.error("Error editando usuario:", err);
    }
  };

  // -------------------------------------------------
  // Cargar al montar
  // -------------------------------------------------
  useEffect(() => {
    void cargarUsuarios();
  }, [cargarUsuarios]);

  return { usuarios, loading, agregarUsuario, editarUsuario, cargarUsuarios };
}