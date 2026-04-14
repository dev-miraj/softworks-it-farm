import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { logger } from "./logger.js";

let _io: SocketIOServer | null = null;

export function initSocket(server: HttpServer): SocketIOServer {
  _io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    path: "/socket.io",
  });

  _io.on("connection", (socket) => {
    logger.info({ id: socket.id }, "[socket] client connected");

    socket.on("join_call", (token: string) => {
      socket.join(`call:${token}`);
      logger.info({ id: socket.id, token }, "[socket] joined call room");
    });

    socket.on("leave_call", (token: string) => {
      socket.leave(`call:${token}`);
    });

    socket.on("disconnect", () => {
      logger.info({ id: socket.id }, "[socket] client disconnected");
    });
  });

  logger.info("[socket] Socket.IO initialized");
  return _io;
}

export function getIo(): SocketIOServer | null {
  return _io;
}

export function emitToCall(token: string, event: string, data: unknown): void {
  if (_io) _io.to(`call:${token}`).emit(event, data);
}

export function emitToAll(event: string, data: unknown): void {
  if (_io) _io.emit(event, data);
}
