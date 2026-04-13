/**
 * Subscription system — plan enforcement middleware
 * Plans: free < pro < enterprise
 */
import type { Request, Response, NextFunction } from "express";
import { db } from "./db.js";
import { subscriptionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import type { TokenPayload } from "./auth.js";

export type Plan = "free" | "pro" | "enterprise";

const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, enterprise: 2 };

export const PLAN_LIMITS: Record<Plan, Record<string, number>> = {
  free:       { employees: 5,  licenses: 10, api_calls_per_hour: 100 },
  pro:        { employees: 50, licenses: 100, api_calls_per_hour: 1000 },
  enterprise: { employees: -1, licenses: -1, api_calls_per_hour: -1 },
};

export async function getUserPlan(username: string): Promise<Plan> {
  try {
    const rows = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.username, username))
      .limit(1);

    if (!rows[0]) return "free";
    const sub = rows[0];

    if (sub.status !== "active" && sub.status !== "trial") return "free";
    if (sub.currentPeriodEnd && sub.currentPeriodEnd < new Date()) return "free";

    return (sub.plan as Plan) || "free";
  } catch {
    return "free";
  }
}

export function requirePlan(minPlan: Plan) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as any).user as TokenPayload | undefined;

    if (!user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const userPlan = await getUserPlan(user.username);
    const hasAccess = PLAN_RANK[userPlan] >= PLAN_RANK[minPlan];

    if (!hasAccess) {
      res.status(402).json({
        success: false,
        error: `This feature requires ${minPlan} plan or higher`,
        currentPlan: userPlan,
        requiredPlan: minPlan,
        upgradeUrl: "/admin/billing",
      });
      return;
    }

    (req as any).plan = userPlan;
    next();
  };
}

export async function createSubscription(
  username: string,
  plan: Plan,
  periodDays = 30,
): Promise<void> {
  const now = new Date();
  const end = new Date(now.getTime() + periodDays * 86400 * 1000);

  const existing = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.username, username))
    .limit(1);

  if (existing[0]) {
    await db
      .update(subscriptionsTable)
      .set({ plan, status: "active", currentPeriodStart: now, currentPeriodEnd: end, updatedAt: now })
      .where(eq(subscriptionsTable.username, username));
  } else {
    await db.insert(subscriptionsTable).values({
      username,
      plan,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: end,
    });
  }
}
