import { Router } from "express";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { db } from "../lib/db.js";
import { voiceCallConfigsTable, voiceCallSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import multer from "multer";

const router = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads", "voice-calls");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("audio/") || file.mimetype === "video/mpeg") cb(null, true);
    else cb(new Error("Only audio files are allowed"));
  },
});

function getApiBase(req: { headers: { host?: string }; protocol: string }): string {
  const apiBase = process.env["PUBLIC_API_URL"];
  if (apiBase) return apiBase.replace(/\/$/, "");
  return `${req.protocol}://${req.headers.host}`;
}

async function getConfig() {
  const [cfg] = await db.select().from(voiceCallConfigsTable).limit(1);
  if (cfg) return cfg;
  const [inserted] = await db.insert(voiceCallConfigsTable).values({}).returning();
  return inserted;
}

async function sendWebhook(session: typeof voiceCallSessionsTable.$inferSelect, action: string) {
  if (!session.ecommerceWebhookUrl) return;
  try {
    const response = await fetch(session.ecommerceWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: session.orderId,
        action,
        status: action,
        dtmfInput: session.dtmfInput,
        customerName: session.customerName,
        token: session.token,
      }),
      signal: AbortSignal.timeout(10000),
    });
    return response.ok ? "ok" : `HTTP ${response.status}`;
  } catch (e) {
    return `error: ${e instanceof Error ? e.message : "unknown"}`;
  }
}

router.get("/audio/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.sendFile(filePath);
});

router.get("/config", async (_req, res) => {
  try {
    const cfg = await getConfig();
    res.json(cfg);
  } catch (e) {
    res.status(500).json({ error: "Failed to get config" });
  }
});

router.put("/config", async (req, res) => {
  try {
    const cfg = await getConfig();
    const allowed = [
      "companyName", "menuText", "confirmText", "cancelText",
      "sessionExpiryMinutes", "enabled",
    ] as const;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of allowed) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }
    const [updated] = await db
      .update(voiceCallConfigsTable)
      .set(update)
      .where(eq(voiceCallConfigsTable.id, cfg.id))
      .returning();
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: "Failed to update config" });
  }
});

router.post("/upload-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const field = (req.body.field as string) || "welcomeAudioUrl";
    const base = getApiBase(req as any);
    const audioUrl = `${base}/api/voice-calls/audio/${req.file.filename}`;
    const cfg = await getConfig();
    const fieldMap: Record<string, string> = {
      welcome: "welcomeAudioUrl",
      menu: "menuAudioUrl",
      confirm: "confirmAudioUrl",
      cancel: "cancelAudioUrl",
    };
    const colName = fieldMap[field] || "welcomeAudioUrl";
    const [updated] = await db
      .update(voiceCallConfigsTable)
      .set({ [colName]: audioUrl, updatedAt: new Date() })
      .where(eq(voiceCallConfigsTable.id, cfg.id))
      .returning();
    res.json({ url: audioUrl, config: updated });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Upload failed" });
  }
});

router.post("/initiate", async (req, res) => {
  try {
    const {
      orderId, customerName, customerPhone, orderAmount,
      orderDetails, ecommerceWebhookUrl, ecommerceSiteUrl,
    } = req.body as Record<string, string>;

    if (!orderId) return res.status(400).json({ error: "orderId is required" });

    const cfg = await getConfig();
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + (cfg.sessionExpiryMinutes ?? 30) * 60 * 1000);

    const [session] = await db
      .insert(voiceCallSessionsTable)
      .values({
        token, orderId, customerName, customerPhone,
        orderAmount, orderDetails, ecommerceWebhookUrl, ecommerceSiteUrl,
        status: "pending", expiresAt,
      })
      .returning();

    const base = getApiBase(req as any);
    const callUrl = `${base}/api/voice-calls/session/${token}/ui`;

    res.status(201).json({ token, callUrl, session });
  } catch (e) {
    res.status(500).json({ error: "Failed to initiate call session" });
  }
});

router.get("/session/:token", async (req, res) => {
  try {
    const [session] = await db
      .select()
      .from(voiceCallSessionsTable)
      .where(eq(voiceCallSessionsTable.token, req.params.token));
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (new Date() > new Date(session.expiresAt)) {
      return res.status(410).json({ error: "Call session has expired" });
    }
    const cfg = await getConfig();
    res.json({ session, config: cfg });
  } catch (e) {
    res.status(500).json({ error: "Failed to get session" });
  }
});

router.post("/session/:token/respond", async (req, res) => {
  try {
    const { dtmf } = req.body as { dtmf: string };
    const [session] = await db
      .select()
      .from(voiceCallSessionsTable)
      .where(eq(voiceCallSessionsTable.token, req.params.token));

    if (!session) return res.status(404).json({ error: "Session not found" });
    if (new Date() > new Date(session.expiresAt)) {
      return res.status(410).json({ error: "Session expired" });
    }
    if (session.status === "completed") {
      return res.status(409).json({ error: "Already responded" });
    }

    const actionMap: Record<string, string> = { "1": "confirmed", "2": "cancelled" };
    const action = actionMap[dtmf] || "invalid";

    const [updated] = await db
      .update(voiceCallSessionsTable)
      .set({
        dtmfInput: dtmf,
        actionTaken: action,
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(voiceCallSessionsTable.token, req.params.token))
      .returning();

    const webhookResult = await sendWebhook(updated, action);
    if (webhookResult) {
      await db.update(voiceCallSessionsTable)
        .set({ webhookSent: true, webhookResponse: webhookResult })
        .where(eq(voiceCallSessionsTable.token, req.params.token));
    }

    res.json({ action, session: updated });
  } catch (e) {
    res.status(500).json({ error: "Failed to process response" });
  }
});

router.get("/session/:token/ui", async (req, res) => {
  const { token } = req.params;
  const appBase = process.env["PUBLIC_FRONTEND_URL"] || "";
  res.redirect(`${appBase}/call/${token}`);
});

router.get("/", async (_req, res) => {
  try {
    const sessions = await db
      .select()
      .from(voiceCallSessionsTable)
      .orderBy(voiceCallSessionsTable.createdAt);
    res.json(sessions.reverse());
  } catch (e) {
    res.status(500).json({ error: "Failed to list sessions" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(voiceCallSessionsTable).where(eq(voiceCallSessionsTable.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete session" });
  }
});

export { router as voiceCallsRouter };
