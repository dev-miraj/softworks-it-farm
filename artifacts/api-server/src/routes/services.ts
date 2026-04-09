import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { servicesTable, insertServiceSchema } from "@workspace/db/schema";
const router = Router();

router.get("/services", async (req, res): Promise<void> => {
  const services = await db.select().from(servicesTable).orderBy(servicesTable.id);
  res.json(services);
});

router.post("/services", async (req, res): Promise<void> => {
  const body = insertServiceSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [service] = await db.insert(servicesTable).values(body.data).returning();
  res.status(201).json(service);
});

router.get("/services/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, id));
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  res.json(service);
});

router.put("/services/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const body = insertServiceSchema.partial().safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [service] = await db.update(servicesTable).set(body.data).where(eq(servicesTable.id, id)).returning();
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  res.json(service);
});

router.delete("/services/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(servicesTable).where(eq(servicesTable.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  res.status(204).end();
});

export default router;
