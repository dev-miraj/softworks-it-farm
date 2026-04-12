import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { newsletterTable, insertNewsletterSchema } from "@workspace/db/schema";

const router = Router();
const db = getDb();

router.get("/newsletter", async (_req, res): Promise<void> => {
  const subs = await db.select().from(newsletterTable).orderBy(desc(newsletterTable.createdAt));
  res.json(subs);
});

router.post("/newsletter/subscribe", async (req, res): Promise<void> => {
  const body = insertNewsletterSchema.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }
  const existing = await db.select().from(newsletterTable).where(eq(newsletterTable.email, body.data.email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Already subscribed" });
    return;
  }
  const [sub] = await db.insert(newsletterTable).values(body.data).returning();
  res.status(201).json(sub);
});

router.put("/newsletter/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const body = insertNewsletterSchema.partial().safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }
  const [sub] = await db.update(newsletterTable).set(body.data).where(eq(newsletterTable.id, id)).returning();
  if (!sub) { res.status(404).json({ error: "Subscriber not found" }); return; }
  res.json(sub);
});

router.delete("/newsletter/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(newsletterTable).where(eq(newsletterTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Subscriber not found" }); return; }
  res.json({ success: true });
});

export default router;
