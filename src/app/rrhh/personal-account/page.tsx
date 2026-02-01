"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";

type UserProfile = {
  id: number;
  nombre: string;
  correo: string;

  cedula?: string | null;
  rol?: string | null;

  foto_asesor?: string | null;
  cedula_frontal?: string | null;
  cedula_reverso?: string | null;

  fecha_ingreso?: string | null;
  estado_expediente?: string | null;
};

function formatDateES(fecha?: string | null) {
  if (!fecha) return "—";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function PersonalAccountPage() {
  const router = useRouter();

  const [validando, setValidando] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);

  const [perfil, setPerfil] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Validar sesión (cualquier rol con sesión válida puede entrar)
  useEffect(() => {
    fetch("/api/auth/verify", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) {
          router.push("/login");
          return;
        }

        if (!data.user?.rol || String(data.user.rol).trim() === "") {
          router.push("/login");
          return;
        }

        setUsuario(data.user);
        setValidando(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  // ✅ Cargar solo el usuario logueado (su propio ID)
  useEffect(() => {
    if (!usuario?.id) return;

    async function cargar() {
      try {
        setLoading(true);

        const res = await fetch(`/api/users/${usuario.id}`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          router.push("/no-autorizado");
          return;
        }

        const json = await res.json();
        const u = json?.user ?? json;

        // Seguridad extra: confirmar que el backend devolvió el mismo usuario
        if (!u?.id || Number(u.id) !== Number(usuario.id)) {
          router.push("/no-autorizado");
          return;
        }

        const p: UserProfile = {
          id: Number(u.id),
          nombre: String(u.nombre ?? ""),
          correo: String(u.correo ?? ""),

          cedula: u.cedula ?? null,
          rol: u.rol ?? null,

          foto_asesor: u.foto_asesor ?? null,
          cedula_frontal: u.cedula_frontal ?? null,
          cedula_reverso: u.cedula_reverso ?? null,

          fecha_ingreso: u.fecha_ingreso ?? null,
          estado_expediente: u.estado_expediente ?? null,
        };

        setPerfil(p);
      } catch (e) {
        console.error(e);
        router.push("/no-autorizado");
      } finally {
        setLoading(false);
      }
    }

    cargar();
  }, [usuario, router]);

  // ✅ Estados de carga (después de hooks)
  if (validando) {
    return (
      <div className="flex justify-center items-center h-screen text-white">
        Validando acceso...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white/70">
        Cargando...
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="flex justify-center items-center h-screen text-red-400">
        Perfil no disponible
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `url(/fondobg.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex min-h-screen bg-black/55">
        <Sidebar />

        <div className="flex-1 p-6">
          <div className="mx-auto w-full max-w-5xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 border-b border-white/10 bg-black/25">
              <div>
                <h2 className="text-3xl font-bold text-white">Mi cuenta</h2>
                <p className="text-white/50 text-sm mt-1">
                  Solo lectura — puedes ver únicamente tu información.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-white font-semibold">{perfil.nombre || "—"}</div>
                  <div className="text-white/60 text-sm">{perfil.correo || "—"}</div>
                </div>

                {perfil.foto_asesor ? (
                  <img
                    src={perfil.foto_asesor}
                    alt="Foto perfil"
                    className="w-12 h-12 rounded-full object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/50">
                    —
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Datos generales */}
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
                  <h3 className="text-xl font-bold text-white mb-4">Datos generales</h3>

                  <div className="space-y-3 text-white/85">
                    <p>
                      <span className="text-white/60">ID:</span>{" "}
                      <span className="text-white/90 font-semibold">{perfil.id}</span>
                    </p>
                    <p>
                      <span className="text-white/60">Nombre:</span>{" "}
                      <span className="text-white/90 font-semibold">{perfil.nombre || "—"}</span>
                    </p>
                    <p>
                      <span className="text-white/60">Correo:</span>{" "}
                      <span className="text-white/90 font-semibold">{perfil.correo || "—"}</span>
                    </p>
                    <p>
                      <span className="text-white/60">Rol:</span>{" "}
                      <span className="text-white/90 font-semibold">{perfil.rol || "—"}</span>
                    </p>
                    <p>
                      <span className="text-white/60">Fecha ingreso:</span>{" "}
                      <span className="text-white/90 font-semibold">
                        {formatDateES(perfil.fecha_ingreso)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Expediente */}
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
                  <h3 className="text-xl font-bold text-white mb-4">Expediente</h3>

                  <div className="space-y-3 text-white/85">
                    <p>
                      <span className="text-white/60">Estado expediente:</span>{" "}
                      <span className="text-white/90 font-semibold">
                        {perfil.estado_expediente || "—"}
                      </span>
                    </p>

                    <p>
                      <span className="text-white/60">Cédula:</span>{" "}
                      <span className="text-white/90 font-semibold">
                        {perfil.cedula || "—"}
                      </span>
                    </p>

                  
                  </div>
                </div>
              </div>

              {/* Privacidad */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
                <h3 className="text-xl font-bold text-white mb-2">Privacidad</h3>
                <p className="text-white/55 text-sm">
                  Campos como <span className="text-white/70">password</span> {" "}
                  <span className="text-white/70"> </span> no se muestran aquí.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
