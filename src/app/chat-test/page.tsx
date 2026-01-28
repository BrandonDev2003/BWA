"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socketClient";

export default function ChatTest() {
  const [text, setText] = useState("");

  useEffect(() => {
    const socket = getSocket(1);
    socket.on("connect", () => console.log("connected"));

    return () => {
      socket.off("connect");
    };
  }, []);

  return (
    <div>
      <h1>Chat Test</h1>

      <input value={text} onChange={(e) => setText(e.target.value)} />
    </div>
  );
}
