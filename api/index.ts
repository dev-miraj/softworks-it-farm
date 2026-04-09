import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";

type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;

let _handler: Handler | null = null;

async function getHandler(): Promise<Handler> {
  if (_handler) return _handler;
  // In Vercel Lambda, process.cwd() === /var/task
  const serverlessAbs = join(process.cwd(), "artifacts/api-server/dist/serverless.mjs");
  const serverlessUrl = pathToFileURL(serverlessAbs).href;
  const mod = await import(serverlessUrl);
  _handler = mod.default as Handler;
  return _handler;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const h = await getHandler();
    await (h as Function)(req, res);
  } catch (err) {
    console.error("[vercel] error:", String(err));
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "handler failed", detail: String(err) }));
    }
  }
}
