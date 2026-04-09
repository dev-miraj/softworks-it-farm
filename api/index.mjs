import * as path from "path";

let cachedHandler = null;

async function loadHandler() {
  if (cachedHandler) return cachedHandler;

  // In Vercel Lambda runtime, cwd is /var/task
  // Files from `includeFiles` in vercel.json are placed relative to project root
  const bundlePath = path.join(process.cwd(), "artifacts", "api-server", "dist", "serverless.mjs");

  try {
    const mod = await import(bundlePath);
    cachedHandler = mod.default;
    return cachedHandler;
  } catch (err1) {
    // Fallback: file:// URL format (Windows paths & edge cases)
    try {
      const fileUrl = "file://" + bundlePath.replace(/\\/g, "/");
      const mod = await import(fileUrl);
      cachedHandler = mod.default;
      return cachedHandler;
    } catch (err2) {
      throw new Error(`Import failed: ${err1?.message} | ${err2?.message}`);
    }
  }
}

export default async function handler(req, res) {
  // Instant ping — no DB, no imports — verifies Lambda infra works
  if (req.url === "/api/ping" || req.url === "/api/ping/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ pong: true, cwd: process.cwd(), t: Date.now() }));
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
