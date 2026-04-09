import * as path from "path";
import * as fs from "fs";

const bundlePath = path.join(process.cwd(), "artifacts", "api-server", "dist", "serverless.mjs");

// Start loading at Lambda init time (not on first request)
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

  // Test how fast we can READ the bundle file (file system speed)
  if (url === "/api/fs-test" || url === "/api/fs-test/") {
    const t0 = Date.now();
    try {
      const content = await fs.promises.readFile(bundlePath);
      const readMs = Date.now() - t0;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        readMs,
        sizeKb: Math.round(content.length / 1024),
        path: bundlePath
      }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(err) }));
    }
    return;
  }

  // Check if the handler promise is already resolved
  if (url === "/api/handler-status" || url === "/api/handler-status/") {
    const t0 = Date.now();
    try {
      // Try to get the handler with a 2s timeout
      const result = await Promise.race([
        handlerPromise.then(() => "loaded"),
        new Promise((resolve) => setTimeout(() => resolve("still_loading"), 2000))
      ]);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: result, waitMs: Date.now() - t0 }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(err) }));
    }
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
