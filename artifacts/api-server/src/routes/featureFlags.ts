import { Router } from "express";
import { requireAuth, requireRole } from "../lib/auth.js";
import { getAllFlags, upsertFlag, isEnabled, invalidateFlagCache } from "../lib/featureFlag.js";
import { db } from "../lib/db.js";
import { featureFlagsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();
const adminOnly = [requireAuth, requireRole("admin")];

router.get("/feature-flags", ...adminOnly, async (_req, res) => {
  const flags = await getAllFlags();
  res.json({ success: true, data: flags });
});

router.get("/feature-flags/:key", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const plan = (req as any).plan;
  const enabled = await isEnabled(req.params["key"]!, { plan });
  res.json({ success: true, key: req.params["key"], enabled });
});

router.post("/feature-flags", ...adminOnly, async (req, res) => {
  const { key, name, description, isEnabled, allowedPlans, allowedTenants } = req.body;
  if (!key || !name) {
    res.status(400).json({ success: false, error: "key and name required" });
    return;
  }
  await upsertFlag({ key, name, description, isEnabled, allowedPlans, allowedTenants });
  res.json({ success: true, message: `Feature flag '${key}' saved` });
});

router.patch("/feature-flags/:key/toggle", ...adminOnly, async (req, res) => {
  const rows = await db.select().from(featureFlagsTable).where(eq(featureFlagsTable.key, req.params["key"]!)).limit(1);
  if (!rows[0]) {
    res.status(404).json({ success: false, error: "Flag not found" });
    return;
  }
  await db.update(featureFlagsTable).set({ isEnabled: !rows[0].isEnabled, updatedAt: new Date() }).where(eq(featureFlagsTable.key, req.params["key"]!));
  invalidateFlagCache();
  res.json({ success: true, key: req.params["key"], isEnabled: !rows[0].isEnabled });
});

router.delete("/feature-flags/:key", ...adminOnly, async (req, res) => {
  await db.delete(featureFlagsTable).where(eq(featureFlagsTable.key, req.params["key"]!));
  invalidateFlagCache();
  res.json({ success: true, message: "Feature flag deleted" });
});

export default router;
