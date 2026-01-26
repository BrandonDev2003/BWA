"use client";

import React from "react";
import LeadRow from "./LeadRow";
import { LeadDTO } from "@/lib/leadsService";

type Props = {
  leads: LeadDTO[];
  selectedLeads: number[];
  setSelectedLeads: (ids: number[]) => void;
  onEstadoChange: (id: number, nuevoEstado: string) => Promise<void> | void;
  onOpenCaseModal: (leadId: number) => void;
};

export default function LeadTable({
  leads,
  selectedLeads,
  setSelectedLeads,
  onEstadoChange,
  onOpenCaseModal,
}: Props) {
  const allSelected = leads.length > 0 && selectedLeads.length === leads.length;

  const toggleSelect = (id: number) => {
    setSelectedLeads(
      selectedLeads.includes(id)
        ? selectedLeads.filter((x) => x !== id)
        : [...selectedLeads, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedLeads(allSelected ? [] : leads.map((l) => l.id));
  };

  return (
    <div
      className="
        rounded-3xl
        border border-white/10
        bg-white/5
        backdrop-blur-2xl
        shadow-2xl
        overflow-hidden
      "
    >
      {/* Toolbar arriba (opcional) */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
        <div className="text-sm text-white/70">
          Total: <span className="text-white/90 font-semibold">{leads.length}</span>
          {selectedLeads.length > 0 && (
            <>
              {" "}
              • Seleccionados:{" "}
              <span className="text-emerald-300 font-semibold">{selectedLeads.length}</span>
            </>
          )}
        </div>

        <div className="text-xs text-white/50">
          Tip: click en una fila para ver detalles
        </div>
      </div>

      {/* Scroll horizontal si hay muchas columnas */}
      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full text-left">
          <thead className="bg-black/30">
            <tr className="border-b border-white/10">
              <th className="p-3 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 accent-emerald-400"
                />
              </th>

              {[
                "Nombre",
                "Apellido",
                "Correo",
                "Teléfono",
                "Código",
                "País",
                "Meses",
                "Monto",
                "Origen",
                "Estado",
                "Asignado a",
                "Acciones",
              ].map((h) => (
                <th
                  key={h}
                  className="p-3 text-xs font-semibold tracking-wide text-white/60 uppercase whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={13} className="p-10 text-center text-white/50">
                  No hay leads para mostrar.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={{
                    // ✅ tu LeadDTO usa meses/monto, LeadRow debe usar lo mismo
                    ...lead,
                  }}
                  selected={selectedLeads.includes(lead.id)}
                  toggleSelect={toggleSelect}
                  onEstadoChange={onEstadoChange}
                  onRefresh={() => {}}
                  onOpenModal={() => onOpenCaseModal(lead.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer line */}
      <div className="h-px w-full bg-emerald-500/15" />
    </div>
  );
}
