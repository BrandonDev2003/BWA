interface Note {
  id: number;
  contenido: string;
  fecha: string;
  autor: string;
}

export default function LeadNoteItem({ note }: { note: Note }) {
  const fecha = new Date(note.fecha).toLocaleString("es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <li className="border border-gray-300 bg-white rounded-lg p-3">
      <p className="text-black whitespace-pre-wrap">{note.contenido}</p>
      <div className="flex justify-between text-sm text-gray-500 mt-2">
        <span>{note.autor}</span>
        <span>{fecha}</span>
      </div>
    </li>
  );
}
