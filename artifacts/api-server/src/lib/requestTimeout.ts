/**
 * Request Timeout Middleware — prevent slow/hanging requests
 * Default: 30s. Override per-route with req.setTimeout().
 */
import type { Request, Response, NextFunction } from "express";
import { logger } from "./logger.js";

const DEFAULT_TIMEOUT_MS = 30_000;

export function requestTimeout(timeoutMs = DEFAULT_TIMEOUT_MS) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.path.startsWith("/api/events")) return next();
    if (req.path.startsWith("/api/docs")) return next();

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn({ method: req.method, path: req.path, timeoutMs }, "Request timed out");
        res.status(503).json({
          success: false,
          error: "Request timed out",
          timeout: `${timeoutMs / 1000}s`,
        });
      }
    }, timeoutMs);

    timer.unref();

    res.on("finish", () => clearTimeout(timer));
    res.on("close",  () => clearTimeout(timer));

    next();
  };
}
