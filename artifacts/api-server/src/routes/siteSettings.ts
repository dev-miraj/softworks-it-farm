import { Router } from "express";
import { db } from "../lib/db.js";
import { siteSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

const router = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads", "settings");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".png";
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

function getBase(req: any): string {
  return process.env["PUBLIC_API_URL"]?.replace(/\/$/, "") ||
    `${req.protocol}://${req.headers.host}`;
}

async function getSettings() {
  const [settings] = await db.select().from(siteSettingsTable).limit(1);
  if (settings) return settings;
  const [inserted] = await db.insert(siteSettingsTable).values({ id: 1 }).returning();
  return inserted;
}

router.get("/settings", async (_req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (e) {
    res.status(500).json({ error: "Failed to load settings" });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const settings = await getSettings();
    const allowed = [
      "siteName", "logoUrl", "faviconUrl", "primaryColor",
      "contactEmail", "contactPhone", "address",
      "socialFacebook", "socialInstagram", "socialLinkedin", "socialTwitter",
      "footerText", "seoTitle", "seoDescription",
    ] as const;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of allowed) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }
    const [updated] = await db
      .update(siteSettingsTable)
      .set(update)
      .where(eq(siteSettingsTable.id, settings.id))
      .returning();
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to save settings" });
  }
});

router.post("/settings/upload-logo", upload.single("logo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const base = getBase(req);
    const logoUrl = `${base}/api/settings/logo/${req.file.filename}`;
    const settings = await getSettings();
    const [updated] = await db
      .update(siteSettingsTable)
      .set({ logoUrl, updatedAt: new Date() })
      .where(eq(siteSettingsTable.id, settings.id))
      .returning();
    res.json({ logoUrl, settings: updated });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Upload failed" });
  }
});

router.post("/settings/upload-favicon", upload.single("favicon"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const base = getBase(req);
    const faviconUrl = `${base}/api/settings/logo/${req.file.filename}`;
    const settings = await getSettings();
    const [updated] = await db
      .update(siteSettingsTable)
      .set({ faviconUrl, updatedAt: new Date() })
      .where(eq(siteSettingsTable.id, settings.id))
      .returning();
    res.json({ faviconUrl, settings: updated });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Upload failed" });
  }
});

router.get("/settings/logo/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
  res.sendFile(filePath);
});

export { router as siteSettingsRouter };
