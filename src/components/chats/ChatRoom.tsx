"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socketClient";

export default function ChatRoom({ chatId, userId }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    socket.connect();
    socket.emit("join-chat", chatId);

    socket.on("new-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [chatId]);

  function sendMessage() {
    socket.emit("send-message", {
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

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={sendMessage}>Enviar</button>
    </div>
  );
}
