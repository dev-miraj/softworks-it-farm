import { Router } from "express";
import { eq, desc, and, sql, count } from "drizzle-orm";
import { db } from "../lib/db";
import {
  licensesTable,
  licenseProductsTable,
  licenseActivationsTable,
  licensePaymentsTable,
  licenseLogsTable,
  insertLicenseSchema,
  insertLicenseProductSchema,
  insertLicensePaymentSchema,
} from "@workspace/db/schema";
import crypto from "crypto";

const router = Router();

const GRACE_PERIOD_DAYS = 3;
const TRIAL_DAYS = 7;
const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW = 60_000;

function rateLimit(key: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT_MAP.get(key);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_MAP.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function generateLicenseKey(prefix = "SW"): string {
  const seg = () => crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${seg()}${seg()}-${seg()}${seg()}-${seg()}${seg()}`;
}

function generateHmacSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function verifyHmac(payload: string, signature: string, secret: string): boolean {
  const expected = generateHmacSignature(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function signResponse(data: object): { data: object; signature: string; timestamp: number } {
  const timestamp = Date.now();
  const payload = JSON.stringify({ ...data, timestamp });
  const secret = process.env.LICENSE_SIGNING_SECRET || "sw-license-secret-key-2024";
  const signature = generateHmacSignature(payload, secret);
  return { data, signature, timestamp };
}

function getNextPaymentDue(billingCycle: string, fromDate = new Date()): string | null {
  if (billingCycle === "lifetime" || billingCycle === "free") return null;
  const d = new Date(fromDate);
  if (billingCycle === "monthly") d.setMonth(d.getMonth() + 1);
  else if (billingCycle === "yearly") d.setFullYear(d.getFullYear() + 1);
  else if (billingCycle === "quarterly") d.setMonth(d.getMonth() + 3);
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
        return { valid: false, paymentWarning: true, warningMsg: "Payment overdue — license auto-blocked. Pay immediately to restore." };
      }
      const daysLeft = Math.ceil((grace.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { valid: true, paymentWarning: true, warningMsg: `Payment overdue! Auto-block in ${daysLeft} day(s).`, daysUntilBlock: daysLeft };
    }
    return { valid: false, paymentWarning: true, warningMsg: "Payment overdue — license blocked." };
  }
  if (license.paymentStatus === "pending" && license.nextPaymentDue) {
    const due = new Date(license.nextPaymentDue);
    const now = new Date();
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 7 && daysUntilDue > 0) {
      return { valid: true, paymentWarning: true, warningMsg: `Payment due in ${daysUntilDue} day(s).`, daysUntilBlock: daysUntilDue };
    }
    if (daysUntilDue <= 0) {
      return { valid: true, paymentWarning: true, warningMsg: "Payment is due today!", daysUntilBlock: GRACE_PERIOD_DAYS };
    }
  }
  return { valid: true, paymentWarning: false };
}

async function logAction(data: {
  licenseId?: number; licenseKey?: string; action: string;
  details?: string; ipAddress?: string; userAgent?: string; domain?: string;
  status?: string; metadata?: any;
}) {
  try {
    await db.insert(licenseLogsTable).values(data);
  } catch {}
}

// ─── LICENSE PRODUCTS ───
router.get("/license-products", async (req, res): Promise<void> => {
  const products = await db.select().from(licenseProductsTable).orderBy(desc(licenseProductsTable.createdAt));
  res.json(products);
});

router.post("/license-products", async (req, res): Promise<void> => {
  const parsed = insertLicenseProductSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  try {
    const [product] = await db.insert(licenseProductsTable).values(parsed.data).returning();
    res.status(201).json(product);
  } catch (err: any) {
    if (err.code === "23505") { res.status(409).json({ error: "Product slug already exists" }); return; }
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.put("/license-products/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const parsed = insertLicenseProductSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const [product] = await db.update(licenseProductsTable).set(parsed.data).where(eq(licenseProductsTable.id, id)).returning();
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(product);
});

router.delete("/license-products/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(licenseProductsTable).where(eq(licenseProductsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Product not found" }); return; }
  res.status(204).end();
});

// ─── LICENSES CRUD ───
router.get("/licenses", async (req, res): Promise<void> => {
  const licenses = await db.select().from(licensesTable).orderBy(desc(licensesTable.createdAt));
  res.json(licenses);
});

router.get("/licenses/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [license] = await db.select().from(licensesTable).where(eq(licensesTable.id, id));
  if (!license) { res.status(404).json({ error: "License not found" }); return; }
  const activations = await db.select().from(licenseActivationsTable)
    .where(eq(licenseActivationsTable.licenseId, id)).orderBy(desc(licenseActivationsTable.createdAt));
  const payments = await db.select().from(licensePaymentsTable)
    .where(eq(licensePaymentsTable.licenseId, id)).orderBy(desc(licensePaymentsTable.createdAt));
  const logs = await db.select().from(licenseLogsTable)
    .where(eq(licenseLogsTable.licenseId, id)).orderBy(desc(licenseLogsTable.createdAt)).limit(50);
  res.json({ ...license, activations, payments, logs });
});

router.post("/licenses", async (req, res): Promise<void> => {
  const body = { ...req.body };
  if (!body.licenseKey) body.licenseKey = generateLicenseKey();

  if (body.isTrial) {
    body.licenseType = "trial";
    body.status = "trial";
    body.paymentStatus = "free";
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + (body.trialDays || TRIAL_DAYS));
    body.trialEndsAt = trialEnd.toISOString();
    body.expiryDate = trialEnd.toISOString().slice(0, 10);
  } else if (body.feeAmount && Number(body.feeAmount) > 0 && body.billingCycle !== "lifetime") {
    body.paymentStatus = "pending";
    body.nextPaymentDue = getNextPaymentDue(body.billingCycle);
  } else if (!body.feeAmount || Number(body.feeAmount) === 0) {
    body.paymentStatus = "free";
  }

  const parsed = insertLicenseSchema.safeParse(body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  try {
    const [license] = await db.insert(licensesTable).values(parsed.data).returning();
    await logAction({ licenseId: license.id, licenseKey: license.licenseKey, action: "created", details: `License created: ${license.productName} for ${license.clientEmail}` });
    res.status(201).json(license);
  } catch (err: any) {
    if (err.code === "23505") { res.status(409).json({ error: "License key already exists" }); return; }
    res.status(500).json({ error: "Failed to create license" });
  }
});

router.put("/licenses/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const parsed = insertLicenseSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const [license] = await db.update(licensesTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(licensesTable.id, id)).returning();
  if (!license) { res.status(404).json({ error: "License not found" }); return; }
  await logAction({ licenseId: id, licenseKey: license.licenseKey, action: "updated", details: "License updated" });
  res.json(license);
});

router.delete("/licenses/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(licensesTable).where(eq(licensesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "License not found" }); return; }
  await logAction({ licenseKey: deleted.licenseKey, action: "deleted", details: "License deleted" });
  res.status(204).end();
});

// ─── LICENSE ACTIONS ───
router.post("/licenses/:id/suspend", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const reason = req.body.reason || "Suspended by admin";
  const [license] = await db.update(licensesTable).set({ status: "suspended", suspendReason: reason, updatedAt: new Date() }).where(eq(licensesTable.id, id)).returning();
  if (!license) { res.status(404).json({ error: "Not found" }); return; }
  await logAction({ licenseId: id, licenseKey: license.licenseKey, action: "suspended", details: reason });
  res.json(license);
});

router.post("/licenses/:id/activate", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [license] = await db.update(licensesTable).set({ status: "active", suspendReason: null, activatedAt: new Date(), updatedAt: new Date() }).where(eq(licensesTable.id, id)).returning();
  if (!license) { res.status(404).json({ error: "Not found" }); return; }
  await logAction({ licenseId: id, licenseKey: license.licenseKey, action: "activated", details: "License activated by admin" });
  res.json(license);
});

router.post("/licenses/:id/blacklist", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [license] = await db.update(licensesTable).set({ isBlacklisted: true, status: "suspended", suspendReason: "Blacklisted", updatedAt: new Date() }).where(eq(licensesTable.id, id)).returning();
  if (!license) { res.status(404).json({ error: "Not found" }); return; }
  await logAction({ licenseId: id, licenseKey: license.licenseKey, action: "blacklisted", details: "License blacklisted" });
  res.json(license);
});

router.post("/licenses/:id/unblacklist", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [license] = await db.update(licensesTable).set({ isBlacklisted: false, status: "active", suspendReason: null, updatedAt: new Date() }).where(eq(licensesTable.id, id)).returning();
  if (!license) { res.status(404).json({ error: "Not found" }); return; }
  await logAction({ licenseId: id, licenseKey: license.licenseKey, action: "unblacklisted", details: "Blacklist removed" });
  res.json(license);
});

router.post("/licenses/:id/kill-switch", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const enabled = req.body.enabled !== false;
  const [license] = await db.update(licensesTable).set({ killSwitch: enabled, status: enabled ? "suspended" : "active", updatedAt: new Date() }).where(eq(licensesTable.id, id)).returning();
  if (!license) { res.status(404).json({ error: "Not found" }); return; }
  await logAction({ licenseId: id, licenseKey: license.licenseKey, action: "kill-switch", details: enabled ? "Kill switch ENABLED" : "Kill switch DISABLED" });
  res.json(license);
});

router.post("/licenses/:id/reset-activations", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  await db.update(licenseActivationsTable).set({ isActive: false, deactivatedAt: new Date() })
    .where(and(eq(licenseActivationsTable.licenseId, id), eq(licenseActivationsTable.isActive, true)));
  const [license] = await db.update(licensesTable).set({ usageCount: 0, updatedAt: new Date() }).where(eq(licensesTable.id, id)).returning();
  if (!license) { res.status(404).json({ error: "Not found" }); return; }
  await logAction({ licenseId: id, licenseKey: license.licenseKey, action: "reset-activations", details: "All activations reset" });
  res.json(license);
});

router.post("/licenses/:id/mark-paid", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [cur] = await db.select().from(licensesTable).where(eq(licensesTable.id, id));
  if (!cur) { res.status(404).json({ error: "Not found" }); return; }
  const nextDue = getNextPaymentDue(cur.billingCycle ?? "monthly");
  const [license] = await db.update(licensesTable).set({
    paymentStatus: "paid", lastPaymentDate: new Date().toISOString().slice(0, 10),
    nextPaymentDue: nextDue, gracePeriodEnd: null, status: "active", suspendReason: null, updatedAt: new Date(),
  }).where(eq(licensesTable.id, id)).returning();
  await db.insert(licensePaymentsTable).values({
    licenseId: id, licenseKey: license.licenseKey, clientEmail: license.clientEmail,
    amount: license.feeAmount || "0", method: license.paymentMethodName || "manual", status: "completed",
    notes: "Manually marked as paid",
  });
  await logAction({ licenseId: id, licenseKey: license.licenseKey, action: "payment-received", details: `Marked paid. Next due: ${nextDue}` });
  res.json(license);
});

router.post("/licenses/:id/mark-overdue", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);
  const [license] = await db.update(licensesTable).set({ paymentStatus: "overdue", gracePeriodEnd, updatedAt: new Date() }).where(eq(licensesTable.id, id)).returning();
  if (!license) { res.status(404).json({ error: "Not found" }); return; }
  await logAction({ licenseId: id, licenseKey: license.licenseKey, action: "marked-overdue", details: `Grace period ends: ${gracePeriodEnd.toISOString()}` });
  res.json(license);
});

// ─── PUBLIC LICENSE API (Client SDK Endpoints) ───
router.post("/license/activate", async (req, res): Promise<void> => {
  const clientIp = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").split(",")[0].trim();
  if (!rateLimit(clientIp)) { res.status(429).json({ success: false, error: "Rate limit exceeded" }); return; }

  const { license_key, domain, ip_address, hardware_id, user_agent, fingerprint } = req.body;
  if (!license_key) { res.status(400).json({ success: false, error: "license_key is required" }); return; }

  const [license] = await db.select().from(licensesTable).where(eq(licensesTable.licenseKey, license_key));
  if (!license) {
    await logAction({ licenseKey: license_key, action: "activate-failed", details: "Invalid key", ipAddress: clientIp, domain, status: "failed" });
    res.json({ success: false, error: "Invalid license key" }); return;
  }
  if (license.isBlacklisted) { res.json({ success: false, error: "License is blacklisted" }); return; }
  if (license.killSwitch) { res.json({ success: false, error: "License has been terminated" }); return; }
  if (license.status === "suspended") { res.json({ success: false, error: "License is suspended" }); return; }
  if (license.status === "expired") { res.json({ success: false, error: "License has expired" }); return; }

  if (license.isTrial && license.trialEndsAt && new Date(license.trialEndsAt) < new Date()) {
    await db.update(licensesTable).set({ status: "expired", updatedAt: new Date() }).where(eq(licensesTable.id, license.id));
    res.json({ success: false, error: "Trial period has expired" }); return;
  }

  if (license.expiryDate && new Date(license.expiryDate) < new Date()) {
    await db.update(licensesTable).set({ status: "expired", updatedAt: new Date() }).where(eq(licensesTable.id, license.id));
    res.json({ success: false, error: "License has expired" }); return;
  }

  const activeActivations = await db.select().from(licenseActivationsTable)
    .where(and(eq(licenseActivationsTable.licenseId, license.id), eq(licenseActivationsTable.isActive, true)));

  const existingActivation = activeActivations.find(a =>
    (domain && a.domain === domain) || (hardware_id && a.hardwareId === hardware_id)
  );

  if (existingActivation) {
    await db.update(licenseActivationsTable).set({ lastSeen: new Date(), ipAddress: ip_address || clientIp })
      .where(eq(licenseActivationsTable.id, existingActivation.id));
    await db.update(licensesTable).set({ lastValidated: new Date(), updatedAt: new Date() }).where(eq(licensesTable.id, license.id));
    const signed = signResponse({ activated: true, license_key, product: license.productName, type: license.licenseType, expires: license.expiryDate, reactivated: true });
    res.json({ success: true, ...signed }); return;
  }

  if (activeActivations.length >= license.maxActivations) {
    await logAction({ licenseId: license.id, licenseKey: license_key, action: "activate-failed", details: `Max activations reached (${license.maxActivations})`, ipAddress: clientIp, domain, status: "failed" });
    res.json({ success: false, error: `Maximum activations reached (${license.maxActivations}). Deactivate an existing activation first.` }); return;
  }

  if (domain && license.domains && license.domains.length > 0) {
    const allowedDomains = license.domains.map(d => d.toLowerCase().replace(/^www\./, ""));
    const requestDomain = domain.toLowerCase().replace(/^www\./, "");
    if (!allowedDomains.includes(requestDomain) && !allowedDomains.includes("*")) {
      res.json({ success: false, error: "Domain not authorized for this license" }); return;
    }
  }

  await db.insert(licenseActivationsTable).values({
    licenseId: license.id, licenseKey: license_key, domain, ipAddress: ip_address || clientIp,
    hardwareId: hardware_id, userAgent: user_agent, fingerprint, isActive: true, lastSeen: new Date(),
  });

  const newCount = activeActivations.length + 1;
  const updDomain = domain || license.domain;
  await db.update(licensesTable).set({
    usageCount: newCount, domain: updDomain, ipAddress: ip_address || clientIp,
    hardwareId: hardware_id || license.hardwareId,
    activatedAt: license.activatedAt || new Date(), lastValidated: new Date(), updatedAt: new Date(),
  }).where(eq(licensesTable.id, license.id));

  await logAction({ licenseId: license.id, licenseKey: license_key, action: "activated", details: `Domain: ${domain || "N/A"}, IP: ${ip_address || clientIp}`, ipAddress: clientIp, domain, status: "success" });

  const signed = signResponse({
    activated: true, license_key, product: license.productName, type: license.licenseType,
    expires: license.expiryDate, activation_count: newCount, max_activations: license.maxActivations,
  });
  res.json({ success: true, ...signed });
});

router.post("/license/validate", async (req, res): Promise<void> => {
  const clientIp = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").split(",")[0].trim();
  if (!rateLimit(clientIp)) { res.status(429).json({ valid: false, error: "Rate limit exceeded" }); return; }

  const { license_key, domain, ip_address, hardware_id } = req.body;
  if (!license_key) { res.status(400).json({ valid: false, error: "license_key is required" }); return; }

  const [license] = await db.select().from(licensesTable).where(eq(licensesTable.licenseKey, license_key));
  if (!license) { res.json({ valid: false, error: "Invalid license key" }); return; }
  if (license.isBlacklisted) { res.json({ valid: false, error: "License is blacklisted" }); return; }
  if (license.killSwitch) { res.json({ valid: false, error: "License terminated by administrator" }); return; }
  if (license.status === "suspended") { res.json({ valid: false, error: `License suspended: ${license.suspendReason || "Contact admin"}` }); return; }

  if (license.isTrial && license.trialEndsAt && new Date(license.trialEndsAt) < new Date()) {
    await db.update(licensesTable).set({ status: "expired", updatedAt: new Date() }).where(eq(licensesTable.id, license.id));
    res.json({ valid: false, error: "Trial period has expired", trial_expired: true }); return;
  }

  if (license.expiryDate && new Date(license.expiryDate) < new Date()) {
    await db.update(licensesTable).set({ status: "expired", updatedAt: new Date() }).where(eq(licensesTable.id, license.id));
    res.json({ valid: false, error: "License has expired" }); return;
  }

  if (domain) {
    const reqDomain = domain.toLowerCase().replace(/^www\./, "");
    if (license.domain && license.domain.toLowerCase().replace(/^www\./, "") !== reqDomain) {
      if (!license.domains || !license.domains.some(d => d.toLowerCase().replace(/^www\./, "") === reqDomain)) {
        await logAction({ licenseId: license.id, licenseKey: license_key, action: "validate-failed", details: `Domain mismatch: ${domain}`, ipAddress: clientIp, domain, status: "failed" });
        res.json({ valid: false, error: "Domain not authorized" }); return;
      }
    }
  }

  if (hardware_id && license.hardwareId && license.hardwareId !== hardware_id) {
    if (!license.hardwareIds || !license.hardwareIds.includes(hardware_id)) {
      res.json({ valid: false, error: "Hardware fingerprint mismatch" }); return;
    }
  }

  const paymentCheck = checkPaymentStatus(license);
  if (!paymentCheck.valid) {
    await db.update(licensesTable).set({ status: "suspended", suspendReason: "Payment overdue", updatedAt: new Date() }).where(eq(licensesTable.id, license.id));
    res.json({ valid: false, error: paymentCheck.warningMsg }); return;
  }

  await db.update(licensesTable).set({
    lastValidated: new Date(), totalValidations: (license.totalValidations || 0) + 1, updatedAt: new Date(),
  }).where(eq(licensesTable.id, license.id));

  const signed = signResponse({
    valid: true, license_key, product: license.productName, client: license.clientName,
    type: license.licenseType, plan: license.planType, expires: license.expiryDate,
    is_trial: license.isTrial, trial_ends: license.trialEndsAt,
    payment_warning: paymentCheck.paymentWarning, warning_message: paymentCheck.warningMsg,
    next_payment: license.nextPaymentDue, fee: license.feeAmount, billing: license.billingCycle,
  });
  res.json(signed);
});

router.post("/license/heartbeat", async (req, res): Promise<void> => {
  const clientIp = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").split(",")[0].trim();
  if (!rateLimit(`hb-${clientIp}`)) { res.status(429).json({ success: false }); return; }

  const { license_key, domain, hardware_id } = req.body;
  if (!license_key) { res.status(400).json({ success: false, error: "license_key required" }); return; }

  const [license] = await db.select().from(licensesTable).where(eq(licensesTable.licenseKey, license_key));
  if (!license || license.isBlacklisted || license.killSwitch || license.status === "suspended" || license.status === "expired") {
    res.json({ success: false, active: false }); return;
  }

  if (license.expiryDate && new Date(license.expiryDate) < new Date()) {
    await db.update(licensesTable).set({ status: "expired", updatedAt: new Date() }).where(eq(licensesTable.id, license.id));
    res.json({ success: false, active: false, expired: true }); return;
  }

  await db.update(licensesTable).set({ lastHeartbeat: new Date(), updatedAt: new Date() }).where(eq(licensesTable.id, license.id));

  if (domain || hardware_id) {
    const conditions = [eq(licenseActivationsTable.licenseId, license.id), eq(licenseActivationsTable.isActive, true)];
    if (domain) conditions.push(eq(licenseActivationsTable.domain, domain));
    const activations = await db.select().from(licenseActivationsTable).where(and(...conditions));
    if (activations.length > 0) {
      await db.update(licenseActivationsTable).set({ lastSeen: new Date(), ipAddress: clientIp })
        .where(eq(licenseActivationsTable.id, activations[0].id));
    }
  }

  const paymentCheck = checkPaymentStatus(license);
  res.json({
    success: true, active: true,
    payment_warning: paymentCheck.paymentWarning, warning_message: paymentCheck.warningMsg,
    next_payment: license.nextPaymentDue, expires: license.expiryDate,
  });
});

router.post("/license/deactivate", async (req, res): Promise<void> => {
  const { license_key, domain, hardware_id } = req.body;
  if (!license_key) { res.status(400).json({ success: false, error: "license_key required" }); return; }

  const [license] = await db.select().from(licensesTable).where(eq(licensesTable.licenseKey, license_key));
  if (!license) { res.json({ success: false, error: "Invalid license key" }); return; }

  const conditions = [eq(licenseActivationsTable.licenseId, license.id), eq(licenseActivationsTable.isActive, true)];
  if (domain) conditions.push(eq(licenseActivationsTable.domain, domain));
  if (hardware_id) conditions.push(eq(licenseActivationsTable.hardwareId, hardware_id));

  const [deactivated] = await db.update(licenseActivationsTable)
    .set({ isActive: false, deactivatedAt: new Date() }).where(and(...conditions)).returning();

  if (!deactivated) { res.json({ success: false, error: "No matching activation found" }); return; }

  const activeCount = await db.select({ c: count() }).from(licenseActivationsTable)
    .where(and(eq(licenseActivationsTable.licenseId, license.id), eq(licenseActivationsTable.isActive, true)));
  await db.update(licensesTable).set({ usageCount: activeCount[0]?.c || 0, updatedAt: new Date() }).where(eq(licensesTable.id, license.id));

  await logAction({ licenseId: license.id, licenseKey: license_key, action: "deactivated", details: `Domain: ${domain || "N/A"}`, domain, status: "success" });
  res.json({ success: true, message: "Activation removed" });
});

router.get("/license/check/:key", async (req, res): Promise<void> => {
  const [license] = await db.select().from(licensesTable).where(eq(licensesTable.licenseKey, req.params.key));
  if (!license) { res.json({ found: false }); return; }
  res.json({
    found: true, status: license.status, product: license.productName, type: license.licenseType,
    is_trial: license.isTrial, expires: license.expiryDate, blacklisted: license.isBlacklisted,
    activated: !!license.activatedAt, usageCount: license.usageCount, maxActivations: license.maxActivations,
  });
});

// ─── BACKWARD-COMPATIBLE VALIDATE ───
router.post("/validate-license", async (req, res): Promise<void> => {
  const { licenseKey, domain, ipAddress, hardwareId } = req.body;
  if (!licenseKey) { res.status(400).json({ valid: false, reason: "License key is required" }); return; }
  const [license] = await db.select().from(licensesTable).where(eq(licensesTable.licenseKey, licenseKey));
  if (!license) { res.json({ valid: false, reason: "Invalid license key" }); return; }
  if (license.isBlacklisted) { res.json({ valid: false, reason: "License is blacklisted" }); return; }
  if (license.killSwitch) { res.json({ valid: false, reason: "License terminated" }); return; }
  if (license.status === "suspended") { res.json({ valid: false, reason: "License is suspended" }); return; }
  if (license.expiryDate && new Date(license.expiryDate) < new Date()) {
    await db.update(licensesTable).set({ status: "expired", updatedAt: new Date() }).where(eq(licensesTable.id, license.id));
    res.json({ valid: false, reason: "License has expired" }); return;
  }
  if (license.domain && domain && license.domain !== domain) { res.json({ valid: false, reason: "Domain mismatch" }); return; }
  if (license.ipAddress && ipAddress && license.ipAddress !== ipAddress) { res.json({ valid: false, reason: "IP address mismatch" }); return; }
  if (license.hardwareId && hardwareId && license.hardwareId !== hardwareId) { res.json({ valid: false, reason: "Hardware fingerprint mismatch" }); return; }
  const paymentCheck = checkPaymentStatus(license);
  if (!paymentCheck.valid) {
    await db.update(licensesTable).set({ status: "suspended", updatedAt: new Date() }).where(eq(licensesTable.id, license.id));
    res.json({ valid: false, reason: paymentCheck.warningMsg ?? "Payment required" }); return;
  }
  await db.update(licensesTable).set({ lastValidated: new Date(), totalValidations: (license.totalValidations || 0) + 1, updatedAt: new Date() }).where(eq(licensesTable.id, license.id));
  res.json({
    valid: true, paymentWarning: paymentCheck.paymentWarning, warningMessage: paymentCheck.warningMsg,
    daysUntilBlock: paymentCheck.daysUntilBlock, paymentMethod: license.paymentMethodName,
    license: {
      id: license.id, productName: license.productName, clientName: license.clientName,
      licenseType: license.licenseType, expiryDate: license.expiryDate, status: license.status,
      nextPaymentDue: license.nextPaymentDue, feeAmount: license.feeAmount,
      billingCycle: license.billingCycle, paymentStatus: license.paymentStatus,
    },
  });
});

// ─── LICENSE ACTIVATIONS ───
router.get("/license-activations", async (req, res): Promise<void> => {
  const activations = await db.select().from(licenseActivationsTable).orderBy(desc(licenseActivationsTable.createdAt)).limit(200);
  res.json(activations);
});

// ─── LICENSE PAYMENTS ───
router.get("/license-payments", async (req, res): Promise<void> => {
  const payments = await db.select().from(licensePaymentsTable).orderBy(desc(licensePaymentsTable.createdAt)).limit(200);
  res.json(payments);
});

router.post("/license-payments", async (req, res): Promise<void> => {
  const parsed = insertLicensePaymentSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const [payment] = await db.insert(licensePaymentsTable).values(parsed.data).returning();
  if (parsed.data.status === "completed") {
    const [license] = await db.select().from(licensesTable).where(eq(licensesTable.id, parsed.data.licenseId));
    if (license) {
      const nextDue = getNextPaymentDue(license.billingCycle ?? "monthly");
      await db.update(licensesTable).set({
        paymentStatus: "paid", lastPaymentDate: new Date().toISOString().slice(0, 10),
        nextPaymentDue: nextDue, gracePeriodEnd: null, status: "active", updatedAt: new Date(),
      }).where(eq(licensesTable.id, license.id));
    }
  }
  res.status(201).json(payment);
});

// ─── LICENSE LOGS ───
router.get("/license-logs", async (req, res): Promise<void> => {
  const logs = await db.select().from(licenseLogsTable).orderBy(desc(licenseLogsTable.createdAt)).limit(500);
  res.json(logs);
});

// ─── DASHBOARD STATS ───
router.get("/license-stats", async (req, res): Promise<void> => {
  const all = await db.select().from(licensesTable);
  const activations = await db.select({ c: count() }).from(licenseActivationsTable).where(eq(licenseActivationsTable.isActive, true));
  const payments = await db.select().from(licensePaymentsTable).where(eq(licensePaymentsTable.status, "completed"));
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const products = await db.select({ c: count() }).from(licenseProductsTable);

  res.json({
    totalLicenses: all.length,
    active: all.filter(l => l.status === "active").length,
    trial: all.filter(l => l.isTrial && l.status !== "expired").length,
    expired: all.filter(l => l.status === "expired").length,
    suspended: all.filter(l => l.status === "suspended").length,
    blacklisted: all.filter(l => l.isBlacklisted).length,
    overdue: all.filter(l => l.paymentStatus === "overdue").length,
    totalActivations: activations[0]?.c || 0,
    totalRevenue, totalPayments: payments.length,
    totalProducts: products[0]?.c || 0,
    byType: {
      lifetime: all.filter(l => l.licenseType === "lifetime").length,
      monthly: all.filter(l => l.billingCycle === "monthly").length,
      yearly: all.filter(l => l.billingCycle === "yearly").length,
      trial: all.filter(l => l.isTrial).length,
    },
    recentActivity: all.slice(0, 5).map(l => ({ id: l.id, key: l.licenseKey, product: l.productName, status: l.status, client: l.clientName })),
  });
});

router.post("/shield-verify", async (req, res) => {
  const { license_key, domain, hardware_id, sdk_version, shield_token, file_hash } = req.body;

  if (!license_key || !domain) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const ip = (req.headers["x-forwarded-for"] as string || req.ip || "unknown").split(",")[0].trim();

  try {
    const [license] = await db
      .select()
      .from(licensesTable)
      .where(eq(licensesTable.licenseKey, license_key))
      .limit(1);

    if (!license) {
      await db.insert(licenseLogsTable).values({
        licenseId: 0,
        action: "shield_tamper_attempt",
        details: `Invalid key shield-verify from ${domain} (${ip}), SDK: ${sdk_version}`,
        ipAddress: ip,
      });
      return res.json({ valid: false, tampered: true });
    }

    if (license.isBlacklisted || license.killSwitch) {
      await db.insert(licenseLogsTable).values({
        licenseId: license.id,
        action: "shield_blocked",
        details: `Blocked license shield-verify from ${domain} (${ip}), kill: ${license.killSwitch}, black: ${license.isBlacklisted}`,
        ipAddress: ip,
      });
      return res.json({ valid: false, tampered: false, blocked: true });
    }

    await db.insert(licenseLogsTable).values({
      licenseId: license.id,
      action: "shield_verify",
      details: `Shield OK from ${domain} (${ip}), SDK: ${sdk_version}, HW: ${hardware_id}`,
      ipAddress: ip,
    });

    res.json({
      valid: true,
      tampered: false,
      blocked: false,
      status: license.status,
      kill_switch: license.killSwitch,
    });
  } catch (err) {
    console.error("Shield verify error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
