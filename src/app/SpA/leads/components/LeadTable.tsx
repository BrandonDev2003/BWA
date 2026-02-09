"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import AssignUsers from "./AssignUsers";
import { RefreshCcw, Upload, Shuffle, UserMinus, Trash2 } from "lucide-react";
import { useLeads } from "../hooks/useLeads";

type Estado = "todos" | "pendiente" | "contactado" | "cerrado";

export default function LeadTable() {
  const {
    leads,
    fetchLeads,
    filtroEstado,
    setFiltroEstado,
    selectedLeads,
    setSelectedLeads,
    showAssignUsers,
    setShowAssignUsers,
    users,
    fetchUsers,
  } = useLeads();

  useEffect(() => {
    fetchUsers?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroCorreo, setFiltroCorreo] = useState("");
  const [filtroTelefono, setFiltroTelefono] = useState("");
  const [filtroOrigen, setFiltroOrigen] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroAsesor, setFiltroAsesor] = useState("todos");
  const [asesorQuitar, setAsesorQuitar] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const norm = (v: any) => String(v ?? "").toLowerCase().trim();

  // ✅ Convierte cualquier fecha a YYYY-MM-DD sin UTC (evita corrimiento de día)
  const toYMD = (v: any) => {
    if (!v) return "";

    if (typeof v === "number") {
      const ms = v < 10_000_000_000 ? v * 1000 : v;
      const d = new Date(ms);
      if (Number.isNaN(d.getTime())) return "";
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }

    const s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // ✅ fecha flexible: toma el primer campo existente
  const getLeadDateRaw = (l: any) => {
    return (
      l?.fecha ??
      l?.created_at ??
      l?.createdAt ??
      l?.fecha_creacion ??
      l?.fechaCreacion ??
      l?.updated_at ??
      l?.updatedAt ??
      null
    );
  };

  const formatFecha = (raw: any) => {
    const ymd = toYMD(raw);
    if (!ymd) return "Sin fecha";
    const d = new Date(`${ymd}T00:00:00`);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ✅ normalizar estado SIN mutar
  const leadsNormalizados = useMemo(() => {
    return (leads as any[]).map((l) => ({
      ...l,
      estado: l.estado === "Nuevo" ? "pendiente" : l.estado,
    }));
  }, [leads]);

  // ✅ helper: asesor activo
  const isAsesorActivo = (u: any) => {
    const rol = String(u?.rol ?? "").toLowerCase();
    const estado = String(u?.estado_laboral ?? "ACTIVO").toUpperCase();
    return rol.includes("asesor") && estado === "ACTIVO";
  };

  // ✅ mapa nombre->id y id->nombre (SOLO asesores ACTIVOS)
  const { asesorNameToId, asesorIdToName } = useMemo(() => {
    const arr = Array.isArray(users) ? (users as any[]) : [];
    const nameOf = (u: any) => String(u?.nombre ?? u?.correo ?? "").trim();

    const nameToId = new Map<string, number>();
    const idToName = new Map<number, string>();

    for (const u of arr) {
      if (!isAsesorActivo(u)) continue;

      const name = nameOf(u);
      const id = Number(u?.id);

      if (!name || !Number.isFinite(id)) continue;

      nameToId.set(norm(name), id);
      idToName.set(id, name);
    }

    return { asesorNameToId: nameToId, asesorIdToName: idToName };
  }, [users]);

  // ✅ lista de asesores por NOMBRE (SOLO ACTIVOS)
  const asesores = useMemo(() => {
    const arr = Array.isArray(users) ? (users as any[]) : [];
    const nameOf = (u: any) => String(u?.nombre ?? u?.correo ?? "").trim();

    const names = arr.filter(isAsesorActivo).map(nameOf).filter(Boolean);
    const unique = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "es"));
    return ["todos", ...unique];
  }, [users]);

  // ✅ obtener nombre asignado aunque venga como ID o como nombre
  const asignadoNombre = (asignado_a: any) => {
    if (asignado_a == null || asignado_a === "") return "Sin asignar";

    if (typeof asignado_a === "number" || /^\d+$/.test(String(asignado_a))) {
      const n = asesorIdToName.get(Number(asignado_a));
      return n || "Usuario no encontrado";
    }

    const s = String(asignado_a).trim();
    return s ? s : "Sin asignar";
  };

  // ✅ filtro total
  const leadsFiltrados = useMemo(() => {
    return leadsNormalizados.filter((l) => {
      const okEstado = filtroEstado === "todos" ? true : l.estado === filtroEstado;

      const asignado = asignadoNombre(l.asignado_a);
      const okAsesor = filtroAsesor === "todos" ? true : norm(asignado) === norm(filtroAsesor);

      const okNombre = norm(l.nombre).includes(norm(filtroNombre));
      const okCorreo = norm(l.correo).includes(norm(filtroCorreo));
      const okTel = norm(l.telefono).includes(norm(filtroTelefono));
      const okOrigen = norm(l.origen).includes(norm(filtroOrigen));

      const raw = getLeadDateRaw(l);
      const fechaYMD = toYMD(raw);
      const okFecha = filtroFecha ? fechaYMD === filtroFecha : true;

      return okEstado && okAsesor && okNombre && okCorreo && okTel && okOrigen && okFecha;
    });
  }, [
    leadsNormalizados,
    filtroEstado,
    filtroAsesor,
    filtroNombre,
    filtroCorreo,
    filtroTelefono,
    filtroOrigen,
    filtroFecha,
    asesorIdToName,
  ]);

  const toggleSelect = (id: number) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const allSelected =
      leadsFiltrados.length > 0 && leadsFiltrados.every((l) => selectedLeads.includes(l.id));

    setSelectedLeads(allSelected ? [] : leadsFiltrados.map((l) => l.id));
  };

  const isAllChecked =
    leadsFiltrados.length > 0 && leadsFiltrados.every((l) => selectedLeads.includes(l.id));

  // ✅ Import
  const onImportClick = () => fileRef.current?.click();

  const onImportFile = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/leads/import", {
      method: "POST",
      body: form,
      credentials: "include",
    });
    if (res.ok) await fetchLeads();
  };

  // ✅ Random equitable
  const assignRandomEquitable = async () => {
    const res = await fetch("/api/leads/assign-random-equitable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ onlyUnassigned: true, onlyRole: "asesor" }),
    });
    if (res.ok) await fetchLeads();
  };

  // ✅ Quitar todos los casos (por asesorId real)
  const unassignAllFromUser = async () => {
    if (!asesorQuitar) return;

    const asesorId = asesorNameToId.get(norm(asesorQuitar));
    if (!asesorId) {
      console.error("No se encontró ID para el asesor:", asesorQuitar);
      return;
    }

    const res = await fetch("/api/leads/unassign-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ asesorId }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      console.error("unassign-user falló:", data);
      return;
    }

    setAsesorQuitar("");
    await fetchLeads();
  };

  // ✅ Asignar seleccionados
  const onAssignSelected = async (asesorId: number) => {
    if (!asesorId) return;
    if (!selectedLeads || selectedLeads.length === 0) return;

    const res = await fetch("/api/leads/assigns", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ leadIds: selectedLeads, asesorId }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      console.error("Asignación falló:", data);
      return;
    }

    setShowAssignUsers(false);
    setSelectedLeads([]);
    await fetchLeads();
  };

  // ✅ Borrar lead
  const deleteLead = async (id: number) => {
    const ok = window.confirm("¿Seguro que quieres borrar este lead? Esta acción no se puede deshacer.");
    if (!ok) return;

    try {
      setDeletingId(id);

      const res = await fetch(`/api/leads/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        console.error("Error borrando lead:", data);
        alert("No se pudo borrar el lead. Revisa consola / endpoint.");
        return;
      }

      await fetchLeads();
      setSelectedLeads((prev) => prev.filter((x) => x !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const Input = ({
    placeholder,
    value,
    onChange,
  }: {
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="
        w-full rounded-2xl border border-white/10 bg-white/5
        backdrop-blur-xl px-4 py-2.5 text-sm text-white/85
        placeholder:text-white/35 outline-none
        focus:border-emerald-400/30 focus:bg-white/10 transition
      "
      type="text"
    />
  );

  return (
    <div>
      {/* TOP */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onImportClick}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/10 transition shadow-2xl"
              type="button"
            >
              <Upload className="w-4 h-4 inline-block mr-2" />
              Importar
            </button>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportFile(f);
                e.currentTarget.value = "";
              }}
            />

            <button
              onClick={fetchLeads}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/10 transition shadow-2xl"
              type="button"
            >
              <RefreshCcw className="w-4 h-4 inline-block mr-2" />
              Refrescar
            </button>
          </div>

          <div className="text-sm text-white/60">
            Total: <span className="text-white/85 font-semibold">{leadsFiltrados.length}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={assignRandomEquitable}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10 transition shadow-2xl"
            type="button"
          >
            <Shuffle className="w-4 h-4 inline-block mr-2" />
            Asignar aleatorio equitativo (NO asignados)
          </button>

          <div className="ml-auto flex items-center gap-2">
            <select
              value={asesorQuitar}
              onChange={(e) => setAsesorQuitar(e.target.value)}
              className="min-w-[220px] rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/85"
            >
              <option value="" className="bg-[#0B0D10]">
                Seleccionar asesor…
              </option>
              {asesores
                .filter((x) => x !== "todos")
                .map((a) => (
                  <option key={a} value={a} className="bg-[#0B0D10]">
                    {a}
                  </option>
                ))}
            </select>

            <button
              onClick={unassignAllFromUser}
              disabled={!asesorQuitar}
              className={
                asesorQuitar
                  ? "rounded-full border border-amber-400/20 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-amber-500/25 transition shadow-2xl"
                  : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/40 cursor-not-allowed"
              }
              type="button"
            >
              <UserMinus className="w-4 h-4 inline-block mr-2" />
              Quitar todos sus casos
            </button>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-white/40 mr-1">Estado:</span>
            {(["todos", "pendiente", "contactado", "cerrado"] as Estado[]).map((estado) => {
              const active = filtroEstado === estado;
              return (
                <button
                  key={estado}
                  onClick={() => setFiltroEstado(estado)}
                  className={[
                    "px-4 py-2 rounded-full text-sm font-semibold transition border",
                    active
                      ? "bg-emerald-500/15 border-emerald-400/20 text-white"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                  type="button"
                >
                  {estado}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-white/40">Asesor:</span>
            <select
              value={filtroAsesor}
              onChange={(e) => setFiltroAsesor(e.target.value)}
              className="min-w-[220px] rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/85"
            >
              {asesores.map((a) => (
                <option key={a} value={a} className="bg-[#0B0D10]">
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-white/40">Fecha:</span>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/85"
            />
          </div>

          <button
            onClick={() => setShowAssignUsers(true)}
            disabled={selectedLeads.length === 0}
            className={
              selectedLeads.length
                ? "ml-auto rounded-full border border-emerald-400/20 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-emerald-500/25 transition shadow-2xl"
                : "ml-auto rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/40 cursor-not-allowed"
            }
            type="button"
          >
            Asignar seleccionados
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input placeholder="Filtrar nombre…" value={filtroNombre} onChange={setFiltroNombre} />
          <Input placeholder="Filtrar correo…" value={filtroCorreo} onChange={setFiltroCorreo} />
          <Input placeholder="Filtrar teléfono…" value={filtroTelefono} onChange={setFiltroTelefono} />
          <Input placeholder="Filtrar origen…" value={filtroOrigen} onChange={setFiltroOrigen} />
        </div>
      </div>

      {/* TABLA */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden">
        <div className="h-px w-full bg-emerald-500/15" />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1060px]">
            <thead className="bg-black/35 text-white/70">
              <tr className="border-b border-white/10">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllChecked}
                    onChange={toggleSelectAll}
                    className="accent-emerald-400 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="p-3 text-xs font-semibold tracking-wide uppercase whitespace-nowrap">Nombre</th>
                <th className="p-3 text-xs font-semibold tracking-wide uppercase whitespace-nowrap">Correo</th>
                <th className="p-3 text-xs font-semibold tracking-wide uppercase whitespace-nowrap">Teléfono</th>
                <th className="p-3 text-xs font-semibold tracking-wide uppercase whitespace-nowrap">Origen</th>
                <th className="p-3 text-xs font-semibold tracking-wide uppercase whitespace-nowrap">Estado</th>
                <th className="p-3 text-xs font-semibold tracking-wide uppercase whitespace-nowrap">Fecha</th>
                <th className="p-3 text-xs font-semibold tracking-wide uppercase whitespace-nowrap">Asignado a</th>
                <th className="p-3 text-xs font-semibold tracking-wide uppercase whitespace-nowrap text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {leadsFiltrados.map((lead: any) => (
                <tr key={lead.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => toggleSelect(lead.id)}
                      className="accent-emerald-400 w-4 h-4 cursor-pointer"
                    />
                  </td>

                  <td className="p-3 text-white/85 font-medium">{lead.nombre}</td>
                  <td className="p-3 text-white/70">{lead.correo}</td>
                  <td className="p-3 text-white/70">{lead.telefono}</td>
                  <td className="p-3 capitalize text-white/70">{lead.origen}</td>

                  <td className="p-3">
                    <span
                      className={[
                        "px-3 py-1 rounded-full text-xs font-semibold border",
                        lead.estado === "cerrado"
                          ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/20"
                          : lead.estado === "contactado"
                          ? "bg-amber-500/15 text-amber-200 border-amber-400/20"
                          : "bg-white/5 text-white/70 border-white/10",
                      ].join(" ")}
                    >
                      {lead.estado}
                    </span>
                  </td>

                  <td className="p-3 text-white/70 whitespace-nowrap">
                    {formatFecha(getLeadDateRaw(lead))}
                  </td>

                  <td className="p-3 text-white/70">{asignadoNombre(lead.asignado_a)}</td>

                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => (window.location.href = `/SpA/leads/${lead.id}`)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition"
                        type="button"
                      >
                        Ver caso
                      </button>

                      <button
                        onClick={() => deleteLead(lead.id)}
                        disabled={deletingId === lead.id}
                        className={
                          deletingId === lead.id
                            ? "px-3 py-1.5 rounded-xl text-xs font-semibold border border-white/10 bg-white/5 text-white/40 cursor-not-allowed"
                            : "px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-400/20 bg-red-500/10 text-white/85 hover:bg-red-500/20 transition"
                        }
                        type="button"
                        title="Borrar lead"
                      >
                        <Trash2 className="w-4 h-4 inline-block mr-1" />
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {leadsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-white/50">
                    No hay leads para mostrar con este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="h-px w-full bg-emerald-500/15" />
      </div>

      {/* MODAL */}
      <AssignUsers
        isOpen={showAssignUsers}
        onAssign={onAssignSelected}
        onClose={() => setShowAssignUsers(false)}
      />
    </div>
  );
}
