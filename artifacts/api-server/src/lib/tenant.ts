/**
 * Multi-tenant middleware — lightweight tenant resolution
 * 
 * Tenant identification via:
 * 1. X-Tenant-Id header
 * 2. ?tenantId query param
 * 3. Subdomain (e.g. acme.softworksit.com)
 * 
 * Current system is single-tenant (admin panel for one org).
 * This foundation makes it easy to expand to multi-tenant SaaS.
 */
import type { Request, Response, NextFunction } from "express";
import { db } from "./db.js";
import { tenantsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger.js";

export interface TenantContext {
  id: string;
  slug: string;
  name: string;
  plan: string;
}

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

const DEFAULT_TENANT: TenantContext = {
  id: "default",
  slug: "softworks",
  name: "SOFTWORKS IT FARM",
  plan: "enterprise",
};

export async function resolveTenant(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const tenantId =
    (req.headers["x-tenant-id"] as string) ||
    (req.query["tenantId"] as string) ||
    extractSubdomainTenant(req);

  if (!tenantId) {
    req.tenant = DEFAULT_TENANT;
    return next();
  }

  try {
    const rows = await db
      .select()
      .from(tenantsTable)
      .where(and(eq(tenantsTable.slug, tenantId), eq(tenantsTable.isActive, true)))
      .limit(1);

    if (!rows[0]) {
      req.tenant = DEFAULT_TENANT;
      return next();
    }

    req.tenant = {
      id: String(rows[0].id),
      slug: rows[0].slug,
      name: rows[0].name,
      plan: rows[0].plan,
    };
  } catch (err) {
    logger.error({ err }, "resolveTenant: DB error");
    req.tenant = DEFAULT_TENANT;
  }

  next();
}

function extractSubdomainTenant(req: Request): string | null {
  const host = req.headers.host || "";
  const parts = host.split(".");
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub && sub !== "www" && sub !== "api") return sub;
  }
  return null;
}

export function enforceTenantIsolation(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.tenant) {
    res.status(400).json({ success: false, error: "Tenant context required" });
    return;
  }
  next();
}
