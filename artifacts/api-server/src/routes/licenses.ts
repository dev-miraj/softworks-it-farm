import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../lib/db";
import { licensesTable, insertLicenseSchema } from "@workspace/db";
import crypto from "crypto";

const router = Router();

function generateLicenseKey(): string {
  const segment = () => crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${segment()}${segment()}-${segment()}${segment()}-${segment()}${segment()}-${segment()}${segment()}`;
}

function getNextPaymentDue(billingCycle: string, fromDate = new Date()): string | null {
  if (billingCycle === "lifetime" || billingCycle === "free") return null;
  const d = new Date(fromDate);
  if (billingCycle === "monthly") d.setMonth(d.getMonth() + 1);
  else if (billingCycle === "yearly") d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function checkPaymentStatus(license: any): {
  valid: boolean;
  paymentWarning: boolean;
  warningMsg?: string;
  daysUntilBlock?: number;
} {
  if (!license.autoBlockEnabled || license.paymentStatus === "free" || license.paymentStatus === "paid") {
    return { valid: true, paymentWarning: false };
  }
  if (license.paymentStatus === "overdue") {
    const now = new Date();
    if (license.gracePeriodEnd) {
      const grace = new Date(license.gracePeriodEnd);
      if (now > grace) {
        return { valid: false, paymentWarning: true, warningMsg: "Payment overdue — license auto-blocked. Please pay immediately to restore access." };
      }
      const hoursLeft = Math.ceil((grace.getTime() - now.getTime()) / (1000 * 60 * 60));
      const daysLeft = Math.ceil(hoursLeft / 24);
      return {
        valid: true,
        paymentWarning: true,
        warningMsg: `⚠️ Payment overdue! Your site will be auto-blocked in ${daysLeft} day(s) if payment is not received.`,
        daysUntilBlock: daysLeft,
      };
    }
    return { valid: false, paymentWarning: true, warningMsg: "Payment overdue — license blocked." };
  }
  if (license.paymentStatus === "pending" && license.nextPaymentDue) {
    const due = new Date(license.nextPaymentDue);
    const now = new Date();
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 7 && daysUntilDue > 0) {
      return { valid: true, paymentWarning: true, warningMsg: `Payment due in ${daysUntilDue} day(s). Please pay to avoid interruption.`, daysUntilBlock: daysUntilDue };
    }
    if (daysUntilDue <= 0) {
      return { valid: true, paymentWarning: true, warningMsg: `Payment is due today! Pay now to avoid auto-block in 3 days.`, daysUntilBlock: 3 };
    }
  }
  return { valid: true, paymentWarning: false };
}

router.get("/licenses", async (req, res): Promise<void> => {
  const licenses = await db.select().from(licensesTable).orderBy(desc(licensesTable.createdAt));
  res.json(licenses);
});

router.post("/licenses", async (req, res): Promise<void> => {
  const body = { ...req.body };
  if (!body.licenseKey) body.licenseKey = generateLicenseKey();

  if (body.feeAmount && Number(body.feeAmount) > 0 && body.billingCycle !== "lifetime") {
    body.paymentStatus = "pending";
    body.nextPaymentDue = getNextPaymentDue(body.billingCycle);
  } else if (!body.feeAmount || Number(body.feeAmount) === 0) {
    body.paymentStatus = "free";
  }

  const parsed = insertLicenseSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const [license] = await db.insert(licensesTable).values(parsed.data).returning();
    res.status(201).json(license);
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "License key already exists" });
    } else {
      res.status(500).json({ error: "Failed to create license" });
    }
  }
});

router.get("/licenses/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [license] = await db.select().from(licensesTable).where(eq(licensesTable.id, id));
  if (!license) { res.status(404).json({ error: "License not found" }); return; }
  res.json(license);
});

router.put("/licenses/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const parsed = insertLicenseSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const [license] = await db.update(licensesTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(licensesTable.id, id)).returning();
  if (!license) { res.status(404).json({ error: "License not found" }); return; }
  res.json(license);
});

router.delete("/licenses/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(licensesTable).where(eq(licensesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "License not found" }); return; }
  res.status(204).end();
});

router.post("/licenses/:id/suspend", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [license] = await db.update(licensesTable).set({ status: "suspended", updatedAt: new Date() }).where(eq(licensesTable.id, id)).returning();
  if (!license) { res.status(404).json({ error: "Not found" }); return; }
  res.json(license);
});

router.post("/licenses/:id/activate", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [license] = await db.update(licensesTable).set({ status: "active", activatedAt: new Date(), updatedAt: new Date() }).where(eq(licensesTable.id, id)).returning();
  if (!license) { res.status(404).json({ error: "Not found" }); return; }
  res.json(license);
});

router.post("/licenses/:id/blacklist", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [license] = await db.update(licensesTable).set({ isBlacklisted: true, status: "suspended", updatedAt: new Date() }).where(eq(licensesTable.id, id)).returning();
  if (!license) { res.status(404).json({ error: "Not found" }); return; }
  res.json(license);
});

router.post("/licenses/:id/mark-paid", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [cur] = await db.select().from(licensesTable).where(eq(licensesTable.id, id));
  if (!cur) { res.status(404).json({ error: "Not found" }); return; }
  const nextDue = getNextPaymentDue(cur.billingCycle ?? "monthly");
  const [license] = await db.update(licensesTable).set({
    paymentStatus: "paid",
    lastPaymentDate: new Date().toISOString().slice(0, 10),
    nextPaymentDue: nextDue,
    gracePeriodEnd: null,
    status: "active",
    updatedAt: new Date(),
  }).where(eq(licensesTable.id, id)).returning();
  res.json(license);
});

router.post("/licenses/:id/mark-overdue", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);
  const [license] = await db.update(licensesTable).set({
    paymentStatus: "overdue",
    gracePeriodEnd,
    updatedAt: new Date(),
  }).where(eq(licensesTable.id, id)).returning();
  if (!license) { res.status(404).json({ error: "Not found" }); return; }
  res.json(license);
});

router.post("/validate-license", async (req, res): Promise<void> => {
  const { licenseKey, domain, ipAddress, hardwareId } = req.body;
  if (!licenseKey) { res.status(400).json({ valid: false, reason: "License key is required" }); return; }

  const [license] = await db.select().from(licensesTable).where(eq(licensesTable.licenseKey, licenseKey));
  if (!license) { res.json({ valid: false, reason: "Invalid license key" }); return; }
  if (license.isBlacklisted) { res.json({ valid: false, reason: "License is blacklisted" }); return; }
  if (license.status === "suspended") { res.json({ valid: false, reason: "License is suspended" }); return; }

  if (license.expiryDate) {
    const expiry = new Date(license.expiryDate);
    if (expiry < new Date()) {
      await db.update(licensesTable).set({ status: "expired", updatedAt: new Date() }).where(eq(licensesTable.id, license.id));
      res.json({ valid: false, reason: "License has expired" });
      return;
    }
  }

  if (license.domain && domain && license.domain !== domain) { res.json({ valid: false, reason: "Domain mismatch" }); return; }
  if (license.ipAddress && ipAddress && license.ipAddress !== ipAddress) { res.json({ valid: false, reason: "IP address mismatch" }); return; }
  if (license.hardwareId && hardwareId && license.hardwareId !== hardwareId) { res.json({ valid: false, reason: "Hardware fingerprint mismatch" }); return; }

  const paymentCheck = checkPaymentStatus(license);
  if (!paymentCheck.valid) {
    await db.update(licensesTable).set({ status: "suspended", updatedAt: new Date() }).where(eq(licensesTable.id, license.id));
    res.json({ valid: false, reason: paymentCheck.warningMsg ?? "Payment required" });
    return;
  }

  await db.update(licensesTable).set({ lastValidated: new Date(), updatedAt: new Date() }).where(eq(licensesTable.id, license.id));

  res.json({
    valid: true,
    paymentWarning: paymentCheck.paymentWarning,
    warningMessage: paymentCheck.warningMsg,
    daysUntilBlock: paymentCheck.daysUntilBlock,
    paymentMethod: license.paymentMethodName,
    license: {
      id: license.id,
      productName: license.productName,
      clientName: license.clientName,
      licenseType: license.licenseType,
      expiryDate: license.expiryDate,
      status: license.status,
      nextPaymentDue: license.nextPaymentDue,
      feeAmount: license.feeAmount,
      billingCycle: license.billingCycle,
      paymentStatus: license.paymentStatus,
    },
  });
});

export default router;
