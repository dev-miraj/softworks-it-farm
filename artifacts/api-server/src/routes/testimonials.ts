import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { testimonialsTable, insertTestimonialSchema } from "@workspace/db";

const router = Router();

router.get("/testimonials", async (req, res): Promise<void> => {
  const items = await db.select().from(testimonialsTable).orderBy(testimonialsTable.id);
  res.json(items);
});

router.post("/testimonials", async (req, res): Promise<void> => {
  const body = insertTestimonialSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [item] = await db.insert(testimonialsTable).values(body.data).returning();
  res.status(201).json(item);
});

router.put("/testimonials/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const body = insertTestimonialSchema.partial().safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [item] = await db.update(testimonialsTable).set(body.data).where(eq(testimonialsTable.id, id)).returning();
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json(item);
});

router.delete("/testimonials/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(testimonialsTable).where(eq(testimonialsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).end();
});

export default router;
