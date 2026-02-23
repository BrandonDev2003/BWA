"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { User, EstadoLaboral } from "./useUsuarios";

type EstadoFiltro = EstadoLaboral | "TODOS";

interface UsuariosTableProps {
  usuarios: User[];
  onEdit?: (user: User) => void; // <- void
}

export default function UsuariosTable({ usuarios, onEdit }: UsuariosTableProps) {
  const router = useRouter();

  const PAGE_SIZE = 8;

  // copia local para actualizaciones instantáneas
  const [rows, setRows] = useState<User[]>(usuarios);
  useEffect(() => setRows(usuarios), [usuarios]);

  // OTP delete
  const [mailing, setMailing] = useState(false);
  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [otp, setOtp] = useState("");

  // filtros
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("TODOS");
  const [q, setQ] = useState("");

  // paginación
  const [page, setPage] = useState(1);

  // modal salida
  const [salidaUser, setSalidaUser] = useState<User | null>(null);
  const [salidaTipo, setSalidaTipo] =
    useState<Exclude<EstadoLaboral, "ACTIVO">>("DESVINCULADO");
  const [salidaMotivo, setSalidaMotivo] = useState("");
  const [savingSalida, setSavingSalida] = useState(false);

  // modal reingreso
  const [reingresoUser, setReingresoUser] = useState<User | null>(null);
  const [reingresoMotivo, setReingresoMotivo] = useState("");
  const [savingReingreso, setSavingReingreso] = useState(false);

  const handleView = (user: User) => router.push(`/usuarios/${user.id}`);

  const getCorreo = (u: User) => (u.correo ?? u.email ?? "").toString();
  const getEstado = (u: User): EstadoLaboral =>
    (u.estado_laboral ?? "ACTIVO") as EstadoLaboral;

  const enviarOTP = async (user: User) => {
    try {
      setMailing(true);

      const res = await fetch("/api/auth/send-delete-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ correo: getCorreo(user) }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error enviando OTP");
        return;
      }

      setConfirmUser(user);
      alert("Código enviado a su correo");
    } catch (err) {
      console.error(err);
      alert("Error enviando OTP");
    } finally {
      setMailing(false);
    }
  };

  const eliminarUsuario = async () => {
    if (!confirmUser) return;

    try {
      const id = confirmUser.id;

      const res = await fetch(`/api/usuarios/eliminar/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          otp,
          correo: getCorreo(confirmUser),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "OTP incorrecto o expirado");
        return;
      }

      alert("Usuario eliminado correctamente");
      setConfirmUser(null);
      setOtp("");

      // UI instantánea
      setRows((prev) => prev.filter((x) => x.id !== id));

      router.refresh();
    } catch (err) {
      console.error("Error eliminando usuario:", err);
      alert("Error eliminando usuario");
    }
  };

  const guardarSalida = async () => {
    if (!salidaUser) return;

    const motivo = salidaMotivo.trim();
    if (motivo.length < 3) {
      alert("Escribe un motivo (mínimo 3 caracteres).");
      return;
    }

    try {
      setSavingSalida(true);

      const res = await fetch(`/api/usuarios/${salidaUser.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          estado_laboral: salidaTipo,
          motivo_salida: motivo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "No se pudo actualizar el estado");
        return;
      }

      // UI instantánea
      setRows((prev) =>
        prev.map((x) =>
          x.id === salidaUser.id
            ? {
                ...x,
                estado_laboral: salidaTipo,
                motivo_salida: motivo,
                motivo_reingreso: null,
                fecha_reingreso: null,
              }
            : x
        )
      );

      alert("Salida registrada correctamente");
      setSalidaUser(null);
      setSalidaMotivo("");
      setSalidaTipo("DESVINCULADO");
      router.refresh();
    } catch (err) {
      console.error("Error actualizando estado:", err);
      alert("Error actualizando estado");
    } finally {
      setSavingSalida(false);
    }
  };

  const guardarReingreso = async () => {
    if (!reingresoUser) return;

    const motivo = reingresoMotivo.trim();
    if (motivo.length < 3) {
      alert("Escribe un motivo (mínimo 3 caracteres).");
      return;
    }

    try {
      setSavingReingreso(true);

      const res = await fetch(`/api/usuarios/${reingresoUser.id}/reingreso`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          motivo_reingreso: motivo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "No se pudo registrar el reingreso");
        return;
      }

      // UI instantánea
      setRows((prev) =>
        prev.map((x) =>
          x.id === reingresoUser.id
            ? {
                ...x,
                estado_laboral: "ACTIVO",
                motivo_reingreso: motivo,
                motivo_salida: null,
              }
            : x
        )
      );

      alert("Reingreso registrado correctamente");
      setReingresoUser(null);
      setReingresoMotivo("");
      router.refresh();
    } catch (err) {
      console.error("Error registrando reingreso:", err);
      alert("Error registrando reingreso");
    } finally {
      setSavingReingreso(false);
    }
  };

  const usuariosFiltrados = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return rows.filter((u) => {
      const estado = getEstado(u);
      const okEstado = estadoFiltro === "TODOS" ? true : estado === estadoFiltro;
      const okQ =
        qq.length === 0
          ? true
          : `${u.nombre} ${getCorreo(u)}`.toLowerCase().includes(qq);

      return okEstado && okQ;
    });
  }, [rows, estadoFiltro, q]);

  useEffect(() => setPage(1), [estadoFiltro, q]);

  const total = usuariosFiltrados.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const start = (safePage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const usuariosPage = usuariosFiltrados.slice(start, end);

  const badgeEstado = (estado: EstadoLaboral) => {
    const base =
      "inline-flex items-center justify-center text-xs font-semibold px-3 py-1 rounded-full border border-white/10";
    if (estado === "ACTIVO")
      return (
        <span className={`${base} bg-emerald-600/20 text-emerald-200`}>ACTIVO</span>
      );
    if (estado === "DESVINCULADO")
      return (
        <span className={`${base} bg-red-600/20 text-red-200`}>DESVINCULADO</span>
      );
    return (
      <span className={`${base} bg-yellow-500/20 text-yellow-200`}>RENUNCIA</span>
    );
  };

  const pageButtons = useMemo(() => {
    const pages = Array.from({ length: totalPages }, (_, idx) => idx + 1)
      .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
      .reduce<number[]>((acc, p) => {
        if (acc.length === 0) return [p];
        const prev = acc[acc.length - 1];
        if (prev !== -1 && p - prev > 1) acc.push(-1);
        acc.push(p);
        return acc;
      }, []);
    return pages;
  }, [totalPages, safePage]);

  return (
    <div className="rounded-2xl p-6 border border-white/10 bg-white/5 shadow-xl backdrop-blur-md">
      {/* filtros */}
      <div className="mb-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-white/70 text-sm">Filtrar:</span>

          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value as EstadoFiltro)}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-white/20"
          >
            <option value="TODOS">Todos</option>
            <option value="ACTIVO">Activos</option>
            <option value="DESVINCULADO">Desvinculados</option>
            <option value="RENUNCIA">Renuncias</option>
          </select>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="min-w-[260px] rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white text-sm placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>

        <div className="text-white/60 text-sm">
          Mostrando{" "}
          <b className="text-white">
            {total === 0 ? 0 : start + 1}–{end}
          </b>{" "}
          de <b className="text-white">{total}</b>
        </div>
      </div>

      {/* tabla */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[1050px] table-fixed text-sm text-white/90">
          <thead>
            <tr className="bg-black/40 text-white uppercase tracking-wide border-b border-white/10">
              <th className="p-4 text-left w-[20%]">👤 Nombre</th>
              <th className="p-4 text-left w-[26%]">📧 Correo</th>
              <th className="p-4 text-left w-[12%]">⚙️ Rol</th>
              <th className="p-4 text-left w-[14%]">📁 Expediente</th>
              <th className="p-4 text-left w-[12%]">🧾 Estado</th>
              <th className="p-4 text-left w-[16%]">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {usuariosPage.map((u, i) => {
              const incompleto = u.estado_expediente === "INCOMPLETO";
              const faltantes = Array.isArray(u.faltantes) ? u.faltantes : [];
              const tooltipText =
                faltantes.length > 0
                  ? `Faltan: ${faltantes.join(", ")}`
                  : "Expediente incompleto";

              const estado = getEstado(u);
              const esActivo = estado === "ACTIVO";
              const puedeReingresar = estado === "DESVINCULADO" || estado === "RENUNCIA";

              const extraText =
                esActivo && u.motivo_reingreso
                  ? `Reingreso: ${u.motivo_reingreso}`
                  : !esActivo && u.motivo_salida
                  ? `Salida: ${u.motivo_salida}`
                  : null;

              return (
                <tr
                  key={u.id}
                  className={[
                    "border-b border-white/10 transition-colors",
                    i % 2 === 0 ? "bg-white/[0.03]" : "bg-white/[0.02]",
                    "hover:bg-white/[0.06]",
                  ].join(" ")}
                >
                  <td className="p-4 font-medium text-white">
                    <span className="truncate block">{u.nombre}</span>
                    <span className="text-xs text-white/40">ID: {u.id}</span>
                  </td>

                  <td className="p-4 text-white/80">
                    <span className="truncate block">{getCorreo(u)}</span>
                  </td>

                  <td className="p-4">
                    <span className="inline-flex items-center bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/10">
                      {u.rol}
                    </span>
                  </td>

                  <td className="p-4">
                    {incompleto ? (
                      <span className="relative inline-block group">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500 text-black font-bold cursor-help select-none">
                          ?
                        </span>
                        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block whitespace-normal w-72 z-50 bg-black/90 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-white/10">
                          {tooltipText}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-emerald-300 font-semibold">
                        ✔ Completo
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      {badgeEstado(estado)}
                      {extraText ? (
                        <span className="text-xs text-white/60 truncate" title={extraText}>
                          {extraText}
                        </span>
                      ) : null}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleView(u)}
                        className="bg-emerald-600/90 hover:bg-emerald-600 text-white px-3 py-1 rounded-md text-xs border border-white/10"
                      >
                        Ver
                      </button>

                      <button
                        onClick={() => onEdit && onEdit(u)}
                        className="bg-blue-600/90 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs border border-white/10"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => {
                          setReingresoUser(u);
                          setReingresoMotivo("");
                        }}
                        disabled={!puedeReingresar}
                        className="bg-purple-600/90 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded-md text-xs border border-white/10"
                      >
                        Reingreso
                      </button>

                      <button
                        onClick={() => {
                          setSalidaUser(u);
                          setSalidaTipo("DESVINCULADO");
                          setSalidaMotivo("");
                        }}
                        disabled={!esActivo}
                        className="bg-orange-500/90 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded-md text-xs border border-white/10"
                      >
                        Desvincular
                      </button>

                      <button
                        onClick={() => enviarOTP(u)}
                        disabled={mailing}
                        className="bg-red-600/90 hover:bg-red-600 disabled:opacity-60 text-white px-3 py-1 rounded-md text-xs border border-white/10"
                      >
                        {mailing ? "Enviando..." : "Borrar"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* paginación */}
      {total > 0 && (
        <div className="mt-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="text-white/60 text-sm">
            Página <b className="text-white">{safePage}</b> de{" "}
            <b className="text-white">{totalPages}</b>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⬅ Anterior
            </button>

            {pageButtons.map((p, idx) =>
              p === -1 ? (
                <span key={`dots-${idx}`} className="text-white/50 px-2">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={[
                    "px-3 py-2 rounded-lg border text-sm",
                    p === safePage
                      ? "bg-white/20 border-white/20 text-white"
                      : "bg-white/10 hover:bg-white/15 border-white/10 text-white",
                  ].join(" ")}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente ➡
            </button>
          </div>
        </div>
      )}

      {/* MODAL SALIDA */}
      {salidaUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md p-6 shadow-2xl text-white">
            <h2 className="text-lg font-bold">Registrar salida</h2>

            <p className="text-sm mt-2 text-white/80">
              Usuario: <b>{salidaUser.nombre}</b> —{" "}
              <span className="text-white/70">{getCorreo(salidaUser)}</span>
            </p>

            <div className="mt-4 grid gap-3">
              <label className="text-sm text-white/80">Tipo de salida</label>
              <select
                value={salidaTipo}
                onChange={(e) => setSalidaTipo(e.target.value as any)}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-white/20"
              >
                <option value="DESVINCULADO">Desvinculado</option>
                <option value="RENUNCIA">Renuncia</option>
              </select>

              <label className="text-sm text-white/80">Motivo / comentario</label>
              <textarea
                value={salidaMotivo}
                onChange={(e) => setSalidaMotivo(e.target.value)}
                rows={4}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>

            <div className="flex justify-between gap-3 mt-5">
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10"
                onClick={() => {
                  setSalidaUser(null);
                  setSalidaMotivo("");
                  setSalidaTipo("DESVINCULADO");
                }}
                disabled={savingSalida}
              >
                Cancelar
              </button>

              <button
                className="flex-1 px-4 py-2 rounded-lg bg-orange-500/90 hover:bg-orange-500 text-white border border-white/10 disabled:opacity-60"
                onClick={guardarSalida}
                disabled={savingSalida}
              >
                {savingSalida ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REINGRESO */}
      {reingresoUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md p-6 shadow-2xl text-white">
            <h2 className="text-lg font-bold">Registrar reingreso</h2>

            <p className="text-sm mt-2 text-white/80">
              Usuario: <b>{reingresoUser.nombre}</b> —{" "}
              <span className="text-white/70">{getCorreo(reingresoUser)}</span>
            </p>

            <div className="mt-4 grid gap-3">
              <label className="text-sm text-white/80">Motivo de reingreso</label>
              <textarea
                value={reingresoMotivo}
                onChange={(e) => setReingresoMotivo(e.target.value)}
                rows={4}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>

            <div className="flex justify-between gap-3 mt-5">
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10"
                onClick={() => {
                  setReingresoUser(null);
                  setReingresoMotivo("");
                }}
                disabled={savingReingreso}
              >
                Cancelar
              </button>

              <button
                className="flex-1 px-4 py-2 rounded-lg bg-purple-600/90 hover:bg-purple-600 text-white border border-white/10 disabled:opacity-60"
                onClick={guardarReingreso}
                disabled={savingReingreso}
              >
                {savingReingreso ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL OTP */}
      {confirmUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md p-6 shadow-2xl text-center text-white">
            <h2 className="text-lg font-bold">Confirmar Eliminación</h2>
            <p className="text-sm mt-2 mb-4 text-white/80">
              Ingresa el código enviado a <b>{getCorreo(confirmUser)}</b>
            </p>

            <input
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Código OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <div className="flex justify-between gap-3 mt-4">
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10"
                onClick={() => {
                  setConfirmUser(null);
                  setOtp("");
                }}
              >
                Cancelar
              </button>

              <button
                className="flex-1 px-4 py-2 rounded-lg bg-red-600/90 hover:bg-red-600 text-white border border-white/10"
                onClick={eliminarUsuario}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}