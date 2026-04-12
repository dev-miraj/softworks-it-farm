import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { jobsTable, insertJobSchema } from "@workspace/db/schema";

const router = Router();
const db = getDb();

router.get("/jobs", async (_req, res): Promise<void> => {
  const jobs = await db.select().from(jobsTable).orderBy(desc(jobsTable.createdAt));
  res.json(jobs);
});

router.post("/jobs", async (req, res): Promise<void> => {
  const body = insertJobSchema.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }
  const [job] = await db.insert(jobsTable).values(body.data).returning();
  res.status(201).json(job);
});

router.put("/jobs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const body = insertJobSchema.partial().safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }
  const [job] = await db.update(jobsTable).set(body.data).where(eq(jobsTable.id, id)).returning();
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  res.json(job);
});

router.delete("/jobs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(jobsTable).where(eq(jobsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Job not found" }); return; }
  res.json({ success: true });
});

export default router;
