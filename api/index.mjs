import * as path from "path";

let cachedHandler = null;
let importError = null;

async function tryImport(bundlePath) {
  try {
    const mod = await import(bundlePath);
    return mod.default;
  } catch (_) {
    const fileUrl = "file://" + bundlePath.replace(/\\/g, "/");
    const mod = await import(fileUrl);
    return mod.default;
  }
}

async function loadHandler() {
  if (cachedHandler) return cachedHandler;
  if (importError) throw importError;

  const bundlePath = path.join(process.cwd(), "artifacts", "api-server", "dist", "serverless.mjs");

  // Race the import against a 10s timeout so we get a real error instead of a 30s Lambda timeout
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("import(serverless.mjs) timed out after 10s")), 10_000)
  );

  const fn = await Promise.race([tryImport(bundlePath), timeoutPromise]);
  cachedHandler = fn;
  return cachedHandler;
}

export default async function handler(req, res) {
  // Instant ping — verifies Lambda infra, no imports needed
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
