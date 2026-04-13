// Vercel serverless entry point — wraps Express app with error trapping
// so initialization errors surface as JSON instead of FUNCTION_INVOCATION_FAILED
import type { IncomingMessage, ServerResponse } from "node:http";

let handler: ((req: IncomingMessage, res: ServerResponse) => void) | null = null;
let initError: unknown = null;

try {
  const { default: app } = await import("./app.js");
  handler = app as unknown as (req: IncomingMessage, res: ServerResponse) => void;
} catch (err) {
  initError = err;
  console.error("[serverless] INIT ERROR:", err);
}

export default function serverlessHandler(req: IncomingMessage, res: ServerResponse): void {
  if (initError || !handler) {
    const msg = initError instanceof Error ? initError.message : String(initError ?? "App failed to initialize");
    const stack = initError instanceof Error ? initError.stack : undefined;
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Server initialization failed", message: msg, stack }));
    return;
  }
  handler(req, res);
}
