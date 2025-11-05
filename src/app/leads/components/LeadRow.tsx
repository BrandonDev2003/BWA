"use client";

import React, { useState } from "react";
import { LeadDTO } from "@/lib/leadsService";

interface Props {
  lead: LeadDTO;
  selected: boolean;
  toggleSelect: (id: number) => void;
  onEstadoChange: (id: number, nuevoEstado: string) => void;
  onRefresh: () => void;
  onOpenModal: () => void; // 🔹 nuevo prop
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

  return (
    <>
      <tr
        className={`border-t ${
          selected ? "bg-slate-600" : "hover:bg-gray-100"
        } cursor-pointer`}
        onClick={() => setOpen(!open)}
      >
        <td className="p-2 text-center">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelect(lead.id);
            }}
            className="w-4 h-4"
          />
        </td>

        <td className="p-2">{lead.nombre}</td>
        <td className="p-2">{lead.apellido ?? "-"}</td>
        <td className="p-2">{lead.correo}</td>
        <td className="p-2">{telefonoCompleto || "-"}</td>
        <td className="p-2">{lead.codigo_pais ?? "-"}</td>
        <td className="p-2">{lead.pais ?? "-"}</td>
        <td className="p-2">{lead.meses_inversion ?? "-"}</td>
        <td className="p-2">{formatMonto(lead.monto_inversion)}</td>
        <td className="p-2">{lead.origen ?? "-"}</td>

        <td className="p-2">
          <select
            value={lead.estado}
            onChange={async (e) => {
              e.stopPropagation();
              await onEstadoChange(lead.id, e.target.value);
            }}
            className="rounded-full px-2 py-1 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="pendiente">Pendiente</option>
            <option value="contactado">Contactado</option>
            <option value="cerrado">Cerrado</option>
          </select>
        </td>

        <td className="p-2">{lead.asignado_a ?? "-"}</td>

        <td className="p-2 text-right">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal(); // 🔹 ahora se maneja en LeadTable
            }}
            className="bg-green-500 text-white px-3 py-1 rounded text-sm mr-2"
          >
            Registrar caso
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/leads/${lead.id}`;
            }}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
          >
            Ver perfil
          </button>
        </td>
      </tr>

      {open && (
        <tr className="bg-gray-50">
          <td colSpan={13} className="p-4 text-sm text-gray-700">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <strong>Creado:</strong>{" "}
                {lead.creado_en ? new Date(lead.creado_en).toLocaleString() : "-"}
              </div>
              <div>
                <strong>Origen:</strong> {lead.origen ?? "-"}
              </div>
              <div className="col-span-2">
                {lead.notas && lead.notas.length > 0 ? (
                  <div className="space-y-2">
                    {lead.notas.map((n) => (
                      <div key={n.id} className="p-2 border rounded bg-white">
                        <div className="text-xs text-gray-500">
                          {new Date(n.fecha_creacion).toLocaleString()}
                        </div>
                        <div>{n.comentario}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">No hay notas</div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
