import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { portfolioTable, insertPortfolioSchema } from "@workspace/db";

const router = Router();

router.get("/portfolio", async (req, res): Promise<void> => {
  const { category } = req.query;
  let items = await db.select().from(portfolioTable).orderBy(portfolioTable.id);
  if (category && typeof category === "string") {
    items = items.filter(i => i.category === category);
  }
  res.json(items);
});

router.post("/portfolio", async (req, res): Promise<void> => {
  const body = insertPortfolioSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [item] = await db.insert(portfolioTable).values(body.data).returning();
  res.status(201).json(item);
});

router.get("/portfolio/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [item] = await db.select().from(portfolioTable).where(eq(portfolioTable.id, id));
  if (!item) {
    res.status(404).json({ error: "Portfolio item not found" });
    return;
  }
  res.json(item);
});

router.put("/portfolio/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const body = insertPortfolioSchema.partial().safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [item] = await db.update(portfolioTable).set(body.data).where(eq(portfolioTable.id, id)).returning();
  if (!item) {
    res.status(404).json({ error: "Portfolio item not found" });
    return;
  }
  res.json(item);
});

router.delete("/portfolio/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(portfolioTable).where(eq(portfolioTable.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Portfolio item not found" });
    return;
  }
  res.status(204).end();
});

export default router;
