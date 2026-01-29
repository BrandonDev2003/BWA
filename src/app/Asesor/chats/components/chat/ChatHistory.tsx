"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socketClient";

export type Message = {
  id?: number;               // puede no venir aún
  tempId?: string;          // 🔥 id temporal para React
  content?: string;
  url?: string;
  type?: "text" | "image" | "file";
  sender_id: number;
  sender_name: string;
  created_at: string;
};

function getFileIcon(name?: string) {
  if (!name) return "📎";
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "📄";
  if (["doc", "docx"].includes(ext!)) return "📝";
  if (["xls", "xlsx"].includes(ext!)) return "📊";
  if (["zip", "rar"].includes(ext!)) return "🗜️";
  return "📎";
}

export default function ChatHistory({
  messages,
  userId,
  chatId,
  setMessages,
}: {
  messages: Message[];
  userId: number;
  chatId: number;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // 🔽 Scroll al final
  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  };

  // 🟢 Al montar → ir abajo
  useLayoutEffect(() => {
    scrollToBottom(false);
  }, []);

  // 🟢 Auto-scroll si usuario está abajo
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom(false);
    }
  }, [messages, isAtBottom]);

  // 👀 Detectar posición del scroll
  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;

    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;

    setIsAtBottom(atBottom);
    setShowScrollDown(!atBottom);
  };

  // 🔥 SOCKET: unirse al chat y recibir mensajes en tiempo real
  useEffect(() => {
    if (!chatId) return;

    const socket = getSocket(userId);

    socket.emit("joinChat", chatId);

    socket.on("newMessage", (msg: Message) => {
      const safeMsg: Message = {
        ...msg,
        tempId: msg.id ? undefined : crypto.randomUUID(), // 🔥 key segura
      };

      setMessages((prev) => {
        if (
          (safeMsg.id && prev.some((m) => m.id === safeMsg.id)) ||
          (safeMsg.tempId && prev.some((m) => m.tempId === safeMsg.tempId))
        ) {
          return prev;
        }

        return [...prev, safeMsg];
      });
    });

    return () => {
      socket.emit("leaveChat", chatId);
      socket.off("newMessage");
    };
  }, [chatId, userId, setMessages]);

  return (
    <div className="h-full min-h-0 flex flex-col relative overflow-hidden">
      {/* overlay oscuro */}
      <div className="absolute inset-0 bg-black/25 z-0 pointer-events-none" />

      {/* Header */}
      <div
        className="
          relative z-10 shrink-0
          border-b border-white/10
          bg-black/25 backdrop-blur-2xl
          px-4 py-2
          text-sm font-semibold text-white/85
        "
      >
        Historial del chat
      </div>

      {/* SCROLLER */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="
          relative z-10
          flex-1 min-h-0
          overflow-y-auto
          p-4
          scrollbar-thin
          scrollbar-thumb-white/20
          scrollbar-track-transparent
        "
      >
        <div className="space-y-3">
          {messages
            .slice()
            .sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            )
            .map((m) => {
              const isMine = m.sender_id === userId;

              return (
                <div
                  key={m.id ?? m.tempId}   // 🔥 SIN WARNING
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={[
                      "max-w-sm rounded-2xl p-3 shadow-2xl",
                      "border backdrop-blur-2xl overflow-hidden relative",
                      isMine
                        ? "border-emerald-400/20 bg-emerald-500/15 text-white"
                        : "border-white/10 bg-white/5 text-white/85",
                    ].join(" ")}
                  >
                    {/* overlay burbuja */}
                    <div
                      className={[
                        "pointer-events-none absolute inset-0",
                        isMine ? "bg-black/20" : "bg-black/25",
                      ].join(" ")}
                    />

                    <div className="relative">
                      {/* Nombre */}
                      <div className="text-xs font-semibold opacity-70 mb-1">
                        {m.sender_name}
                      </div>

                      {/* TEXTO */}
                      {(!m.type || m.type === "text") && (
                        <p className="text-sm whitespace-pre-wrap break-words text-white/85">
                          {m.content}
                        </p>
                      )}

                      {/* IMAGEN */}
                      {m.type === "image" && m.url && (
                        <img
                          src={m.url}
                          className="rounded-xl max-w-full cursor-pointer border border-white/10"
                          onLoad={() => {
                            if (isAtBottom) scrollToBottom(false);
                          }}
                          onClick={() => window.open(m.url, "_blank")}
                          alt="imagen"
                        />
                      )}

                      {/* ARCHIVO */}
                      {m.type === "file" && m.url && (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => {
                              if (m.content?.toLowerCase().endsWith(".pdf")) {
                                setPdfPreview(m.url ?? null);

                              } else {
                                window.open(m.url, "_blank");
                              }
                            }}
                            className={[
                              "text-left underline text-sm",
                              isMine ? "text-white/90" : "text-emerald-200",
                            ].join(" ")}
                          >
                            {getFileIcon(m.content)} {m.content}
                          </button>

                          <a
                            href={`/api/messages/file/download?path=${encodeURIComponent(
                              m.url
                            )}&name=${encodeURIComponent(
                              m.content || "archivo"
                            )}`}
                            className="text-xs opacity-70 text-white/70 hover:text-white/85 transition"
                          >
                            Descargar
                          </a>
                        </div>
                      )}

                      {/* Hora */}
                      <div className="text-[10px] mt-1 text-right opacity-60 text-white/60">
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* BOTÓN BAJAR */}
      {showScrollDown && (
        <button
          onClick={() => scrollToBottom(true)}
          className="
            absolute bottom-4 right-4 z-30
            rounded-full px-3 py-2
            border border-white/10
            bg-white/5
            backdrop-blur-2xl
            text-white/85
            shadow-2xl
            hover:bg-white/10
            active:scale-95
            transition
          "
          aria-label="Bajar al final"
        >
          ↓
        </button>
      )}

      {/* PREVIEW PDF */}
      {pdfPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-[95%] h-[92%] rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl relative">
            <div className="pointer-events-none absolute inset-0 bg-black/25" />

            <div className="relative h-full flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/25">
                <span className="font-semibold text-white/85">
                  Vista previa PDF
                </span>

                <button
                  onClick={() => setPdfPreview(null)}
                  className="
                    px-3 py-1.5 rounded-xl
                    border border-red-500/20
                    bg-red-500/10
                    text-white/90
                    hover:bg-red-500/20 hover:border-red-500/30
                    transition
                  "
                >
                  ✕
                </button>
              </div>

              <iframe
                src={pdfPreview}
                className="w-full flex-1 bg-white"
                title="Vista previa PDF"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
