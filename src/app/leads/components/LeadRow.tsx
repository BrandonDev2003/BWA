"use client";

import React, { useState } from "react";
import { LeadDTO } from "@/lib/leadsService";

interface Props {
  lead: LeadDTO;
  selected: boolean;
  toggleSelect: (id: number) => void;
  onEstadoChange: (id: number, NuevoEstado: string) => void;
  onRefresh: () => void;
  onOpenModal: () => void;
}

export default function LeadRow({
  lead,
  selected,
  toggleSelect,
  onEstadoChange,
  onRefresh,
  onOpenModal,
}: Props) {
  const [open, setOpen] = useState(false);

  const telefonoCompleto = `${lead.codigo_pais ?? ""} ${lead.telefono ?? ""}`.trim();

  const formatMonto = (m?: number | null) =>
    m == null
      ? "-"
      : new Intl.NumberFormat("es-EC", {
          style: "currency",
          currency: "USD",
        }).format(m);

  const estadoNormalizado = lead.estado === "Nuevo" ? "pendiente" : lead.estado;

  const rowBase = "border-t border-white/10 cursor-pointer transition-colors";
  const rowState = selected
    ? "bg-emerald-500/10 hover:bg-emerald-500/15"
    : "hover:bg-white/5";

  const td = "p-2 text-sm text-white/75";
  const tdStrong = "p-2 text-sm text-white/85";

  return (
    <>
      <tr className={`${rowBase} ${rowState}`} onClick={() => setOpen(!open)}>
        {/* Checkbox */}
        <td className="p-2 text-center">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelect(lead.id);
            }}
            className="h-4 w-4 accent-emerald-400 cursor-pointer"
          />
        </td>

        <td className={tdStrong}>{lead.nombre}</td>
        <td className={td}>{lead.apellido ?? "-"}</td>
        <td className={td}>{lead.correo}</td>
        <td className={td}>{telefonoCompleto || "-"}</td>
        <td className={td}>{lead.codigo_pais ?? "-"}</td>
        <td className={td}>{lead.pais ?? "-"}</td>
        <td className={td}>{lead.meses_inversion ?? "-"}</td>
        <td className={td}>{formatMonto(lead.monto_inversion)}</td>
        <td className={td}>{lead.origen ?? "-"}</td>

        {/* SELECT DE ESTADO */}
        <td className="p-2">
          <select
            value={estadoNormalizado}
            onChange={async (e) => {
              e.stopPropagation();
              const NuevoEstado =
                e.target.value === "pendiente" ? "pendiente" : e.target.value;
              await onEstadoChange(lead.id, NuevoEstado);
              onRefresh();
            }}
            onClick={(e) => e.stopPropagation()}
            className="
              w-full
              rounded-full
              px-3 py-1.5
              text-xs font-semibold
              border border-white/10
              bg-black/30
              text-white/80
              outline-none
              hover:bg-black/40
              focus:border-emerald-400/30
              focus:ring-2 focus:ring-emerald-500/15
              transition
            "
          >
            <option className="bg-[#0B0D10]" value="pendiente">
              Pendiente
            </option>
            <option className="bg-[#0B0D10]" value="contactado">
              Contactado
            </option>
            <option className="bg-[#0B0D10]" value="cerrado">
              Cerrado
            </option>
          </select>
        </td>

        <td className={td}>{lead.asignado_a ?? "-"}</td>

        <td className="p-2 text-right whitespace-nowrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal();
            }}
            className="
              mr-2
              px-3 py-1.5
              rounded-xl
              text-xs font-semibold
              border border-emerald-400/20
              bg-emerald-500/15
              text-white/90
              hover:bg-emerald-500/25
              hover:border-emerald-400/30
              transition
            "
          >
            Registrar caso
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/leads/${lead.id}`;
            }}
            className="
              px-3 py-1.5
              rounded-xl
              text-xs font-semibold
              border border-white/10
              bg-white/5
              text-white/80
              hover:bg-white/10
              hover:text-white
              transition
            "
          >
            Ver perfil
          </button>
        </td>
      </tr>

      {/* ROW EXPANDIBLE */}
      {open && (
        <tr className="border-t border-white/10">
          <td colSpan={13} className="p-4">
            <div
              className="
                rounded-2xl
                border border-white/10
                bg-black/25
                backdrop-blur-xl
                p-4
                text-sm
              "
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-white/75">
                <div>
                  <span className="text-white/50 font-semibold">Creado:</span>{" "}
                  {lead.creado_en ? new Date(lead.creado_en).toLocaleString() : "-"}
                </div>
                <div>
                  <span className="text-white/50 font-semibold">Origen:</span>{" "}
                  {lead.origen ?? "-"}
                </div>

                <div className="md:col-span-2 mt-2">
                  <div className="text-white/80 font-semibold mb-2">Notas</div>

                  {lead.notas && lead.notas.length > 0 ? (
                    <div className="space-y-2">
                      {lead.notas.map((n) => (
                        <div
                          key={n.id}
                          className="
                            rounded-2xl
                            border border-white/10
                            bg-white/5
                            p-3
                          "
                        >
                          <div className="text-xs text-white/45 mb-1">
                            {n.fecha_hora
                              ? new Date(n.fecha_hora).toLocaleString()
                              : "-"}
                          </div>
                          <div className="text-sm text-white/80">
                            {n.contenido ?? "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/45">No hay notas</div>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
