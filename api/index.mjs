import * as path from "path";

const bundlePath = path.join(process.cwd(), "artifacts", "api-server", "dist", "serverless.mjs");

// Start loading the Express app at Lambda init time (not on first request)
let appPromise = (async () => {
  try {
    const mod = await import(bundlePath);
    return mod.default; // Raw Express app
  } catch (_) {
    const fileUrl = "file://" + bundlePath.replace(/\\/g, "/");
    const mod = await import(fileUrl);
    return mod.default;
  }
})();

export default async function handler(req, res) {
  const url = req.url || "";

  // Instant ping — no imports needed
  if (url === "/api/ping" || url === "/api/ping/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ pong: true, cwd: process.cwd(), t: Date.now() }));
    return;
  }

  // Direct DB test — bypasses Express, tests Neon HTTP directly
  if (url === "/api/direct-db" || url === "/api/direct-db/") {
    try {
      const { neon } = await import("@neondatabase/serverless");
      const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || "";
      if (!dbUrl) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "No DB URL" }));
        return;
      }
      const sql = neon(dbUrl);
      const result = await sql`SELECT 1 as ok`;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ direct: true, result }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Direct DB failed", detail: String(err) }));
    }
    return;
  }

  try {
    const app = await appPromise;
    // Call Express app directly as a Node.js HTTP handler — no serverless-http wrapper needed
    // Express app is a function: (req, res, next?) => void
    // Vercel Lambda req/res are standard Node.js IncomingMessage/ServerResponse — Express handles them natively
    await new Promise((resolve, reject) => {
      // Override res.end to detect when Express has finished responding
      const originalEnd = res.end.bind(res);
      res.end = function(...args) {
        originalEnd(...args);
        resolve(undefined);
      };
      app(req, res, (err) => {
        // Express exhausted all middleware without sending a response
        if (err) {
          // Error in middleware — send 500
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal server error", detail: String(err) }));
          } else {
            resolve(undefined);
          }
        } else {
          // No route matched — send 404
          if (!res.headersSent) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Not found", path: req.url }));
          } else {
            resolve(undefined);
          }
        }
      });
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[vercel] Fatal error:", detail);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Server error", detail }));
    }
  }
}
