"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

type Chat = {
  id: number;
  userId: number;
  name: string;
  photo: string | null;
  lastMessage?: string;
  unread?: boolean;
};

type User = {
  id: number;
  nombre: string;
  foto_asesor: string | null;
};

interface Props {
  userId: number;
  onSelectChat: (chat: Chat) => void;
}

// socket global (evita múltiples conexiones)
let socket: Socket | null = null;

export default function ChatSidebar({ userId, onSelectChat }: Props) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showUsers, setShowUsers] = useState(false);
  const [search, setSearch] = useState("");

  const initializedRef = useRef(false);

  // ===== CARGAR CHATS =====
  const loadChats = async () => {
    const res = await fetch(`/api/chats?userId=${userId}`);
    const data = await res.json();
    if (!Array.isArray(data)) return;

    setChats(data);
  };

  useEffect(() => {
    loadChats();
  }, [userId]);

  // ===== SOCKET TIEMPO REAL =====
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // conexión directa al servidor (NO /api/socket)
    socket = io({
      transports: ["websocket", "polling"],
    });

    // registrar usuario en backend
    socket.emit("register", userId);

    // recibir mensajes nuevos
    socket.on("newMessage", (msg: any) => {
      const { chat_id, content } = msg;

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== chat_id) return chat;

          return {
            ...chat,
            lastMessage: content,
            unread: true,
          };
        })
      );
    });

    return () => {
      socket?.disconnect();
      socket = null;
      initializedRef.current = false;
    };
  }, [userId]);

  // ===== USUARIOS =====
  useEffect(() => {
    if (!showUsers) return;

    fetch("/api/usersc")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setUsers(d));
  }, [showUsers]);

  // ===== ABRIR / CREAR CHAT =====
  const openChatWithUser = async (user: User) => {
    const existing = chats.find((c) => c.userId === user.id);

    if (existing) {
      markAsRead(existing.id);
      onSelectChat(existing);
      setShowUsers(false);
      setSearch("");
      return;
    }

    const res = await fetch("/api/chats/direct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromUserId: userId,
        toUserId: user.id,
      }),
    });

    const chat = await res.json();

    setChats((prev) => [chat, ...prev]);
    onSelectChat(chat);
    setShowUsers(false);
    setSearch("");
  };

  const markAsRead = (chatId: number) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unread: false } : c))
    );
  };

  const filteredUsers = users.filter((u) =>
    u.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full w-[320px] min-w-[320px] flex flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden relative">
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-black/25" />

      {/* HEADER */}
      <div className="relative z-20 p-3 border-b border-white/10 bg-black/25 flex justify-between items-center">
        <span className="font-semibold text-white/90">
          {showUsers ? "Nuevo chat" : "Chats"}
        </span>

        <button
          onClick={() => {
            setShowUsers((v) => !v);
            setSearch("");
          }}
          className="text-sm font-semibold text-emerald-300 hover:text-emerald-200 transition"
        >
          {showUsers ? "Cerrar" : "Nuevo chat"}
        </button>
      </div>

      {/* NUEVO CHAT */}
      {showUsers && (
        <div className="relative z-10 flex-1 overflow-y-auto">
          <div className="p-3">
            <input
              placeholder="Buscar usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-2.5 text-sm text-white/85"
            />
          </div>

          {filteredUsers.map((u) => (
            <div
              key={u.id}
              onClick={() => openChatWithUser(u)}
              className="mx-2 mb-2 flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer hover:bg-white/5"
            >
              <img
                src={u.foto_asesor || "/avatar.png"}
                className="w-9 h-9 rounded-full"
              />
              <span className="text-sm text-white/85">{u.nombre}</span>
            </div>
          ))}
        </div>
      )}

      {/* LISTA DE CHATS */}
      {!showUsers && (
        <div className="relative z-10 flex-1 overflow-y-auto p-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => {
                markAsRead(chat.id);
                onSelectChat(chat);
              }}
              className={`mb-2 flex items-center gap-3 p-3 rounded-2xl cursor-pointer ${
                chat.unread
                  ? "bg-emerald-500/10"
                  : "hover:bg-white/5"
              }`}
            >
              <img
                src={chat.photo || "/avatar.png"}
                className="w-10 h-10 rounded-full"
              />

              <div className="flex flex-col overflow-hidden">
                <span className="text-sm truncate text-white">
                  {chat.name}
                </span>
                {chat.lastMessage && (
                  <span className="text-xs truncate text-white/50">
                    {chat.lastMessage}
                  </span>
                )}
              </div>

              {chat.unread && (
                <span className="ml-auto h-2.5 w-2.5 rounded-full bg-emerald-400" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
