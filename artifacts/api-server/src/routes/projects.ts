import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { projectsTable, insertProjectSchema } from "@workspace/db/schema";

const router = Router();

router.get("/projects", async (req, res): Promise<void> => {
  const projects = await db.select().from(projectsTable).orderBy(projectsTable.id);
  res.json(projects);
});

router.post("/projects", async (req, res): Promise<void> => {
  const body = insertProjectSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [project] = await db.insert(projectsTable).values(body.data).returning();
  res.status(201).json(project);
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  res.json(project);
});

router.put("/projects/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const body = insertProjectSchema.partial().safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [project] = await db.update(projectsTable).set(body.data).where(eq(projectsTable.id, id)).returning();
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  res.json(project);
});

router.delete("/projects/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(projectsTable).where(eq(projectsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Project not found" }); return; }
  res.status(204).end();
});

export default router;
