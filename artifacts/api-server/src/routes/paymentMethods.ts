import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { paymentMethodsTable, insertPaymentMethodSchema } from "@workspace/db/schema";

const router = Router();

const BD_PAYMENT_SEED = [
  // ── MFS ──
  { name: "bKash Personal",         type: "Send Money",   category: "mfs",      emoji: "💚", instructions: "Send Money করুন। Reference: Invoice/License Number দিন।" },
  { name: "bKash Merchant",         type: "Payment",      category: "mfs",      emoji: "💚", instructions: "Payment করুন bKash Merchant-এ। Reference: Invoice Number দিন।" },
  { name: "bKash Agent",            type: "Cash In",      category: "mfs",      emoji: "💚", instructions: "bKash Agent-এ Cash In করুন। Reference: Invoice Number দিন।" },
  { name: "Nagad Personal",         type: "Send Money",   category: "mfs",      emoji: "🟠", instructions: "Nagad Send Money করুন। Reference: Invoice Number দিন।" },
  { name: "Nagad Merchant",         type: "Payment",      category: "mfs",      emoji: "🟠", instructions: "Nagad Merchant-এ Payment করুন। Reference: Invoice Number দিন।" },
  { name: "Nagad Agent",            type: "Cash In",      category: "mfs",      emoji: "🟠", instructions: "Nagad Agent-এ Cash In করুন। Reference: Invoice Number দিন।" },
  { name: "Rocket (DBBL Mobile)",   type: "Send Money",   category: "mfs",      emoji: "🚀", instructions: "Rocket Send Money করুন। Reference: Invoice Number দিন।" },
  { name: "Upay (UCB)",             type: "Send Money",   category: "mfs",      emoji: "🔵", instructions: "Upay-তে Send Money করুন। Reference: Invoice Number দিন।" },
  { name: "TapCash (UCB)",          type: "Payment",      category: "mfs",      emoji: "🟢", instructions: "TapCash-এ Payment করুন। Reference: Invoice Number দিন।" },
  { name: "SureCash",               type: "Payment",      category: "mfs",      emoji: "💜", instructions: "SureCash-এ Payment করুন। Reference: Invoice Number দিন।" },
  { name: "MyCash (Mercantile)",    type: "Send Money",   category: "mfs",      emoji: "🔷", instructions: "MyCash-এ Send Money করুন। Reference: Invoice Number দিন।" },
  { name: "OK Wallet",              type: "Payment",      category: "mfs",      emoji: "✅", instructions: "OK Wallet-এ Payment করুন। Reference: Invoice Number দিন।" },
  { name: "M-Cash (IBBL Mobile)",   type: "Send Money",   category: "mfs",      emoji: "🟩", instructions: "M-Cash-এ Send Money করুন। Reference: Invoice Number দিন।" },
  { name: "T-Cash (Trust Bank)",    type: "Send Money",   category: "mfs",      emoji: "🔶", instructions: "T-Cash-এ Send Money করুন। Reference: Invoice Number দিন।" },
  // ── Banks ──
  { name: "Dutch-Bangla Bank (DBBL)", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "DBBL Account-এ BEFTN/NPSB Transfer করুন। Screenshot পাঠান।" },
  { name: "BRAC Bank",               type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "BRAC Bank Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "Islami Bank Bangladesh",  type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "IBBL Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "City Bank",               type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "City Bank Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "Eastern Bank (EBL)",      type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "EBL Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "Dhaka Bank",              type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "Dhaka Bank Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "Southeast Bank",          type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "Southeast Bank Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "Prime Bank",              type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "Prime Bank Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "Bank Asia",               type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "Bank Asia Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "Mutual Trust Bank (MTB)", type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "MTB Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "United Commercial Bank (UCB)", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "UCB Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "Pubali Bank",             type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "Pubali Bank Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "Mercantile Bank",         type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "Mercantile Bank Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "Al-Arafah Islami Bank",   type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "Al-Arafah Bank Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "Social Islami Bank (SIBL)", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "SIBL Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "Exim Bank",               type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "Exim Bank Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "First Security Islami Bank (FSIBL)", type: "Bank Transfer", category: "bank", emoji: "🏦", instructions: "FSIBL Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "Sonali Bank",             type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "Sonali Bank Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "Janata Bank",             type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "Janata Bank Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "Agrani Bank",             type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "Agrani Bank Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "Rupali Bank",             type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "Rupali Bank Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "AB Bank",                 type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "AB Bank Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "One Bank",                type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "One Bank Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "National Bank (NBL)",     type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "NBL Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "Trust Bank",              type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "Trust Bank Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "Uttara Bank",             type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "Uttara Bank Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "Standard Chartered BD",   type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "Standard Chartered Account-এ Transfer করুন। Screenshot পাঠান।" },
  { name: "HSBC Bangladesh",         type: "Bank Transfer", category: "bank",  emoji: "🏦", instructions: "HSBC Account-এ Transfer করুন। Screenshot পাঠান।" },
  // ── Payment Gateways ──
  { name: "SSLCOMMERZ",             type: "Online Gateway", category: "gateway", emoji: "🌐", instructions: "SSLCOMMERZ payment gateway দিয়ে payment করুন। সকল card ও MFS সাপোর্ট।" },
  { name: "ShurjoPay",              type: "Online Gateway", category: "gateway", emoji: "🌐", instructions: "ShurjoPay gateway দিয়ে payment করুন। Reference: Invoice Number।" },
  { name: "AamarPay",              type: "Online Gateway", category: "gateway", emoji: "🌐", instructions: "AamarPay gateway দিয়ে payment করুন। Reference: Invoice Number।" },
  { name: "PortWallet",             type: "Online Gateway", category: "gateway", emoji: "🌐", instructions: "PortWallet দিয়ে payment করুন। Reference: Invoice Number।" },
  // ── Cards ──
  { name: "Visa Card",              type: "Card Payment",  category: "card",    emoji: "💳", instructions: "Visa Card দিয়ে payment করুন online gateway-এর মাধ্যমে।" },
  { name: "Mastercard",             type: "Card Payment",  category: "card",    emoji: "💳", instructions: "Mastercard দিয়ে payment করুন online gateway-এর মাধ্যমে।" },
  { name: "American Express",       type: "Card Payment",  category: "card",    emoji: "💳", instructions: "American Express দিয়ে payment করুন online gateway-এর মাধ্যমে।" },
  { name: "DBBL Nexus Card",        type: "Card Payment",  category: "card",    emoji: "💳", instructions: "DBBL Nexus Debit/Credit Card দিয়ে payment করুন।" },
  // ── International ──
  { name: "PayPal",                 type: "International", category: "international", emoji: "🌍", instructions: "PayPal দিয়ে international payment করুন। USD/EUR সাপোর্ট।" },
  { name: "Wise (TransferWise)",    type: "International", category: "international", emoji: "🌍", instructions: "Wise দিয়ে international transfer করুন। Multi-currency সাপোর্ট।" },
  { name: "Payoneer",               type: "International", category: "international", emoji: "🌍", instructions: "Payoneer দিয়ে payment করুন। USD account দরকার।" },
  { name: "Western Union",          type: "International", category: "international", emoji: "🌍", instructions: "Western Union দিয়ে payment পাঠান। Receiver info পাঠান।" },
  { name: "MoneyGram",              type: "International", category: "international", emoji: "🌍", instructions: "MoneyGram দিয়ে payment পাঠান। Receiver info পাঠান।" },
];

// Seed endpoint — only adds if empty
router.get("/payment-methods/seed", async (req, res): Promise<void> => {
  const existing = await db.select().from(paymentMethodsTable);
  if (existing.length > 0) {
    res.json({ message: "Already seeded", count: existing.length });
    return;
  }
  const inserted = await db.insert(paymentMethodsTable).values(BD_PAYMENT_SEED).returning();
  res.json({ message: "Seeded", count: inserted.length });
});

// Reseed endpoint — clears all and re-seeds with the full BD list
router.post("/payment-methods/reseed", async (req, res): Promise<void> => {
  await db.delete(paymentMethodsTable);
  const inserted = await db.insert(paymentMethodsTable).values(BD_PAYMENT_SEED).returning();
  res.json({ message: "Reseeded successfully", count: inserted.length });
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
