import * as path from "path";

const bundlePath = path.join(process.cwd(), "artifacts", "api-server", "dist", "serverless.mjs");

// Start loading the bundle immediately at Lambda init time (not on first request)
// This avoids the 30s cold-start hang by using the init phase for module loading.
let handlerPromise = (async () => {
  try {
    const mod = await import(bundlePath);
    return mod.default;
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

  // Direct DB test — bypasses the Express bundle
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
    const fn = await handlerPromise;
    await fn(req, res);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[vercel] Fatal error:", detail);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Server error", detail }));
    }
  }
}
