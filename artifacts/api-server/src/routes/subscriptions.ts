import { Router } from "express";
import { requireAuth, requireRole } from "../lib/auth.js";
import { getUserPlan, createSubscription, PLAN_LIMITS } from "../lib/subscription.js";
import { db } from "../lib/db.js";
import { subscriptionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();
const adminOnly = [requireAuth, requireRole("admin")];

router.get("/subscriptions/me", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const plan = await getUserPlan(user.username);
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const rows = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.username, user.username)).limit(1);
  res.json({ success: true, data: { plan, limits, subscription: rows[0] ?? null } });
});

router.get("/subscriptions", ...adminOnly, async (req, res) => {
  const rows = await db.select().from(subscriptionsTable);
  res.json({ success: true, data: rows });
});

router.post("/subscriptions", ...adminOnly, async (req, res) => {
  const { username, plan, periodDays } = req.body;
  if (!username || !plan) {
    res.status(400).json({ success: false, error: "username and plan required" });
    return;
  }
  await createSubscription(username, plan, periodDays ?? 30);
  res.json({ success: true, message: `Subscription set to ${plan} for ${username}` });
});

export default router;
