import * as path from "path";
import { createRequire } from "module";

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
  } catch (_err) {
    // Fallback: file:// URL format (Windows paths & edge cases)
    const fileUrl = "file://" + bundlePath.replace(/\\/g, "/");
    const mod = await import(fileUrl);
    cachedHandler = mod.default;
    return cachedHandler;
  }
}

export default async function handler(req, res) {
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
