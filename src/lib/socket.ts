import { Server as IOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

declare global {
  var _io: IOServer | undefined;
}

export function initSocket(server: HTTPServer) {
  if (global._io) {
    console.log("🟡 Socket ya estaba inicializado");
    return global._io;
  }

  const io = new IOServer(server, {
    path: "/api/socket",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Cliente conectado:", socket.id);

    socket.on("register", (userId: number) => {
      socket.join(`user:${userId}`);
      console.log("Usuario registrado en socket:", userId);
    });

    socket.on("joinChat", (chatId: number) => {
      socket.join(`chat:${chatId}`);
      console.log("Usuario unido al chat:", chatId);
    });

    socket.on("leaveChat", (chatId: number) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Cliente desconectado:", socket.id);
    });
  });

  global._io = io;
  console.log("🔥 Socket.io inicializado correctamente");

  return io;
}

export function getIO() {
  if (!global._io) {
    throw new Error("Socket.io no inicializado");
  }
  return global._io;
}
