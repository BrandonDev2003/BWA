"use client";
import { useEffect, useState } from "react";
import LeadCard from "./components/LeadCard";
import Sidebar from "./components/Sidebar";

interface Lead {
  id?: number;
  asignado_a?: number;
  origen?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  correo?: string;
  estado?: "Nuevo" | "Contactado" | "En Proceso" | "Cerrado";
  codigo_pais?: string;
  pais?: string;
  meses_inversion?: number;
  monto_inversion?: number;
  [key: string]: any;
}

export default function LeadsGestion() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ ESTO FALTABA (por eso te daba Cannot find name 'sidebarOpen')
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [filtro, setFiltro] = useState<
    "todos" | "pendiente" | "contactado" | "cerrado"
  >("todos");

  const [openForm, setOpenForm] = useState(false);

  // ✅ Ecuador por defecto
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    correo: "",
    estado: "Nuevo" as Lead["estado"],
    codigo_pais: "+593",
    pais: "Ecuador",
    meses_inversion: 0,
    monto_inversion: 0,
  });

  useEffect(() => {
    fetch("/api/leads/asesor", { credentials: "include" })
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const data = await res.json().catch(() => ({}));

        const validLeads: Lead[] = (data.leads || []).filter(
          (lead: Lead) => lead && (lead.id || lead.nombre || lead.telefono)
        );

        setLeads(validLeads);
      })
      .catch(() => setError("Error cargando datos"))
      .finally(() => setLoading(false));
  }, []);

  async function crearLead() {
    if (!form.nombre.trim() || !form.telefono.trim()) {
      alert("⚠ Nombre y Teléfono son obligatorios");
      return;
    }
    if ((form.codigo_pais || "").trim().length > 10) {
      alert("⚠ El código de país no puede superar 10 caracteres");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/leads/asesor", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          telefono: form.telefono.trim(),
          correo: form.correo.trim(),
          estado: form.estado,
          codigo_pais: form.codigo_pais.trim(),
          pais: form.pais.trim(),
          meses_inversion: Number(form.meses_inversion) || 0,
          monto_inversion: Number(form.monto_inversion) || 0,
        }),
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(`⚠ ${data?.error || "No se pudo crear el lead"}`);
        return;
      }

      setLeads((prev) => [data.lead, ...prev]);

      setForm({
        nombre: "",
        apellido: "",
        telefono: "",
        correo: "",
        estado: "Nuevo",
        codigo_pais: "+593",
        pais: "Ecuador",
        meses_inversion: 0,
        monto_inversion: 0,
      });

      setOpenForm(false);
    } catch {
      alert("⚠ Error creando lead");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-6 text-white/80">Cargando...</p>;
  if (error) return <p className="p-6 text-red-400">{error}</p>;

  const leadsFiltrados = leads.filter((lead) => {
    if (filtro === "todos") return true;
    if (filtro === "pendiente")
      return lead.estado === "Nuevo" || lead.estado === "En Proceso";
    if (filtro === "contactado") return lead.estado === "Contactado";
    if (filtro === "cerrado") return lead.estado === "Cerrado";
    return true;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex-1 p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-white">
            Gestión de Leads del Asesor
          </h1>

          <button
            onClick={() => setOpenForm(true)}
            className="
              px-4 py-2 rounded-xl
              bg-emerald-500/90 text-white
              hover:bg-emerald-500
              border border-white/10
              shadow-lg shadow-emerald-500/10
              transition
            "
          >
            + Agregar Lead
          </button>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <FilterBtn active={filtro === "todos"} onClick={() => setFiltro("todos")}>
            Todos
          </FilterBtn>
          <FilterBtn
            active={filtro === "pendiente"}
            onClick={() => setFiltro("pendiente")}
          >
            Pendientes
          </FilterBtn>
          <FilterBtn
            active={filtro === "contactado"}
            onClick={() => setFiltro("contactado")}
          >
            Contactados
          </FilterBtn>
          <FilterBtn active={filtro === "cerrado"} onClick={() => setFiltro("cerrado")}>
            Cerrados
          </FilterBtn>
        </div>

        {leadsFiltrados.length === 0 ? (
          <p className="text-white/70">No hay leads en esta categoría.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leadsFiltrados.map((lead) => (
              <LeadCard
                key={lead.id || `${lead.nombre}-${lead.telefono}-${Math.random()}`}
                lead={lead}
              />
            ))}
          </div>
        )}

        {openForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => !saving && setOpenForm(false)}
          >
            <div
              className="
                w-full max-w-2xl rounded-3xl
                border border-white/10
                bg-white/5 backdrop-blur-2xl
                shadow-2xl
                p-6 text-white
              "
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Nuevo Lead</h2>
                  <p className="text-sm text-white/60 mt-1">
                    asignado_a y origen se guardan automáticamente.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenForm(false)}
                  disabled={saving}
                  className="
                    h-9 w-9 rounded-xl
                    border border-white/10
                    bg-white/5
                    hover:bg-white/10
                    text-white/70 hover:text-white
                    transition
                  "
                  aria-label="Cerrar"
                  title="Cerrar"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Nombre *"
                  value={form.nombre}
                  onChange={(v) => setForm((f) => ({ ...f, nombre: v }))}
                  placeholder="Ej: Juan"
                />

                <InputField
                  label="Apellido"
                  value={form.apellido}
                  onChange={(v) => setForm((f) => ({ ...f, apellido: v }))}
                  placeholder="Ej: Pérez"
                />

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField
                    label="Código País"
                    value={form.codigo_pais}
                    maxLength={10}
                    onChange={(v) => {
                      if (v.length > 10) {
                        alert("⚠ El código de país no puede superar 10 caracteres");
                        return;
                      }
                      setForm((f) => ({ ...f, codigo_pais: v }));
                    }}
                    placeholder="+593"
                  />

                  <div className="md:col-span-2">
                    <InputField
                      label="Teléfono *"
                      value={form.telefono}
                      onChange={(v) => setForm((f) => ({ ...f, telefono: v }))}
                      placeholder="0999999999"
                    />
                  </div>
                </div>

                <InputField
                  label="Correo"
                  value={form.correo}
                  onChange={(v) => setForm((f) => ({ ...f, correo: v }))}
                  placeholder="correo@empresa.com"
                />

                <InputField
                  label="País"
                  value={form.pais}
                  onChange={(v) => setForm((f) => ({ ...f, pais: v }))}
                  placeholder="Ecuador"
                />

                <div>
                  <label className="text-sm text-white/70 mb-1 block">Estado</label>
                  <select
                    className="
                      w-full rounded-2xl px-3 py-2
                      bg-white/10 border border-white/10
                      text-white
                      focus:outline-none focus:ring-2 focus:ring-emerald-400/60
                    "
                    value={form.estado}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        estado: e.target.value as Lead["estado"],
                      }))
                    }
                  >
                    <option value="Nuevo" className="text-black">Nuevo</option>
                    <option value="Contactado" className="text-black">Contactado</option>
                    <option value="En Proceso" className="text-black">En Proceso</option>
                    <option value="Cerrado" className="text-black">Cerrado</option>
                  </select>
                </div>

                <InputNumber
                  label="Meses de inversión"
                  value={form.meses_inversion}
                  onChange={(v) => setForm((f) => ({ ...f, meses_inversion: v }))}
                  placeholder="0"
                />

                <InputNumber
                  label="Monto de inversión"
                  value={form.monto_inversion}
                  onChange={(v) => setForm((f) => ({ ...f, monto_inversion: v }))}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center justify-between gap-3 mt-6">
                <p className="text-xs text-white/50">* Obligatorio: Nombre y Teléfono</p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setOpenForm(false)}
                    disabled={saving}
                    className="
                      px-4 py-2 rounded-2xl
                      border border-white/15
                      bg-white/5
                      text-white/70 hover:text-white
                      hover:bg-white/10
                      transition
                    "
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={crearLead}
                    disabled={saving || !form.nombre.trim() || !form.telefono.trim()}
                    className="
                      px-5 py-2 rounded-2xl
                      bg-emerald-500/90 text-white
                      hover:bg-emerald-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition
                    "
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-4 py-2 rounded-2xl border transition",
        active
          ? "bg-emerald-500/80 border-emerald-400/30 text-white"
          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="text-sm text-white/70 mb-1 block">{label}</label>
      <input
        className="
          w-full rounded-2xl px-3 py-2
          bg-white/10 border border-white/10
          text-white placeholder:text-white/30
          focus:outline-none focus:ring-2 focus:ring-emerald-400/60
        "
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function InputNumber({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm text-white/70 mb-1 block">{label}</label>
      <input
        type="number"
        className="
          w-full rounded-2xl px-3 py-2
          bg-white/10 border border-white/10
          text-white placeholder:text-white/30
          focus:outline-none focus:ring-2 focus:ring-emerald-400/60
        "
        value={Number.isFinite(value) ? value : 0}
        placeholder={placeholder}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
