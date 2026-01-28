"use client";

import React from "react";
import { useState } from "react";
import { User, Mail, Lock, Unlock } from "lucide-react";

interface UsuarioModalProps {
  mode: "add" | "edit";
  user?: any;
  onClose: () => void;
  onAddUser?: (user: any) => void;
  onEditUser?: (user: any) => void;
}

export default function UsuarioModal({
  mode,
  user,
  onClose,
  onAddUser,
  onEditUser,
}: UsuarioModalProps) {
  // ---------------- ESTADOS ----------------
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [correo, setCorreo] = useState(user?.correo || "");
  const [cedula, setCedula] = useState(user?.cedula || "");
  const [rol, setRol] = useState(user?.rol || "asesor");
  const [password, setPassword] = useState("");

  const [fotoAsesor, setFotoAsesor] = useState<File | null>(null);
  const [cedulaFrontal, setCedulaFrontal] = useState<File | null>(null);
  const [cedulaReverso, setCedulaReverso] = useState<File | null>(null);

  const [locked, setLocked] = useState({
    nombre: mode === "edit",
    correo: mode === "edit",
    cedula: mode === "edit",
    rol: mode === "edit",
    password: true, // por seguridad en edit, iniciar bloqueada
    fotoAsesor: mode === "edit",
    cedulaFrontal: mode === "edit",
    cedulaReverso: mode === "edit",
  });

  // ---------------- FUNCIONES ----------------
  const toggleLock = (field: keyof typeof locked) =>
    setLocked((prev) => ({ ...prev, [field]: !prev[field] }));

  const generarPassword = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++)
      pass += chars[Math.floor(Math.random() * chars.length)];
    setPassword(pass);
  };

  const handleFileChange =
    (setter: (file: File | null) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) setter(e.target.files[0]);
    };

  const handleSubmit = async () => {
    if (!nombre || !correo || !cedula || !rol || (mode === "add" && !password)) {
      return alert("Completa todos los campos");
    }

    const toBase64 = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
      });

    const userData: any = { nombre, correo, cedula, rol };

    if ((mode === "add" || (mode === "edit" && password)) && password) {
      userData.password = password;
    }

    if (fotoAsesor) userData.foto_asesor = await toBase64(fotoAsesor);
    if (cedulaFrontal) userData.cedula_frontal = await toBase64(cedulaFrontal);
    if (cedulaReverso) userData.cedula_reverso = await toBase64(cedulaReverso);

    try {
      if (mode === "add" && onAddUser) await onAddUser(userData);
      if (mode === "edit" && onEditUser)
        await onEditUser({ ...userData, id: user.id });
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error guardando usuario");
    }
  };

  // ---------------- RENDER HELPERS ----------------
  const renderInput = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    field: keyof typeof locked,
    type: string = "text",
    icon?: React.ReactNode

  ) => (
    <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
      {icon}
      <input
        type={type}
        placeholder={label}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`bg-transparent w-full outline-none text-white ${
          locked[field] ? "opacity-60 cursor-not-allowed" : ""
        }`}
        disabled={locked[field]}
      />
      {mode === "edit" && (
        <button type="button" onClick={() => toggleLock(field)}>
          {locked[field] ? (
            <Lock className="w-5 h-5 text-gray-400" />
          ) : (
            <Unlock className="w-5 h-5 text-green-400" />
          )}
        </button>
      )}
    </div>
  );

  const renderFileInput = (
    label: string,
    file: File | null,
    setter: (f: File | null) => void,
    field: keyof typeof locked,
    existingUrl?: string
  ) => (
    <div className="flex flex-col items-center gap-2">
      <label
        className={`w-24 h-24 border border-gray-700 rounded-lg flex items-center justify-center bg-gray-800 overflow-hidden cursor-pointer ${
          locked[field] ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        {file ? (
          <img
            src={URL.createObjectURL(file)}
            alt={label}
            className="w-full h-full object-cover"
          />
        ) : existingUrl ? (
          <img
            src={existingUrl}
            alt={label}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-400 text-center">{label}</span>
        )}
        <input
          type="file"
          accept="image/*"
          disabled={locked[field]}
          onChange={handleFileChange(setter)}
          className="hidden"
        />
      </label>
      {mode === "edit" && (
        <button type="button" onClick={() => toggleLock(field)}>
          {locked[field] ? (
            <Lock className="w-4 h-4 text-gray-400" />
          ) : (
            <Unlock className="w-4 h-4 text-green-400" />
          )}
        </button>
      )}
    </div>
  );

  // ---------------- RENDER ----------------
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-lg shadow-xl">
        <h2 className="text-xl font-semibold mb-6 text-center">
          {mode === "add" ? "🆕 Nuevo Usuario" : `✏️ Editar Usuario`}
        </h2>

        <div className="space-y-4">
          {renderInput(
            "Nombre completo",
            nombre,
            setNombre,
            "nombre",
            "text",
            <User className="w-5 h-5 text-gray-400" />
          )}

          {renderInput(
            "Correo",
            correo,
            setCorreo,
            "correo",
            "email",
            <Mail className="w-5 h-5 text-gray-400" />
          )}

          {renderInput("Cédula", cedula, setCedula, "cedula")}

          {/* Rol */}
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
            <select
              className={`w-full bg-gray-800 text-white p-2 rounded outline-none ${
                locked.rol ? "opacity-60 cursor-not-allowed" : ""
              }`}
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              disabled={locked.rol}
            >
              <option value="asesor">Asesor</option>
              <option value="admin">Administrador</option>
              <option value="rrhh">RRHH</option>
              <option value="SpA">SpA</option>
            </select>

            {mode === "edit" && (
              <button type="button" onClick={() => toggleLock("rol")}>
                {locked.rol ? (
                  <Lock className="w-5 h-5 text-gray-400" />
                ) : (
                  <Unlock className="w-5 h-5 text-green-400" />
                )}
              </button>
            )}
          </div>

          {/* Contraseña */}
          {(mode === "add" || mode === "edit") && (
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
              <input
                type="text"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`bg-transparent w-full outline-none text-white ${
                  locked.password ? "opacity-60 cursor-not-allowed" : ""
                }`}
                disabled={locked.password}
              />

              {mode === "edit" && (
                <button type="button" onClick={() => toggleLock("password")}>
                  {locked.password ? (
                    <Lock className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Unlock className="w-5 h-5 text-green-400" />
                  )}
                </button>
              )}

              {!locked.password && (
                <button
                  type="button"
                  onClick={generarPassword}
                  className="text-sm bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg"
                >
                  Generar
                </button>
              )}

              {mode === "add" && (
                <button
                  type="button"
                  onClick={generarPassword}
                  className="text-sm bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg"
                >
                  Generar
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-2">
            {renderFileInput(
              "Foto asesor",
              fotoAsesor,
              setFotoAsesor,
              "fotoAsesor",
              user?.foto_asesor
            )}
            {renderFileInput(
              "Cédula frontal",
              cedulaFrontal,
              setCedulaFrontal,
              "cedulaFrontal",
              user?.cedula_frontal
            )}
            {renderFileInput(
              "Cédula reverso",
              cedulaReverso,
              setCedulaReverso,
              "cedulaReverso",
              user?.cedula_reverso
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-full"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-full shadow"
          >
            {mode === "add" ? "Crear usuario" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
