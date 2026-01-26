"use client";

import { useState } from "react";

export default function QuipuxMailPanel({
  message,
  onSend,
  onClose,
}: {
  message: string;
  onSend: (data: {
    message: string;
    subject: string;
    recipients: string[];
  }) => void;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [emails, setEmails] = useState("");

  return (
    <div className="border rounded-lg p-3 mb-3 bg-black/90">
      <div className="text-sm font-semibold mb-2">
        Enviar como correo (Quipux)
      </div>

      <input
        placeholder="Asunto"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full border rounded px-3 py-1 mb-2 text-sm"
      />

      <input
        placeholder="Correos separados por coma"
        value={emails}
        onChange={(e) => setEmails(e.target.value)}
        className="w-full border rounded px-3 py-1 mb-2 text-sm"
      />

      <div className="flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="text-sm text-gray-500"
        >
          Cancelar
        </button>
        <button
          onClick={() =>
            onSend({
              message,
              subject,
              recipients: emails.split(",").map((e) => e.trim()),
            })
          }
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          Enviar chat + correo
        </button>
      </div>
    </div>
  );
}
