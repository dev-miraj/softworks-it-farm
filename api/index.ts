// @ts-nocheck
/**
 * Vercel Serverless Function
 *
 * Loads the pre-built Express bundle at runtime.
 * The bundle is included via `includeFiles` in vercel.json.
 * Dynamic import prevents Vercel from statically bundling serverless.mjs.
 * In AWS Lambda (Vercel), process.cwd() === /var/task at runtime.
 */

let _handler;

export default async function handler(req, res) {
  try {
    if (!_handler) {
      // process.cwd() is /var/task in Vercel Lambda runtime
      const bundlePath = process.cwd() + "/artifacts/api-server/dist/serverless.mjs";
      const bundleUrl = "file://" + bundlePath;
      const mod = await import(bundleUrl);
      _handler = mod.default;
    }
    return await _handler(req, res);
  } catch (err) {
    const msg = String(err);
    console.error("[vercel-fn] error:", msg);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error", detail: msg }));
    }
  }
}
