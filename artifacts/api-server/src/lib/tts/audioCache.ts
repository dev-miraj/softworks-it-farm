/**
 * AUDIO CACHE SYSTEM
 * File-based cache for TTS audio outputs
 * Prevents re-generating same phrases
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";

const CACHE_DIR = process.env.NODE_ENV === "production"
  ? path.join("/tmp", "tts-cache")
  : path.resolve(process.cwd(), "uploads", "tts-cache");

const MAX_CACHE_SIZE = 200;
const CACHE_INDEX_FILE = path.join(CACHE_DIR, "_index.json");

interface CacheEntry {
  key: string;
  file: string;
  text: string;
  voice: string;
  emotion: string;
  createdAt: number;
  hits: number;
}

type CacheIndex = Record<string, CacheEntry>;

function ensureDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function loadIndex(): CacheIndex {
  try {
    if (fs.existsSync(CACHE_INDEX_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_INDEX_FILE, "utf8")) as CacheIndex;
    }
  } catch {}
  return {};
}

function saveIndex(index: CacheIndex) {
  try {
    fs.writeFileSync(CACHE_INDEX_FILE, JSON.stringify(index, null, 2));
  } catch {}
}

function evictOldest(index: CacheIndex) {
  const entries = Object.values(index).sort((a, b) => a.createdAt - b.createdAt);
  const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE + 10);
  for (const entry of toRemove) {
    try { fs.unlinkSync(path.join(CACHE_DIR, entry.file)); } catch {}
    delete index[entry.key];
  }
}

export function makeCacheKey(text: string, voice: string, emotion: string): string {
  return crypto.createHash("md5").update(`${text}|${voice}|${emotion}`).digest("hex");
}

export function getCachedAudio(key: string): string | null {
  ensureDir();
  const index = loadIndex();
  const entry = index[key];
  if (!entry) return null;
  const filePath = path.join(CACHE_DIR, entry.file);
  if (!fs.existsSync(filePath)) {
    delete index[key];
    saveIndex(index);
    return null;
  }
  entry.hits++;
  saveIndex(index);
  return filePath;
}

export function cacheAudio(
  key: string,
  audioBuffer: Buffer,
  meta: { text: string; voice: string; emotion: string },
): string {
  ensureDir();
  const index = loadIndex();

  if (Object.keys(index).length >= MAX_CACHE_SIZE) {
    evictOldest(index);
  }

  const filename = `tts-${key}.mp3`;
  const filePath = path.join(CACHE_DIR, filename);
  fs.writeFileSync(filePath, audioBuffer);

  index[key] = {
    key,
    file: filename,
    text: meta.text.slice(0, 100),
    voice: meta.voice,
    emotion: meta.emotion,
    createdAt: Date.now(),
    hits: 0,
  };
  saveIndex(index);
  return filePath;
}

export function getCacheDirUrl(baseUrl: string, key: string): string {
  return `${baseUrl}/api/voice-calls/tts-cache/${key}.mp3`;
}

export function getCacheStats(): { total: number; entries: CacheEntry[] } {
  const index = loadIndex();
  const entries = Object.values(index).sort((a, b) => b.hits - a.hits);
  return { total: entries.length, entries };
}

/* Serve cached audio file */
export function serveCachedFile(key: string): Buffer | null {
  ensureDir();
  const index = loadIndex();
  const entry = index[key];
  if (!entry) return null;
  const filePath = path.join(CACHE_DIR, entry.file);
  try {
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
}

/* Pre-warm cache with common phrases */
export const COMMON_PHRASES_BN = [
  "আস্সালামুআলাইকুম!",
  "ধন্যবাদ আপনার অর্ডারের জন্য।",
  "আপনার অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে।",
  "দুঃখিত, আপনার অর্ডারটি বাতিল করা হয়েছে।",
  "অর্ডার কনফার্ম করতে এক চাপুন, বাতিল করতে দুই চাপুন।",
  "আপনার সাথে কথা বলে ভালো লাগলো। আল্লাহ হাফেজ।",
];
