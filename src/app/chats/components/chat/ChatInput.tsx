"use client";

import { useRef, useState, useEffect } from "react";

export default function ChatInput({
  onSendText,
  onSendImage,
  onSendFile,
}: {
  onSendText: (text: string) => Promise<void> | void;
  onSendImage: (file: File) => Promise<void> | void;
  onSendFile: (file: File) => Promise<void> | void;
}) {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"image" | "file" | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [sending, setSending] = useState(false);

  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 🔒 Evitar doble envío
  const handleSend = async () => {
    if (sending) return;

    try {
      setSending(true);

      if (fileType === "image" && selectedFile) {
        await onSendImage(selectedFile);
      } else if (fileType === "file" && selectedFile) {
        await onSendFile(selectedFile);
      } else if (text.trim()) {
        await onSendText(text.trim());
      }

      // limpiar estado
      setText("");
      setSelectedFile(null);
      setFileType(null);
      setShowMenu(false);

      // devolver foco al input
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  };

  // cerrar menú al click afuera
  useEffect(() => {
    if (!showMenu) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showMenu]);

  // preview imagen
  const previewUrl =
    selectedFile && fileType === "image"
      ? URL.createObjectURL(selectedFile)
      : null;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div
      className="
        relative
        border-t border-white/10
        bg-black/25
        backdrop-blur-2xl
        p-3
      "
    >
      {/* MENÚ CLIP */}
      {showMenu && (
        <div
          ref={menuRef}
          className="
            absolute bottom-16 left-3 z-[9999]
            w-48 overflow-hidden
            rounded-2xl
            border border-white/10
            bg-white/5
            backdrop-blur-2xl
            shadow-2xl
          "
        >
          <div className="pointer-events-none absolute inset-0 bg-black/35" />

          <button
            className="
              relative w-full text-left
              px-4 py-3 text-sm font-semibold
              text-white/85
              hover:bg-white/10 hover:text-white
              transition
            "
            onClick={() => {
              imageRef.current?.click();
              setShowMenu(false);
            }}
          >
            🖼 Imagen
          </button>

          <div className="h-px bg-white/10" />

          <button
            className="
              relative w-full text-left
              px-4 py-3 text-sm font-semibold
              text-white/85
              hover:bg-white/10 hover:text-white
              transition
            "
            onClick={() => {
              fileRef.current?.click();
              setShowMenu(false);
            }}
          >
            📎 Archivo
          </button>
        </div>
      )}

      {/* PREVIEW */}
      {selectedFile && (
        <div
          className="
            mb-3
            rounded-2xl
            border border-white/10
            bg-white/5
            backdrop-blur-2xl
            shadow-2xl
            overflow-hidden
            relative
          "
        >
          <div className="pointer-events-none absolute inset-0 bg-black/25" />

          <div className="relative flex items-center gap-3 p-3">
            {fileType === "image" && previewUrl ? (
              <img
                src={previewUrl}
                className="w-14 h-14 object-cover rounded-xl border border-white/10"
                alt="preview"
              />
            ) : (
              <span className="text-sm text-white/85 truncate">
                📎 {selectedFile.name}
              </span>
            )}

            <button
              onClick={() => {
                setSelectedFile(null);
                setFileType(null);
              }}
              className="
                ml-auto
                px-3 py-1.5 rounded-xl
                border border-red-500/20
                bg-red-500/10
                text-white/90 text-sm font-semibold
                hover:bg-red-500/20 hover:border-red-500/30
                transition
              "
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* INPUT */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowMenu((s) => !s)}
          className="
            h-11 w-11
            rounded-2xl
            border border-white/10
            bg-white/5
            text-white/85
            hover:bg-white/10 hover:text-white
            transition
            flex items-center justify-center
          "
          aria-label="Adjuntar"
          type="button"
          disabled={sending}
        >
          📎
        </button>

        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Escribe un mensaje..."
          className="
            flex-1
            h-11
            rounded-full
            border border-white/10
            bg-black/25
            px-4
            text-sm text-white/85
            placeholder:text-white/35
            outline-none
            focus:border-emerald-400/30 focus:ring-2 focus:ring-emerald-500/15
            transition
          "
          disabled={!!selectedFile || sending}
        />

        <button
          onClick={handleSend}
          type="button"
          className="
            h-11
            px-5
            rounded-full
            font-semibold
            border border-emerald-400/20
            bg-emerald-500/90
            text-black
            hover:bg-emerald-500
            active:scale-[0.98]
            transition
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          disabled={(!text.trim() && !selectedFile) || sending}
        >
          {sending ? "…" : "Enviar"}
        </button>
      </div>

      {/* INPUTS OCULTOS */}
      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setSelectedFile(e.target.files[0]);
            setFileType("image");
            e.target.value = "";
          }
        }}
      />

      <input
        ref={fileRef}
        type="file"
        hidden
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setSelectedFile(e.target.files[0]);
            setFileType("file");
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}
