/**
 * CSRF Protection — stateless double-submit pattern
 * 
 * Flow:
 * 1. Server issues a CSRF token (signed HMAC) in a readable cookie "sw_csrf"
 * 2. Client reads it from the cookie and sends it as header "X-CSRF-Token"
 * 3. Server validates header matches cookie on mutating requests (POST/PUT/DELETE/PATCH)
 * 
 * This is compatible with SPA + same-site cookie auth (no DB needed).
 */
import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";

const CSRF_SECRET =
  process.env["CSRF_SECRET"] ||
  process.env["JWT_SECRET"] ||
  "softworks-csrf-dev-secret";

const CSRF_COOKIE = "sw_csrf";
const CSRF_HEADER = "x-csrf-token";
const TOKEN_TTL_MS = 4 * 60 * 60 * 1000;

function sign(value: string): string {
  return crypto.createHmac("sha256", CSRF_SECRET).update(value).digest("hex");
}

export function generateCsrfToken(): string {
  const rand = crypto.randomBytes(24).toString("hex");
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${rand}.${exp}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifyCsrfToken(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [rand, expStr, sig] = parts;
    const exp = Number(expStr);
    if (isNaN(exp) || Date.now() > exp) return false;
    const payload = `${rand}.${expStr}`;
    const expected = sign(payload);
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

const isProd = process.env["NODE_ENV"] === "production";

export function setCsrfCookie(res: Response): string {
  const token = generateCsrfToken();
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    maxAge: TOKEN_TTL_MS,
    path: "/",
  });
  return token;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const SKIP_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/csrf",
  "/api/health",
  "/api/healthz",
  "/api/voice-calls/initiate",
  "/api/voice-calls/upload-audio",
  "/api/voice-calls/tts",
  "/api/voice-calls/tts/preview",
  "/api/voice-calls/tts/cache-stats",
  "/api/voice-calls/test-webhook",
  "/api/payments/sslcommerz/ipn",
  "/api/payments/stripe/webhook",
]);
const SKIP_PREFIXES = ["/api/voice-calls/session/"];

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) return next();
  if (SKIP_PATHS.has(req.path)) return next();
  if (SKIP_PREFIXES.some(p => req.path.startsWith(p))) return next();

  const hasAuthCookie = !!req.cookies?.["sw_access_token"];
  if (!hasAuthCookie) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken) {
    res.status(403).json({ success: false, error: "CSRF token missing" });
    return;
  }

  if (cookieToken !== headerToken) {
    res.status(403).json({ success: false, error: "CSRF token mismatch" });
    return;
  }

  if (!verifyCsrfToken(cookieToken)) {
    res.status(403).json({ success: false, error: "CSRF token invalid or expired" });
    return;
  }

  next();
}
