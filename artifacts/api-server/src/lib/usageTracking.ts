/**
 * Usage Tracking — count API calls per user + enforce subscription limits
 * Uses in-memory counters with 1-hour windows + DB persistence.
 */
import { db } from "./db.js";
import { subscriptionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { PLAN_LIMITS, getUserPlan } from "./subscription.js";
import type { Request, Response, NextFunction } from "express";
import type { TokenPayload } from "./auth.js";
import { metrics } from "./metrics.js";

interface UsageBucket {
  calls: number;
  windowStart: number;
}

const usageBuckets = new Map<string, UsageBucket>();
const WINDOW_MS = 60 * 60 * 1000;

function getBucket(username: string): UsageBucket {
  const now = Date.now();
  const existing = usageBuckets.get(username);

  if (existing && now - existing.windowStart < WINDOW_MS) {
    return existing;
  }

  const fresh: UsageBucket = { calls: 0, windowStart: now };
  usageBuckets.set(username, fresh);
  return fresh;
}

export function trackUsage(req: Request, _res: Response, next: NextFunction): void {
  const user = (req as any).user as TokenPayload | undefined;
  if (user?.username) {
    const bucket = getBucket(user.username);
    bucket.calls++;
    metrics.inc("api_calls_total", { username: user.username });
  }
  next();
}

export async function enforceUsageLimits(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const user = (req as any).user as TokenPayload | undefined;
  if (!user) return next();

  const plan = await getUserPlan(user.username);
  const limits = PLAN_LIMITS[plan];
  const limit = limits["api_calls_per_hour"];

  if (limit === -1) return next();

  const bucket = getBucket(user.username);
  if (bucket.calls >= limit) {
    const resetAt = new Date(bucket.windowStart + WINDOW_MS);
    res.status(429).json({
      success: false,
      error: "API rate limit exceeded for your plan",
      plan,
      limit,
      used: bucket.calls,
      resetAt,
      upgradeUrl: "/admin/billing",
    });
    return;
  }

  next();
}

export function getUsageStats(username: string): {
  calls: number;
  windowStart: Date;
  windowEnd: Date;
} | null {
  const bucket = usageBuckets.get(username);
  if (!bucket) return null;
  return {
    calls: bucket.calls,
    windowStart: new Date(bucket.windowStart),
    windowEnd: new Date(bucket.windowStart + WINDOW_MS),
  };
}
