import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../lib/db";
import { leadsTable, insertLeadSchema } from "@workspace/db/schema";

const router = Router();

const updateLeadSchema = insertLeadSchema.partial().pick({ status: true });

router.get("/leads", async (req, res): Promise<void> => {
  const leads = await db.select().from(leadsTable).orderBy(desc(leadsTable.createdAt));
  res.json(leads);
});

router.post("/contact", async (req, res): Promise<void> => {
  const body = insertLeadSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [lead] = await db.insert(leadsTable).values(body.data).returning();
  res.status(201).json(lead);
});

router.put("/leads/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const body = updateLeadSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [lead] = await db.update(leadsTable).set(body.data).where(eq(leadsTable.id, id)).returning();
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(lead);
});

export default router;
