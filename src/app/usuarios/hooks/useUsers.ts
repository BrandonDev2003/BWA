"use client";

import { useEffect, useState } from "react";

export interface User {
  id: number;
  nombre_completo: string;
  correo: string;
  rol: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Cargar asesores
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token no encontrado");

      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al obtener usuarios");

      // solo asesores
      const asesores = (data.users || []).filter(
        (u: User) => u.rol.toLowerCase() === "asesor"
      );
      setUsers(asesores);
      setError(null);
    } catch (err: any) {
      console.error("Error cargando usuarios:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, fetchUsers };
}
