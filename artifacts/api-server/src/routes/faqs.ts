import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { faqsTable, insertFaqSchema } from "@workspace/db/schema";

const router = Router();
const db = getDb();

router.get("/faqs", async (_req, res): Promise<void> => {
  const faqs = await db.select().from(faqsTable).orderBy(faqsTable.sortOrder, desc(faqsTable.createdAt));
  res.json(faqs);
});

router.post("/faqs", async (req, res): Promise<void> => {
  const body = insertFaqSchema.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }
  const [faq] = await db.insert(faqsTable).values(body.data).returning();
  res.status(201).json(faq);
});

router.put("/faqs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const body = insertFaqSchema.partial().safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }
  const [faq] = await db.update(faqsTable).set(body.data).where(eq(faqsTable.id, id)).returning();
  if (!faq) { res.status(404).json({ error: "FAQ not found" }); return; }
  res.json(faq);
});

router.delete("/faqs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(faqsTable).where(eq(faqsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "FAQ not found" }); return; }
  res.json({ success: true });
});

export default router;
