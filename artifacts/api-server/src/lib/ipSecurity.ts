/**
 * IP Security — blacklist, admin whitelist, suspicious activity detection
 * 
 * Config via env:
 *   ADMIN_IP_WHITELIST=1.2.3.4,5.6.7.8   (comma-separated)
 *   IP_BLACKLIST=9.9.9.9,10.10.10.10       (comma-separated)
 */
import type { Request, Response, NextFunction } from "express";
import { logger } from "./logger.js";
import { metrics } from "./metrics.js";

function parseIpList(env: string | undefined): Set<string> {
  if (!env) return new Set();
  return new Set(env.split(",").map((ip) => ip.trim()).filter(Boolean));
}

const ADMIN_WHITELIST = parseIpList(process.env["ADMIN_IP_WHITELIST"]);
const IP_BLACKLIST   = parseIpList(process.env["IP_BLACKLIST"]);

const ADMIN_PATHS = new Set(["/api/metrics", "/api/audit-logs", "/api/tenants", "/api/queue"]);

function getClientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

export function ipSecurityMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);

  if (IP_BLACKLIST.size > 0 && IP_BLACKLIST.has(ip)) {
    logger.warn({ ip, path: req.path }, "Blocked: IP is blacklisted");
    metrics.inc("security_blocks_total", { reason: "blacklist" });
    res.status(403).json({ success: false, error: "Access denied" });
    return;
  }

  const isAdminPath = Array.from(ADMIN_PATHS).some((p) => req.path.startsWith(p));
  if (isAdminPath && ADMIN_WHITELIST.size > 0) {
    const isLocalhost = ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1";
    if (!isLocalhost && !ADMIN_WHITELIST.has(ip)) {
      logger.warn({ ip, path: req.path }, "Blocked: IP not in admin whitelist");
      metrics.inc("security_blocks_total", { reason: "whitelist" });
      res.status(403).json({ success: false, error: "Admin access restricted to whitelisted IPs" });
      return;
    }
  }

  next();
}

const suspiciousTracking = new Map<string, { count: number; firstSeen: number; lastSeen: number }>();
const SUSPICIOUS_THRESHOLD = 100;
const WINDOW_MS = 60_000;

export function suspiciousActivityDetection(req: Request, res: Response, next: NextFunction): void {
  if (req.method === "GET" && !req.path.includes("/auth")) return next();

  const ip = getClientIp(req);
  const now = Date.now();
  const entry = suspiciousTracking.get(ip);

  if (!entry || now - entry.firstSeen > WINDOW_MS) {
    suspiciousTracking.set(ip, { count: 1, firstSeen: now, lastSeen: now });
    return next();
  }

  entry.count++;
  entry.lastSeen = now;

  if (entry.count > SUSPICIOUS_THRESHOLD) {
    logger.warn({ ip, count: entry.count, path: req.path }, "Suspicious activity detected");
    metrics.inc("security_suspicious_total", { ip });
    if (entry.count > SUSPICIOUS_THRESHOLD * 2) {
      res.status(429).json({ success: false, error: "Suspicious activity detected. Please slow down." });
      return;
    }
  }

  next();
}

export function blockIp(ip: string): void {
  IP_BLACKLIST.add(ip);
  logger.info({ ip }, "IP added to runtime blacklist");
}

export function unblockIp(ip: string): void {
  IP_BLACKLIST.delete(ip);
  logger.info({ ip }, "IP removed from runtime blacklist");
}
