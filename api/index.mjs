import * as path from "path";
import * as net from "net";

let cachedHandler = null;

async function loadHandler() {
  if (cachedHandler) return cachedHandler;

  const bundlePath = path.join(process.cwd(), "artifacts", "api-server", "dist", "serverless.mjs");

  try {
    const mod = await import(bundlePath);
    cachedHandler = mod.default;
    return cachedHandler;
  } catch (_) {
    const fileUrl = "file://" + bundlePath.replace(/\\/g, "/");
    const mod = await import(fileUrl);
    cachedHandler = mod.default;
    return cachedHandler;
  }
}

export default async function handler(req, res) {
  const url = req.url || "";

  // Instant ping — no imports needed
  if (url === "/api/ping" || url === "/api/ping/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ pong: true, cwd: process.cwd(), t: Date.now() }));
    return;
  }

  // Direct DB test — bypasses the Express bundle, tests Neon HTTP directly
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

  // Check if TCP socket can connect to Neon (would detect firewall/SOCKS issues)
  if (url === "/api/tcp-test" || url === "/api/tcp-test/") {
    const start = Date.now();
    const result = await new Promise((resolve) => {
      const sock = new net.Socket();
      const timeout = setTimeout(() => {
        sock.destroy();
        resolve({ connected: false, ms: Date.now() - start, reason: "timeout" });
      }, 5000);
      sock.connect(5432, "ep-silent-hall-abcdefgh.us-east-2.aws.neon.tech", () => {
        clearTimeout(timeout);
        sock.destroy();
        resolve({ connected: true, ms: Date.now() - start });
      });
      sock.on("error", (err) => {
        clearTimeout(timeout);
        resolve({ connected: false, ms: Date.now() - start, reason: err.message });
      });
    });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
    return;
  }

  try {
    const fn = await loadHandler();
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
