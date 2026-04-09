import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);

type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;

let _handler: Handler | null = null;

async function getHandler(): Promise<Handler> {
  if (_handler) return _handler;
  const serverlessPath = resolve(__dir, "../artifacts/api-server/dist/serverless.mjs");
  const mod = await import(serverlessPath);
  _handler = mod.default as Handler;
  return _handler;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const h = await getHandler();
    await (h as (req: IncomingMessage, res: ServerResponse) => Promise<void>)(req, res);
  } catch (err) {
    console.error("[vercel] handler error:", String(err));
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error", detail: String(err) }));
    }
  }
}
