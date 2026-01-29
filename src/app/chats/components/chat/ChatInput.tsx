"use client";

import { useRef, useState, useMemo, useEffect } from "react";

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
  const [sending, setSending] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

      setText("");
      setSelectedFile(null);
      setFileType(null);

      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  };

  // ✅ Preview imagen
  const previewUrl = useMemo(() => {
    if (!selectedFile || fileType !== "image") return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile, fileType]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="border-t border-white/10 bg-black/25 backdrop-blur-2xl p-3">
      {/* ✅ PREVIEW */}
      {selectedFile && (
        <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3 flex items-center gap-3">
          {fileType === "image" && previewUrl ? (
            <img
              src={previewUrl}
              alt="preview"
              className="w-14 h-14 rounded-xl object-cover border border-white/10"
            />
          ) : (
            <span className="text-white/80 text-sm truncate">
              📎 {selectedFile.name}
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              setFileType(null);
            }}
            className="ml-auto px-3 py-1.5 rounded-xl bg-red-500/15 text-white hover:bg-red-500/25 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* ✅ INPUT + BOTONES FIJOS */}
      <div className="flex items-center gap-2">
        {/* ✅ Imagen */}
        <button
          type="button"
          onClick={() => imageRef.current?.click()}
          className="
            h-11 w-11 flex items-center justify-center
            rounded-2xl border border-white/10
            bg-white/5 text-white/85
            hover:bg-white/10 transition
          "
        >
          🖼
        </button>

        {/* ✅ Archivo */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="
            h-11 w-11 flex items-center justify-center
            rounded-2xl border border-white/10
            bg-white/5 text-white/85
            hover:bg-white/10 transition
          "
        >
          📎
        </button>

        {/* Texto */}
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Escribe un mensaje..."
          className="
            flex-1 h-11 rounded-full
            border border-white/10
            bg-black/25 px-4
            text-white text-sm
            placeholder:text-white/30
            outline-none
          "
          disabled={!!selectedFile || sending}
        />

        {/* Enviar */}
        <button
          type="button"
          onClick={handleSend}
          disabled={(!text.trim() && !selectedFile) || sending}
          className="
            h-11 px-5 rounded-full font-semibold
            bg-emerald-500 text-black
            hover:bg-emerald-400 transition
            disabled:opacity-50
          "
        >
          {sending ? "…" : "Enviar"}
        </button>
      </div>

      {/* ✅ INPUTS INVISIBLES */}
      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setSelectedFile(file);
            setFileType("image");
          }
          e.target.value = "";
        }}
      />

      <input
        ref={fileRef}
        type="file"
        style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setSelectedFile(file);
            setFileType("file");
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}
