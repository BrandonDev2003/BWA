"use client";

import { useEffect, useMemo, useState } from "react";
import { getSocket } from "@/lib/socketClient";

export default function ChatRoom({ chatId, userId }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  const s = useMemo(() => getSocket(userId), [userId]);

  useEffect(() => {
    if (!s) return;

    s.connect();
    s.emit("join-chat", chatId);

    const onNewMessage = (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    };

    s.on("new-message", onNewMessage);

    return () => {
      s.off("new-message", onNewMessage);
      s.emit("leave-chat", chatId);
      // no desconectes globalmente si lo usas en otras pantallas
      // s.disconnect();
    };
  }, [s, chatId]);

  function sendMessage() {
    if (!s || !text.trim()) return;

    s.emit("send-message", {
      chatId,
      senderId: userId,
      content: text,
    });
    setText("");
  }

  return (
    <div>
      <div>
        {messages.map((m, i) => (
          <div key={i}>{m.content}</div>
        ))}
      </div>

      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={sendMessage}>Enviar</button>
    </div>
  );
}
