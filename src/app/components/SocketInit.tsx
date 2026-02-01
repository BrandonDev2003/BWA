"use client";

import { useEffect } from "react";

export default function SocketInit() {
  useEffect(() => {
    fetch("/api/socket");
    console.log("✅ Socket inicializado en frontend");
  }, []);

  return null;
}
