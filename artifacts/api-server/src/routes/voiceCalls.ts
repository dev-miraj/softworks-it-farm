import { Router } from "express";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { db } from "../lib/db.js";
import { voiceCallConfigsTable, voiceCallSessionsTable, callLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import multer from "multer";
import { openai, isAiEnabled } from "../lib/ai.js";
import { emitToCall, emitToAll } from "../lib/socketManager.js";

const router = Router();

const UPLOADS_DIR = process.env["VERCEL"]
  ? path.join("/tmp", "uploads", "voice-calls")
  : path.resolve(process.cwd(), "uploads", "voice-calls");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch { /* ignore */ }
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".mp3";
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("audio/") || file.mimetype === "video/mpeg" || file.mimetype === "audio/webm") cb(null, true);
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

async function logCallEvent(sessionId: number, token: string, event: string, extra?: {
  keyPressed?: string; action?: string; stepIndex?: number; metadata?: unknown;
}) {
  try {
    await db.insert(callLogsTable).values({
      sessionId, token, event,
      keyPressed: extra?.keyPressed,
      action: extra?.action,
      stepIndex: extra?.stepIndex,
      metadata: extra?.metadata as any,
    });
  } catch { /* non-critical */ }
}

async function sendWebhook(session: typeof voiceCallSessionsTable.$inferSelect, action: string) {
  if (!session.ecommerceWebhookUrl) return null;
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
        callDurationSeconds: session.callDurationSeconds,
      }),
      signal: AbortSignal.timeout(10000),
    });
    return response.ok ? "ok" : `HTTP ${response.status}`;
  } catch (e) {
    return `error: ${e instanceof Error ? e.message : "unknown"}`;
  }
}

router.get("/widget.js", (_req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(`/* SoftworksCall Widget v2.0 | Auto Order Confirmation */
(function(g){'use strict';
var STYLE_ID='sw-call-style',OV_ID='sw-call-overlay';
function injectStyles(){
  if(document.getElementById(STYLE_ID))return;
  var s=document.createElement('style');s.id=STYLE_ID;
  s.textContent='#sw-call-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:swFI .25s ease}#sw-call-overlay iframe{width:430px;max-width:95vw;height:720px;max-height:93vh;border:none;border-radius:24px;box-shadow:0 30px 80px rgba(0,0,0,.6)}@keyframes swFI{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}@keyframes swFO{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.95)}}';
  document.head.appendChild(s);
}
function removeOverlay(){
  var el=document.getElementById(OV_ID);
  if(!el)return;
  el.style.animation='swFO .2s ease forwards';
  setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},200);
}
g.SoftworksCall={
  _frontendUrl:'',_onComplete:null,_handler:null,
  configure:function(o){if(o&&o.frontendUrl)this._frontendUrl=o.frontendUrl.replace(/\\/$/,'');},
  show:function(token,opts){
    injectStyles();removeOverlay();
    var fu=(opts&&opts.frontendUrl)||this._frontendUrl||'';
    var url=fu+'/call/'+token+'?overlay=1';
    var ov=document.createElement('div');ov.id=OV_ID;
    var fr=document.createElement('iframe');fr.src=url;fr.allow='autoplay';
    ov.appendChild(fr);document.body.appendChild(ov);
    ov.addEventListener('click',function(e){if(e.target===ov)removeOverlay();});
    var self=this;
    if(this._handler)window.removeEventListener('message',this._handler);
    this._handler=function(e){
      if(!e.data||!e.data.sw_call)return;
      var cb=(opts&&opts.onComplete)||self._onComplete;
      if(e.data.sw_call==='completed'){
        setTimeout(removeOverlay,2800);
        window.removeEventListener('message',self._handler);
        if(cb)cb(e.data);
      }
      if(e.data.sw_call==='close'){removeOverlay();window.removeEventListener('message',self._handler);}
    };
    window.addEventListener('message',this._handler);
  },
  hide:function(){removeOverlay();},
  onComplete:function(cb){this._onComplete=cb;}
};
})(window);`);
});

router.get("/audio/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.sendFile(filePath);
});

router.post("/tts", async (req, res) => {
  const { text, voice = "nova" } = req.body as { text: string; voice?: string };
  if (!text?.trim()) return res.status(400).json({ error: "text is required" });

  if (!isAiEnabled() || !openai) {
    return res.json({ url: null, text, useBrowserTts: true, voice });
  }

  try {
    const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
    const selectedVoice = validVoices.includes(voice) ? voice : "nova";

    const mp3 = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: selectedVoice as "nova" | "alloy" | "echo" | "fable" | "onyx" | "shimmer",
      input: text,
    });

    const filename = `tts-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.mp3`;
    const filePath = path.join(UPLOADS_DIR, filename);
    const buffer = Buffer.from(await mp3.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const base = getApiBase(req as any);
    const url = `${base}/api/voice-calls/audio/${filename}`;
    res.json({ url, filename, useBrowserTts: false });
  } catch (e) {
    console.error("TTS error:", e);
    res.json({ url: null, text, useBrowserTts: true, voice });
  }
});

router.get("/config", async (_req, res) => {
  try {
    const cfg = await getConfig();
    res.json(cfg);
  } catch {
    res.status(500).json({ error: "Failed to get config" });
  }
});

router.put("/config", async (req, res) => {
  try {
    const cfg = await getConfig();
    const allowed = [
      "companyName", "logoUrl", "welcomeText", "announcementText",
      "options", "ttsVoice", "sessionExpiryMinutes", "enabled",
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
  } catch {
    res.status(500).json({ error: "Failed to update config" });
  }
});

router.post("/upload-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const base = getApiBase(req as any);
    const audioUrl = `${base}/api/voice-calls/audio/${req.file.filename}`;
    const field = (req.body.field as string) || "welcomeAudioUrl";
    const cfg = await getConfig();

    const directFieldMap: Record<string, string> = {
      welcome: "welcomeAudioUrl",
      announcement: "announcementAudioUrl",
    };

    if (directFieldMap[field]) {
      const [updated] = await db
        .update(voiceCallConfigsTable)
        .set({ [directFieldMap[field]]: audioUrl, updatedAt: new Date() })
        .where(eq(voiceCallConfigsTable.id, cfg.id))
        .returning();
      return res.json({ url: audioUrl, config: updated });
    }

    if (field.startsWith("option:")) {
      const optionKey = field.replace("option:", "");
      const options = (cfg.options as any[]) || [];
      const updatedOptions = options.map((o: any) =>
        o.key === optionKey ? { ...o, responseAudioUrl: audioUrl } : o
      );
      const [updated] = await db
        .update(voiceCallConfigsTable)
        .set({ options: updatedOptions, updatedAt: new Date() })
        .where(eq(voiceCallConfigsTable.id, cfg.id))
        .returning();
      return res.json({ url: audioUrl, config: updated });
    }

    res.json({ url: audioUrl });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Upload failed" });
  }
});

router.post("/initiate", async (req, res) => {
  try {
    const {
      orderId, customerName, customerPhone, orderAmount,
      orderDetails, products, deliveryInfo, ecommerceWebhookUrl, ecommerceSiteUrl,
    } = req.body as Record<string, any>;

    if (!orderId) return res.status(400).json({ error: "orderId is required" });

    const cfg = await getConfig();
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + (cfg.sessionExpiryMinutes ?? 30) * 60 * 1000);

    const [session] = await db
      .insert(voiceCallSessionsTable)
      .values({
        token, orderId, customerName, customerPhone,
        orderAmount, orderDetails, products: products || null,
        deliveryInfo: deliveryInfo || null,
        ecommerceWebhookUrl, ecommerceSiteUrl,
        status: "pending", expiresAt,
      })
      .returning();

    await logCallEvent(session.id, token, "session_created", {
      metadata: { orderId, customerPhone, orderAmount },
    });

    emitToAll("call:new_session", { token, orderId, customerName, customerPhone, orderAmount });

    const frontendUrl = process.env["PUBLIC_FRONTEND_URL"] || "";
    const callUrl = `${frontendUrl}/call/${token}`;

    res.status(201).json({ token, callUrl, session });
  } catch (e) {
    console.error("Initiate error:", e);
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
      return res.status(410).json({ error: "Session expired" });
    }
    const cfg = await getConfig();
    res.json({ session, config: cfg });
  } catch {
    res.status(500).json({ error: "Failed to get session" });
  }
});

router.post("/session/:token/connected", async (req, res) => {
  try {
    const [session] = await db
      .select()
      .from(voiceCallSessionsTable)
      .where(eq(voiceCallSessionsTable.token, req.params.token));
    if (!session) return res.status(404).json({ error: "Session not found" });

    const now = new Date();
    await db.update(voiceCallSessionsTable)
      .set({ callStartedAt: now, status: "active", updatedAt: now })
      .where(eq(voiceCallSessionsTable.token, req.params.token));

    await logCallEvent(session.id, req.params.token, "call_connected");
    emitToAll("call:connected", { token: req.params.token, orderId: session.orderId });

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to mark connected" });
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
    if (new Date() > new Date(session.expiresAt)) return res.status(410).json({ error: "Session expired" });
    if (session.status === "completed") return res.status(409).json({ error: "Already responded" });

    const cfg = await getConfig();
    const options = (cfg.options as any[]) || [];
    const matchedOption = options.find((o: any) => o.key === dtmf && o.enabled !== false);
    const action = matchedOption?.action || `key_${dtmf}`;

    const now = new Date();
    const startedAt = session.callStartedAt ? new Date(session.callStartedAt) : new Date(session.createdAt!);
    const durationSeconds = Math.round((now.getTime() - startedAt.getTime()) / 1000);

    const [updated] = await db
      .update(voiceCallSessionsTable)
      .set({
        dtmfInput: dtmf, actionTaken: action, status: "completed",
        callEndedAt: now, callDurationSeconds: durationSeconds,
        updatedAt: now,
      })
      .where(eq(voiceCallSessionsTable.token, req.params.token))
      .returning();

    await logCallEvent(session.id, req.params.token, "key_pressed", {
      keyPressed: dtmf, action, metadata: { durationSeconds },
    });

    emitToCall(req.params.token, "call:responded", {
      token: req.params.token, dtmf, action, orderId: session.orderId, durationSeconds,
    });
    emitToAll("call:completed", {
      token: req.params.token, action, orderId: session.orderId, customerName: session.customerName,
    });

    const webhookResult = await sendWebhook(updated, action);
    if (webhookResult) {
      await db.update(voiceCallSessionsTable)
        .set({ webhookSent: true, webhookResponse: webhookResult })
        .where(eq(voiceCallSessionsTable.token, req.params.token));
    }

    res.json({ action, option: matchedOption, session: updated });
  } catch (e) {
    console.error("Respond error:", e);
    res.status(500).json({ error: "Failed to process response" });
  }
});

router.patch("/session/:token/notes", async (req, res) => {
  try {
    const { adminNotes } = req.body as { adminNotes: string };
    const [session] = await db
      .select()
      .from(voiceCallSessionsTable)
      .where(eq(voiceCallSessionsTable.token, req.params.token));
    if (!session) return res.status(404).json({ error: "Session not found" });
    const [updated] = await db
      .update(voiceCallSessionsTable)
      .set({ adminNotes: adminNotes ?? "", updatedAt: new Date() })
      .where(eq(voiceCallSessionsTable.token, req.params.token))
      .returning();
    await logCallEvent(session.id, req.params.token, "notes_updated", {
      metadata: { notesLength: (adminNotes ?? "").length },
    });
    res.json({ ok: true, adminNotes: updated.adminNotes });
  } catch {
    res.status(500).json({ error: "Failed to save notes" });
  }
});

router.post("/session/:token/transfer-to-agent", async (req, res) => {
  try {
    const [session] = await db
      .select()
      .from(voiceCallSessionsTable)
      .where(eq(voiceCallSessionsTable.token, req.params.token));
    if (!session) return res.status(404).json({ error: "Session not found" });
    const now = new Date();
    await db
      .update(voiceCallSessionsTable)
      .set({ agentTransferAt: now, updatedAt: now })
      .where(eq(voiceCallSessionsTable.token, req.params.token));
    await logCallEvent(session.id, req.params.token, "agent_transfer", {
      metadata: { transferredAt: now.toISOString() },
    });
    emitToCall(req.params.token, "call:agent_transfer", { token: req.params.token, at: now });
    res.json({ ok: true, transferredAt: now });
  } catch {
    res.status(500).json({ error: "Failed to log agent transfer" });
  }
});

router.post("/session/:token/end", async (req, res) => {
  try {
    const [session] = await db
      .select()
      .from(voiceCallSessionsTable)
      .where(eq(voiceCallSessionsTable.token, req.params.token));
    if (!session) return res.status(404).json({ error: "Session not found" });

    const now = new Date();
    const startedAt = session.callStartedAt ? new Date(session.callStartedAt) : new Date(session.createdAt!);
    const durationSeconds = Math.round((now.getTime() - startedAt.getTime()) / 1000);

    await db.update(voiceCallSessionsTable)
      .set({ callEndedAt: now, callDurationSeconds: durationSeconds, updatedAt: now })
      .where(eq(voiceCallSessionsTable.token, req.params.token));

    await logCallEvent(session.id, req.params.token, "call_ended", {
      metadata: { durationSeconds, reason: req.body.reason || "user_ended" },
    });
    emitToCall(req.params.token, "call:ended", { token: req.params.token });

    res.json({ ok: true, durationSeconds });
  } catch {
    res.status(500).json({ error: "Failed to end call" });
  }
});

router.get("/logs/:token", async (req, res) => {
  try {
    const logs = await db
      .select()
      .from(callLogsTable)
      .where(eq(callLogsTable.token, req.params.token))
      .orderBy(callLogsTable.createdAt);
    res.json(logs);
  } catch {
    res.status(500).json({ error: "Failed to get logs" });
  }
});

router.get("/analytics", async (_req, res) => {
  try {
    const sessions = await db.select().from(voiceCallSessionsTable);
    const logs = await db.select().from(callLogsTable);

    const total = sessions.length;
    const confirmed = sessions.filter(s => s.actionTaken === "confirmed").length;
    const cancelled = sessions.filter(s => s.actionTaken === "cancelled").length;
    const pending = sessions.filter(s => s.status === "pending").length;
    const active = sessions.filter(s => s.status === "active").length;
    const conversionRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;

    const withDuration = sessions.filter(s => s.callDurationSeconds != null && s.callDurationSeconds! > 0);
    const avgDuration = withDuration.length > 0
      ? Math.round(withDuration.reduce((sum, s) => sum + (s.callDurationSeconds || 0), 0) / withDuration.length)
      : 0;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayCount = sessions.filter(s => new Date(s.createdAt!) >= today).length;
    const todayConfirmed = sessions.filter(s => new Date(s.createdAt!) >= today && s.actionTaken === "confirmed").length;

    const keyPressLogs = logs.filter(l => l.event === "key_pressed");
    const keyDistribution: Record<string, number> = {};
    for (const log of keyPressLogs) {
      if (log.keyPressed) keyDistribution[log.keyPressed] = (keyDistribution[log.keyPressed] || 0) + 1;
    }

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setDate(end.getDate() + 1);
      const daySessions = sessions.filter(s => {
        const t = new Date(s.createdAt!);
        return t >= d && t < end;
      });
      return {
        date: d.toISOString().split("T")[0],
        total: daySessions.length,
        confirmed: daySessions.filter(s => s.actionTaken === "confirmed").length,
        cancelled: daySessions.filter(s => s.actionTaken === "cancelled").length,
      };
    }).reverse();

    res.json({
      total, confirmed, cancelled, pending, active, conversionRate,
      avgDuration, todayCount, todayConfirmed, keyDistribution, last7Days,
    });
  } catch {
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

router.get("/stats", async (_req, res) => {
  try {
    const sessions = await db.select().from(voiceCallSessionsTable);
    const total = sessions.length;
    const confirmed = sessions.filter(s => s.actionTaken === "confirmed").length;
    const cancelled = sessions.filter(s => s.actionTaken === "cancelled").length;
    const pending = sessions.filter(s => s.status === "pending").length;
    const completed = sessions.filter(s => s.status === "completed").length;
    const conversionRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayCount = sessions.filter(s => new Date(s.createdAt!) >= today).length;
    res.json({ total, confirmed, cancelled, pending, completed, conversionRate, todayCount });
  } catch {
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.get("/", async (_req, res) => {
  try {
    const sessions = await db.select().from(voiceCallSessionsTable).orderBy(voiceCallSessionsTable.createdAt);
    res.json(sessions.reverse());
  } catch {
    res.status(500).json({ error: "Failed to list sessions" });
  }
});

router.post("/:id/resend-webhook", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [session] = await db.select().from(voiceCallSessionsTable).where(eq(voiceCallSessionsTable.id, id));
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (!session.ecommerceWebhookUrl) return res.status(400).json({ error: "No webhook URL configured for this session" });
    if (session.status !== "completed") return res.status(400).json({ error: "Session not completed yet" });
    const result = await sendWebhook(session, session.actionTaken || "completed");
    await db.update(voiceCallSessionsTable)
      .set({ webhookSent: true, webhookResponse: result, updatedAt: new Date() })
      .where(eq(voiceCallSessionsTable.id, id));
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ error: "Failed to resend webhook" });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { actionTaken } = req.body as { actionTaken: string };
    if (!["confirmed", "cancelled"].includes(actionTaken)) return res.status(400).json({ error: "actionTaken must be confirmed or cancelled" });
    const dtmf = actionTaken === "confirmed" ? "1" : "2";
    const [updated] = await db.update(voiceCallSessionsTable)
      .set({ actionTaken, dtmfInput: dtmf, status: "completed", updatedAt: new Date() })
      .where(eq(voiceCallSessionsTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Session not found" });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update status" });
  }
});

router.delete("/bulk", async (req, res) => {
  try {
    const { ids } = req.body as { ids: number[] };
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "ids array required" });
    const { inArray } = await import("drizzle-orm");
    await db.delete(voiceCallSessionsTable).where(inArray(voiceCallSessionsTable.id, ids));
    res.json({ success: true, deleted: ids.length });
  } catch {
    res.status(500).json({ error: "Failed to bulk delete" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(voiceCallSessionsTable).where(eq(voiceCallSessionsTable.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete" });
  }
});

export { router as voiceCallsRouter };
