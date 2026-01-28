"use client";

import { useEffect, useState } from "react";

export interface User {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  cedula?: string;
  foto_asesor?: string;
  cedula_frontal?: string;
  cedula_reverso?: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]); // Todos los usuarios
  const [asesores, setAsesores] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Cargar todos los usuarios
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

      const allUsers: User[] = data.users || [];

      setUsers(allUsers);
      setAsesores(allUsers.filter(u => u.rol.toLowerCase() === "asesor"));
      setAdmins(allUsers.filter(u => u.rol.toLowerCase() === "admin"));
      setError(null);
    } catch (err: any) {
      console.error("Error cargando usuarios:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Crear usuario (asesor o admin)
  const createUser = async (usuario: Partial<User> & { password: string }) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token no encontrado");

      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(usuario),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creando usuario");

      if (data.user) {
        setUsers(prev => [...prev, data.user]);
        if (data.user.rol.toLowerCase() === "asesor") {
          setAsesores(prev => [...prev, data.user]);
        } else if (data.user.rol.toLowerCase() === "admin") {
          setAdmins(prev => [...prev, data.user]);
        }
      }

      setError(null);
      return data.user;
    } catch (err: any) {
      console.error("Error creando usuario:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    asesores,
    admins,
    loading,
    error,
    fetchUsers,
    createUser,
  };
}
