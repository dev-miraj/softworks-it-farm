/**
 * Server-Sent Events (SSE) — real-time dashboard updates
 * Push events to connected clients without polling.
 * 
 * Usage:
 *   Client: const es = new EventSource('/api/events', { withCredentials: true })
 *   Server: sseEmit('dashboard_update', { ... })
 */
import type { Request, Response } from "express";
import { logger } from "./logger.js";

interface SseClient {
  id: string;
  res: Response;
  username?: string;
  connectedAt: Date;
}

const clients = new Map<string, SseClient>();

export function sseHandler(req: Request, res: Response): void {
  const clientId = crypto.randomUUID();
  const user = (req as any).user;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const client: SseClient = {
    id: clientId,
    res,
    username: user?.username,
    connectedAt: new Date(),
  };

  clients.set(clientId, client);
  logger.info({ clientId, username: user?.username, total: clients.size }, "SSE client connected");

  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, ts: Date.now() })}\n\n`);

  const heartbeat = setInterval(() => {
    res.write(`:heartbeat\n\n`);
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(clientId);
    logger.info({ clientId, total: clients.size }, "SSE client disconnected");
  });
}

export function sseEmit(
  event: string,
  data: unknown,
  opts?: { username?: string; excludeId?: string },
): void {
  const payload = JSON.stringify(data);

  for (const [id, client] of clients) {
    if (opts?.excludeId === id) continue;
    if (opts?.username && client.username !== opts.username) continue;

    try {
      client.res.write(`event: ${event}\ndata: ${payload}\n\n`);
    } catch {
      clients.delete(id);
    }
  }
}

export function getSseStats() {
  return {
    connected: clients.size,
    clients: Array.from(clients.values()).map((c) => ({
      id: c.id,
      username: c.username,
      connectedAt: c.connectedAt,
    })),
  };
}
