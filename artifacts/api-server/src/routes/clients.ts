import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { clientsTable, insertClientSchema } from "@workspace/db";

const router = Router();

router.get("/clients", async (req, res): Promise<void> => {
  const clients = await db.select().from(clientsTable).orderBy(clientsTable.id);
  res.json(clients);
});

router.post("/clients", async (req, res): Promise<void> => {
  const body = insertClientSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [client] = await db.insert(clientsTable).values(body.data).returning();
  res.status(201).json(client);
});

router.get("/clients/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, id));
  if (!client) { res.status(404).json({ error: "Client not found" }); return; }
  res.json(client);
});

router.put("/clients/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const body = insertClientSchema.partial().safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [client] = await db.update(clientsTable).set(body.data).where(eq(clientsTable.id, id)).returning();
  if (!client) { res.status(404).json({ error: "Client not found" }); return; }
  res.json(client);
});

router.delete("/clients/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(clientsTable).where(eq(clientsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Client not found" }); return; }
  res.status(204).end();
});

export default router;
