"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { XCircle } from "lucide-react";

interface LeadCaseModalProps {
  leadId: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function LeadCaseModal({ leadId, onClose, onSaved }: LeadCaseModalProps) {
  const [formData, setFormData] = useState({
    tipo: "",
    resultado: "",
    proxima_accion: "",
    comentario: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-[400px] p-6 rounded-2xl relative"
      >
        <button className="absolute top-3 right-3" onClick={onClose}>
          <XCircle className="text-gray-500 hover:text-red-500 w-6 h-6" />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-black">Registrar caso</h2>

        <div className="flex flex-col gap-3">
          <input
            name="tipo"
            placeholder="Tipo de caso (ej. Seguimiento, Llamada)"
            className="border rounded-md p-2 text-sm"
            value={formData.tipo}
            onChange={handleChange}
          />
          <input
            name="resultado"
            placeholder="Resultado (ej. Cliente interesado)"
            className="border rounded-md p-2 text-sm"
            value={formData.resultado}
            onChange={handleChange}
          />
          <input
            name="proxima_accion"
            placeholder="Próxima acción o seguimiento"
            className="border rounded-md p-2 text-sm"
            value={formData.proxima_accion}
            onChange={handleChange}
          />
          <textarea
            name="comentario"
            placeholder="Escribe tu comentario"
            className="border rounded-md p-2 h-24 text-sm"
            value={formData.comentario}
            onChange={handleChange}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !formData.comentario}
          className="mt-4 w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400"
        >
          {loading ? "Guardando..." : "Guardar caso"}
        </button>
      </motion.div>
    </div>
  );
}
