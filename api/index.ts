// @ts-nocheck
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let _handler = null;

async function loadHandler() {
  if (_handler) return _handler;
  try {
    const serverlessPath = resolve(__dirname, "../artifacts/api-server/dist/serverless.mjs");
    const mod = await import(serverlessPath);
    _handler = mod.default;
    return _handler;
  } catch (err) {
    console.error("[api] Failed to load serverless handler:", err);
    throw err;
  }
}

export default async function handler(req, res) {
  try {
    const h = await loadHandler();
    // serverless-http returns a handler function
    if (typeof h === "function") {
      return await h(req, res);
    }
    // If it's an Express app, call it directly
    h(req, res);
  } catch (err) {
    console.error("[api] Handler error:", String(err));
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Internal server error", message: String(err) }));
    }
  }
}
