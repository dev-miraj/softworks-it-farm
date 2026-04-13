/**
 * Feature Flags System — per-flag, per-plan, per-tenant control
 * Flags are cached in memory for 60s to reduce DB reads
 */
import { db } from "./db.js";
import { featureFlagsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./logger.js";
import type { Request, Response, NextFunction } from "express";
import type { TokenPayload } from "./auth.js";
import type { Plan } from "./subscription.js";

interface FlagCache {
  flags: Map<string, typeof featureFlagsTable.$inferSelect>;
  loadedAt: number;
}

let cache: FlagCache | null = null;
const CACHE_TTL_MS = 60 * 1000;

async function loadFlags(): Promise<Map<string, typeof featureFlagsTable.$inferSelect>> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache.flags;
  try {
    const rows = await db.select().from(featureFlagsTable);
    const map = new Map(rows.map((r) => [r.key, r]));
    cache = { flags: map, loadedAt: Date.now() };
    return map;
  } catch (err) {
    logger.error({ err }, "featureFlag: failed to load flags");
    return new Map();
  }
}

export function invalidateFlagCache(): void {
  cache = null;
}

export async function isEnabled(
  key: string,
  opts?: { plan?: Plan; tenantId?: string },
): Promise<boolean> {
  const flags = await loadFlags();
  const flag = flags.get(key);
  if (!flag || !flag.isEnabled) return false;

  if (opts?.plan && flag.allowedPlans) {
    const allowed = flag.allowedPlans.split(",").map((p) => p.trim());
    if (!allowed.includes(opts.plan)) return false;
  }

  if (opts?.tenantId && flag.allowedTenants) {
    const allowed = flag.allowedTenants.split(",").map((t) => t.trim());
    if (!allowed.includes(opts.tenantId)) return false;
  }

  return true;
}

export function requireFeature(key: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as any).user as TokenPayload | undefined;
    const plan = (req as any).plan as Plan | undefined;
    const enabled = await isEnabled(key, { plan });

    if (!enabled) {
      res.status(403).json({
        success: false,
        error: `Feature '${key}' is not available`,
        featureFlag: key,
      });
      return;
    }
    next();
  };
}

export async function getAllFlags() {
  return db.select().from(featureFlagsTable);
}

export async function upsertFlag(data: {
  key: string;
  name: string;
  description?: string;
  isEnabled?: boolean;
  allowedPlans?: string;
  allowedTenants?: string;
}): Promise<void> {
  const existing = await db
    .select()
    .from(featureFlagsTable)
    .where(eq(featureFlagsTable.key, data.key))
    .limit(1);

  if (existing[0]) {
    await db
      .update(featureFlagsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(featureFlagsTable.key, data.key));
  } else {
    await db.insert(featureFlagsTable).values({
      key: data.key,
      name: data.name,
      description: data.description ?? null,
      isEnabled: data.isEnabled ?? false,
      allowedPlans: data.allowedPlans ?? "free,pro,enterprise",
      allowedTenants: data.allowedTenants ?? null,
    });
  }

  invalidateFlagCache();
}
