import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { paymentMethodsTable, insertPaymentMethodSchema } from "@workspace/db/schema";

const router = Router();

const BD_PAYMENT_SEED = [
  // MFS
  { name: "bKash Personal", type: "Send Money", category: "mfs", emoji: "💚", instructions: "Send to bKash personal number. Reference: License Key" },
  { name: "bKash Merchant", type: "Payment", category: "mfs", emoji: "💚", instructions: "Pay to bKash merchant. Reference: License Key" },
  { name: "Nagad Personal", type: "Send Money", category: "mfs", emoji: "🟠", instructions: "Send to Nagad personal number. Reference: License Key" },
  { name: "Nagad Merchant", type: "Payment", category: "mfs", emoji: "🟠", instructions: "Pay to Nagad merchant. Reference: License Key" },
  { name: "Rocket (DBBL)", type: "Send Money", category: "mfs", emoji: "🚀", instructions: "Send to Rocket number. Reference: License Key" },
  { name: "Upay", type: "Send Money", category: "mfs", emoji: "🔵", instructions: "Send via Upay. Reference: License Key" },
  { name: "SureCash", type: "Payment", category: "mfs", emoji: "💜", instructions: "Pay via SureCash. Reference: License Key" },
  { name: "MyCash (Mercantile)", type: "Send Money", category: "mfs", emoji: "🔷", instructions: "Send via MyCash. Reference: License Key" },
  { name: "OK Wallet", type: "Payment", category: "mfs", emoji: "✅", instructions: "Pay via OK Wallet. Reference: License Key" },
  // Banks
  { name: "Dutch-Bangla Bank (DBBL)", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "Transfer to DBBL account. Attach screenshot." },
  { name: "BRAC Bank", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "Transfer to BRAC Bank account. Attach screenshot." },
  { name: "City Bank", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "Transfer to City Bank account. Attach screenshot." },
  { name: "Dhaka Bank", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "Transfer to Dhaka Bank account. Attach screenshot." },
  { name: "Eastern Bank (EBL)", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "Transfer to EBL account. Attach screenshot." },
  { name: "Islami Bank Bangladesh", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "Transfer to Islami Bank account. Attach screenshot." },
  { name: "Southeast Bank", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "Transfer to Southeast Bank account. Attach screenshot." },
  { name: "Sonali Bank", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "Transfer to Sonali Bank account. Attach screenshot." },
  { name: "Janata Bank", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "Transfer to Janata Bank account. Attach screenshot." },
  { name: "Prime Bank", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "Transfer to Prime Bank account. Attach screenshot." },
  { name: "Mutual Trust Bank (MTB)", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "Transfer to MTB account. Attach screenshot." },
  { name: "Standard Chartered BD", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "Transfer to Standard Chartered account. Attach screenshot." },
  { name: "HSBC Bangladesh", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "Transfer to HSBC account. Attach screenshot." },
  { name: "Bank Asia", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "Transfer to Bank Asia account. Attach screenshot." },
  { name: "AB Bank", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "Transfer to AB Bank account. Attach screenshot." },
  { name: "One Bank", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "Transfer to One Bank account. Attach screenshot." },
  { name: "Uttara Bank", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "Transfer to Uttara Bank account. Attach screenshot." },
  { name: "National Bank (NBL)", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "Transfer to NBL account. Attach screenshot." },
  // Cards
  { name: "Visa Card", type: "Card Payment", category: "card", emoji: "💳", instructions: "Pay via Visa card through payment gateway." },
  { name: "Mastercard", type: "Card Payment", category: "card", emoji: "💳", instructions: "Pay via Mastercard through payment gateway." },
  { name: "American Express", type: "Card Payment", category: "card", emoji: "💳", instructions: "Pay via Amex through payment gateway." },
];

router.get("/payment-methods/seed", async (req, res): Promise<void> => {
  const existing = await db.select().from(paymentMethodsTable);
  if (existing.length > 0) {
    res.json({ message: "Already seeded", count: existing.length });
    return;
  }
  const inserted = await db.insert(paymentMethodsTable).values(BD_PAYMENT_SEED).returning();
  res.json({ message: "Seeded", count: inserted.length });
});

router.get("/payment-methods", async (req, res): Promise<void> => {
  const methods = await db.select().from(paymentMethodsTable).orderBy(paymentMethodsTable.id);
  res.json(methods);
});

router.post("/payment-methods", async (req, res): Promise<void> => {
  const parsed = insertPaymentMethodSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const [method] = await db.insert(paymentMethodsTable).values(parsed.data).returning();
  res.status(201).json(method);
});

router.put("/payment-methods/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const parsed = insertPaymentMethodSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const [method] = await db.update(paymentMethodsTable).set(parsed.data).where(eq(paymentMethodsTable.id, id)).returning();
  if (!method) { res.status(404).json({ error: "Not found" }); return; }
  res.json(method);
});

router.delete("/payment-methods/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(paymentMethodsTable).where(eq(paymentMethodsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).end();
});

router.post("/payment-methods/:id/toggle", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [cur] = await db.select().from(paymentMethodsTable).where(eq(paymentMethodsTable.id, id));
  if (!cur) { res.status(404).json({ error: "Not found" }); return; }
  const [updated] = await db.update(paymentMethodsTable).set({ isActive: !cur.isActive }).where(eq(paymentMethodsTable.id, id)).returning();
  res.json(updated);
});

export default router;
