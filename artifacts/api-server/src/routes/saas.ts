import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { saasProductsTable, insertSaasProductSchema } from "@workspace/db";

const router = Router();

router.get("/saas-products", async (req, res): Promise<void> => {
  const products = await db.select().from(saasProductsTable).orderBy(saasProductsTable.id);
  res.json(products);
});

router.post("/saas-products", async (req, res): Promise<void> => {
  const body = insertSaasProductSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [product] = await db.insert(saasProductsTable).values(body.data).returning();
  res.status(201).json(product);
});

router.get("/saas-products/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [product] = await db.select().from(saasProductsTable).where(eq(saasProductsTable.id, id));
  if (!product) { res.status(404).json({ error: "Not found" }); return; }
  res.json(product);
});

router.put("/saas-products/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const body = insertSaasProductSchema.partial().safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [product] = await db.update(saasProductsTable).set(body.data).where(eq(saasProductsTable.id, id)).returning();
  if (!product) { res.status(404).json({ error: "Not found" }); return; }
  res.json(product);
});

router.delete("/saas-products/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(saasProductsTable).where(eq(saasProductsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).end();
});

export default router;
