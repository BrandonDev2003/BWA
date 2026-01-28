import { io, Socket } from "socket.io-client";

export let socket: Socket | null = null;

export function getSocket(userId: number) {
  if (!socket) {
    socket = io("http://localhost:3000", {
      path: "/socket.io",
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("🟢 Conectado al socket:", socket?.id);
      socket?.emit("register", userId);
    });
  }

  return socket;
}
