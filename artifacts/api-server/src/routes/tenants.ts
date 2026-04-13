import { Router } from "express";
import { requireAuth, requireRole } from "../lib/auth.js";
import { db } from "../lib/db.js";
import { tenantsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();
const adminOnly = [requireAuth, requireRole("admin")];

router.get("/tenants", ...adminOnly, async (_req, res) => {
  const rows = await db.select().from(tenantsTable);
  res.json({ success: true, data: rows });
});

router.post("/tenants", ...adminOnly, async (req, res) => {
  const { slug, name, ownerId, plan } = req.body;
  if (!slug || !name || !ownerId) {
    res.status(400).json({ success: false, error: "slug, name, ownerId required" });
    return;
  }
  const [row] = await db.insert(tenantsTable).values({ slug, name, ownerId, plan: plan ?? "free" }).returning();
  res.status(201).json({ success: true, data: row });
});

router.patch("/tenants/:id", ...adminOnly, async (req, res) => {
  const id = Number(req.params["id"]);
  const { name, plan, isActive } = req.body;
  await db.update(tenantsTable).set({ name, plan, isActive, updatedAt: new Date() }).where(eq(tenantsTable.id, id));
  res.json({ success: true, message: "Tenant updated" });
});

export default router;
