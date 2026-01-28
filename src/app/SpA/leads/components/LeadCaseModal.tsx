"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface LeadCaseModalProps {
  leadId: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function LeadCaseModal({
  leadId,
  onClose,
  onSaved,
}: LeadCaseModalProps) {
  const [formData, setFormData] = useState({
    tipo: "",
    resultado: "",
    proxima_accion: "",
    comentario: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const res = await fetch(`/api/leads/${leadId}/casos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    setLoading(false);

    if (res.ok) {
      onSaved();
      onClose();
    } else {
      alert("Error al guardar el caso");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 18 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 18 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="
          relative w-[460px] max-w-[95vw]
          rounded-3xl
          border border-white/10
          bg-white/5
          backdrop-blur-2xl
          shadow-2xl
          overflow-hidden
        "
      >
        {/* overlay oscuro interno */}
        <div className="pointer-events-none absolute inset-0 bg-black/25" />

        {/* header */}
        <div className="relative p-6 pb-4">
          <button
            className="
              absolute top-4 right-4
              h-9 w-9 rounded-full
              border border-white/10
              bg-black/30
              text-white/70
              hover:text-white hover:bg-black/45 hover:border-white/20
              transition
              flex items-center justify-center
            "
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-lg font-semibold text-white">Registrar caso</h2>
          <p className="mt-1 text-sm text-white/60">
            Registra el contacto y la próxima acción para este lead.
          </p>
        </div>

        {/* form */}
        <div className="relative px-6 pb-6">
          <div className="flex flex-col gap-3">
            <InputDark
              name="tipo"
              placeholder="Tipo de caso (ej. Seguimiento, Llamada)"
              value={formData.tipo}
              onChange={handleChange}
            />

            <InputDark
              name="resultado"
              placeholder="Resultado (ej. Cliente interesado)"
              value={formData.resultado}
              onChange={handleChange}
            />

            <InputDark
              name="proxima_accion"
              placeholder="Próxima acción o seguimiento"
              value={formData.proxima_accion}
              onChange={handleChange}
            />

            <textarea
              name="comentario"
              placeholder="Escribe tu comentario"
              className="
                w-full h-28 resize-none
                rounded-2xl
                border border-white/10
                bg-black/20
                px-4 py-3
                text-sm text-white/90 placeholder:text-white/35
                outline-none
                focus:border-emerald-400/30 focus:ring-2 focus:ring-emerald-500/15
                transition
              "
              value={formData.comentario}
              onChange={handleChange}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !formData.comentario}
            className={[
              "mt-5 w-full py-2.5 rounded-2xl font-semibold transition border",
              loading || !formData.comentario
                ? "bg-white/5 text-white/40 border-white/10 cursor-not-allowed"
                : "bg-emerald-500/90 hover:bg-emerald-500 text-black border-emerald-400/30",
            ].join(" ")}
          >
            {loading ? "Guardando..." : "Guardar caso"}
          </button>

          {!formData.comentario && (
            <p className="mt-3 text-xs text-white/40 text-center">
              Escribe un comentario para habilitar el botón.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function InputDark({
  name,
  placeholder,
  value,
  onChange,
}: {
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="
        w-full
        rounded-2xl
        border border-white/10
        bg-black/20
        px-4 py-3
        text-sm text-white/90 placeholder:text-white/35
        outline-none
        focus:border-emerald-400/30 focus:ring-2 focus:ring-emerald-500/15
        transition
      "
    />
  );
}
