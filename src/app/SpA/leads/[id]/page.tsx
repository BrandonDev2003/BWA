"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Note = {
  id: number;
  contenido: string;
  autor_id: number;
  autor_nombre?: string;
  fecha_hora: string;
};

type Lead = {
  id: number;
  nombre: string;
  apellido?: string;
  correo: string;
  telefono: string;

  codigo_pais?: string;
  pais?: string;
  meses_inversion?: number;
  monto_inversion?: number;

  origen: string;
  estado: "pendiente" | "contactado" | "cerrado";

  asignado_a?: number;
  nombre_asesor?: string;
};

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = Array.isArray(params.id) ? params.id[0] : params.id;

  const router = useRouter();

  const [validando, setValidando] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);

  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(true);

  /* ===========================================================
     VALIDAR SESIÓN + VALIDAR ROL OBLIGATORIO
  ============================================================ */
  useEffect(() => {
    fetch("/api/auth/verify", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        // ❌ No logueado → al login
        if (!data.ok) {
          router.push("/login");
          return;
        }

        // ❌ Usuario sin rol → al login
        if (!data.user?.rol || data.user.rol.trim() === "") {
          router.push("/login");
          return;
        }

        // ✔ Usuario válido
        setUsuario(data.user);
        setValidando(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  /* ===========================================================
     CARGAR LEAD + NOTAS (solo después de validar)
  ============================================================ */
  useEffect(() => {
    if (!usuario) return;

    async function cargarLead() {
      try {
        setLoading(true);

        const leadRes = await fetch(`/api/leads/${leadId}`, {
          credentials: "include",
        });

        if (!leadRes.ok) {
          router.push("/no-autorizado");
          return;
        }

        const leadData = await leadRes.json();

        // Restricción adicional: asesor solo ve sus leads
        const esAsesor = usuario.rol === "asesor";
        if (esAsesor && leadData.asignado_a !== usuario.id) {
          router.push("/no-autorizado");
          return;
        }

        setLead(leadData);

        // Cargar notas
        const notesRes = await fetch(`/api/leads/${leadId}/notes`, {
          credentials: "include",
        });

        const notesData = await notesRes.json();
        setNotes(notesData);

      } catch (err) {
        console.error(err);
        router.push("/no-autorizado");
      } finally {
        setLoading(false);
      }
    }

    cargarLead();
  }, [usuario, leadId, router]);

  /* ===========================================================
     ESTADOS DE CARGA
  ============================================================ */
  if (validando)
    return (
      <div className="flex justify-center items-center h-screen text-black">
        Validando acceso...
      </div>
    );

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Cargando...
      </div>
    );

  if (!lead)
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Lead no encontrado
      </div>
    );

  /* ===========================================================
     CAMBIAR ESTADO
  ============================================================ */
  const handleChangeEstado = async (nuevoEstado: string) => {
    if (!lead) return;
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const updated = await res.json();

      setLead((prev) => (prev ? { ...prev, estado: updated.estado } : prev));
    } catch (err) {
      console.error(err);
    }
  };

  /* ===========================================================
     AGREGAR NOTA
  ============================================================ */
  const handlePostNote = async () => {
    if (!noteText.trim()) return;

    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ contenido: noteText }),
      });

      if (!res.ok) {
        console.error("Error al guardar nota");
        return;
      }

      const updatedNotes = await fetch(`/api/leads/${leadId}/notes`, {
        credentials: "include",
      }).then((r) => r.json());

      setNotes(updatedNotes);
      setNoteText("");
    } catch (err) {
      console.error(err);
    }
  };

  /* ===========================================================
     RENDER
  ============================================================ */

  return (
    <div className="bg-black flex justify-center items-start min-h-screen p-6">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            {lead.nombre} {lead.apellido || ""}
          </h2>

          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <label className="font-semibold text-gray-700">Estado:</label>

            <select
              value={lead.estado}
              onChange={(e) => handleChangeEstado(e.target.value)}
              className={`px-3 py-2 rounded-lg font-medium text-white
              ${
                lead.estado === "pendiente"
                  ? "bg-yellow-500"
                  : lead.estado === "contactado"
                  ? "bg-blue-500"
                  : "bg-green-500"
              }`}
            >
              <option value="pendiente">Pendiente</option>
              <option value="contactado">Contactado</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>
        </div>

        {/* INFO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-gray-700">
          <div>
            <p><span className="font-semibold">Correo: </span>{lead.correo}</p>
            <p><span className="font-semibold">Teléfono: </span>{lead.codigo_pais} {lead.telefono}</p>
            <p><span className="font-semibold">País: </span>{lead.pais || "—"}</p>
            <p><span className="font-semibold">Origen: </span>{lead.origen}</p>
          </div>

          <div>
            <p><span className="font-semibold">Meses inversión: </span>{lead.meses_inversion ?? "—"}</p>
            <p><span className="font-semibold">Monto inversión: </span>${lead.monto_inversion ?? "—"}</p>
            <p><span className="font-semibold">Asignado a: </span>{lead.nombre_asesor || lead.asignado_a || "Sin asignar"}</p>
          </div>
        </div>

        {/* AGREGAR NOTA */}
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700">Agregar nota:</label>
          <textarea
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
            rows={3}
            placeholder="Escribe aquí tu nota..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <button
            onClick={handlePostNote}
            className="mt-2 px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Guardar nota
          </button>
        </div>

        {/* HISTORIAL */}
        <div>
          <h3 className="text-2xl font-bold mb-4 text-gray-800">Historial de notas</h3>

          {notes.length === 0 ? (
            <p className="text-gray-500">No hay notas aún.</p>
          ) : (
            <ul className="space-y-4">
              {notes.map((n) => (
                <li key={n.id} className="p-4 bg-white border-l-4 border-blue-500 rounded-lg shadow-sm">
                  <div className="text-gray-800">{n.contenido}</div>

                  <div className="mt-2 text-xs text-gray-500">
                    Por: {n.autor_nombre || `Usuario #${n.autor_id}`} ·{" "}
                    {new Date(n.fecha_hora).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
