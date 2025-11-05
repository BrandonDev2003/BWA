"use client";

import { useEffect, useState } from "react";

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Función para cargar usuarios desde la API
  const cargarUsuarios = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("⚠️ No hay token, no se pueden cargar usuarios.");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log("🔍 Datos de la API /api/users:", data);

      const list = Array.isArray(data.users) ? data.users : [];
      setUsuarios(list.filter((u) => u.rol === "asesor"));
    } catch (err) {
      console.error("❌ Error al cargar usuarios:", err);
    }
  };

  // ✅ Cargar usuarios automáticamente al montar
  useEffect(() => {
    cargarUsuarios();
  }, []);

  // ✅ Función para agregar un nuevo usuario
  const agregarUsuario = async ({ nombre, correo, password }: any) => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nombre_completo: nombre,
        correo,
        cedula: "0000000000",
        password,
        rol: "asesor",
        puede_ver_todo: false,
      }),
    });

    const data = await res.json();

    if (res.ok && data.user) {
      setUsuarios((prev) => [...prev, data.user]);
    } else {
      console.error("❌ Error al crear usuario:", data.error);
    }
  };

  return { usuarios, agregarUsuario, cargarUsuarios, loading };
}
