import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { teamTable, insertTeamSchema } from "@workspace/db/schema";

const router = Router();

router.get("/team", async (req, res): Promise<void> => {
  const members = await db.select().from(teamTable).orderBy(teamTable.id);
  res.json(members);
});

router.post("/team", async (req, res): Promise<void> => {
  const body = insertTeamSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [member] = await db.insert(teamTable).values(body.data).returning();
  res.status(201).json(member);
});

router.put("/team/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const body = insertTeamSchema.partial().safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [member] = await db.update(teamTable).set(body.data).where(eq(teamTable.id, id)).returning();
  if (!member) { res.status(404).json({ error: "Not found" }); return; }
  res.json(member);
});

router.delete("/team/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(teamTable).where(eq(teamTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).end();
});

export default router;
