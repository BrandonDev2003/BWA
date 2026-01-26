"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socketClient";

export default function ChatTest() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  const chatId = 1;     // chat existente
  const userId = 1;     // usuario existente

  useEffect(() => {
    socket.connect();
    socket.emit("join-chat", chatId);

    socket.on("new-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.disconnect();
  }, []);

  function send() {
    if (!text.trim()) return;

    socket.emit("send-message", {
      chatId,
      senderId: userId,
      content: text,
    });

    setText("");
  }

  return (
    <div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={send}>Enviar</button>

      {messages.map((m) => (
        <div key={m.id}>
          <b>{m.sender_id}:</b> {m.content}
        </div>
      ))}
    </div>
  );
}
