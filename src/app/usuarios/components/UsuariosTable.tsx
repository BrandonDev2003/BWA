"use client";

interface User {
  id: number;
  nombre_completo: string;
  correo: string;
  rol: string;
}

export default function UsuariosTable({ usuarios }: { usuarios: User[] }) {
  return (
    <div className="bg-transparent rounded-2xl p-6 border  shadow-xl border-black">
      <div className="border-black overflow-x-auto rounded-xl">
        <table className="w-full border-collapse border-black  text-sm">
          <thead>
            <tr className="bg-black text-white uppercase tracking-wide border-b border-[#1c2940]">
              <th className="text-white p-4 text-left border-r border-[#1c2940] rounded-tl-xl">
                👤 Nombre
              </th>
              <th className="p-4 text-left border-r border-[#1c2940]">
                📧 Correo
              </th>
              <th className="p-4 text-left rounded-tr-xl">
                ⚙️ Rol
              </th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((u, i) => (
              <tr
                key={u.id}
                className={`
                  transition-all duration-200 
                  ${i % 2 === 0 ? "bg-white" : "bg-[#f7f7f7]"} 
                  hover:bg-[#1b2a47]/60 hover:text-white
                `}
              >
                <td className="p-4 text-black font-medium border-r border-[#1c2940]">
                  {u.nombre}
                </td>
                <td className="p-4 text-black border-r border-[#1c2940]">
                  {u.correo}
                </td>
                <td className="p-4">
                  <span className="inline-block bg-[#223355] text-blue-300 text-xs font-semibold px-3 py-1 rounded-full border border-blue-700/40">
                    {u.rol}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {usuarios.length === 0 && (
        <p className="text-center text-gray-400 mt-6 text-sm">
          No hay asesores registrados.
        </p>
      )}
    </div>
  );
}
