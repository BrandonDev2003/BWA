"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [showAssignUsers, setShowAssignUsers] = useState(false);

  const didFetchUsers = useRef(false);
  const didFetchLeads = useRef(false);

  const fetchLeads = useCallback(async () => {
    if (didFetchLeads.current) return;
    didFetchLeads.current = true;

    try {
      const res = await fetch("/api/leads", { cache: "no-store" });
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (e) {
      console.error("fetchLeads error:", e);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (didFetchUsers.current) return;
    didFetchUsers.current = true;

    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error("fetchUsers error:", e);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchUsers();
  }, [fetchLeads, fetchUsers]);

  const handleAssign = useCallback(
    async (userId: number) => {
      const res = await fetch("/api/leads/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: selectedLeads,
          userId,
        }),
      });

      if (res.ok) {
        didFetchLeads.current = false;
        await fetchLeads();
        setSelectedLeads([]);
        setShowAssignUsers(false);
      }
    },
    [selectedLeads, fetchLeads]
  );

  return {
    leads,
    fetchLeads: async () => {
      didFetchLeads.current = false;
      await fetchLeads();
    },
    filtroEstado,
    setFiltroEstado,
    selectedLeads,
    setSelectedLeads,
    showAssignUsers,
    setShowAssignUsers,
    users,
    fetchUsers: async () => {
      didFetchUsers.current = false;
      await fetchUsers();
    },
    handleAssign,
  };
}
