import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { invoicesTable, insertInvoiceSchema } from "@workspace/db/schema";

const router = Router();
const db = getDb();

router.get("/invoices", async (_req, res): Promise<void> => {
  const invoices = await db.select().from(invoicesTable).orderBy(desc(invoicesTable.createdAt));
  res.json(invoices);
});

router.post("/invoices", async (req, res): Promise<void> => {
  const body = insertInvoiceSchema.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }
  const [invoice] = await db.insert(invoicesTable).values(body.data).returning();
  res.status(201).json(invoice);
});

router.put("/invoices/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const body = insertInvoiceSchema.partial().safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }
  const [invoice] = await db.update(invoicesTable).set(body.data).where(eq(invoicesTable.id, id)).returning();
  if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }
  res.json(invoice);
});

router.delete("/invoices/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(invoicesTable).where(eq(invoicesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Invoice not found" }); return; }
  res.json({ success: true });
});

export default router;
