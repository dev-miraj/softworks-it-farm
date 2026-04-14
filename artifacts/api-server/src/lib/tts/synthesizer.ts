/**
 * NEURAL TTS SYNTHESIZER
 * Uses Microsoft Edge TTS (Neural voices — free, no API key)
 * Pipeline: Text → Preprocess → Emotion/SSML → EdgeTTS → Cache → Audio URL
 */
import path from "path";
import fs from "fs";
import { Readable } from "stream";
import { preprocessText } from "./preprocessor.js";
import {
  buildSSML, buildPlainSSML, resolveVoiceName, detectEmotion,
  type Emotion, type VoiceLanguage, type VoiceGender,
} from "./emotionEngine.js";
import {
  makeCacheKey, getCachedAudio, cacheAudio, getCacheDirUrl,
} from "./audioCache.js";

/* ─── msedge-tts import ─── */
let MsEdgeTTS: any;
let OUTPUT_FORMAT: any;

async function getEdgeTTS() {
  if (!MsEdgeTTS) {
    const mod = await import("msedge-tts");
    MsEdgeTTS = mod.MsEdgeTTS;
    OUTPUT_FORMAT = mod.OUTPUT_FORMAT;
  }
  return { MsEdgeTTS, OUTPUT_FORMAT };
}

/* ─── Uploads dir for serving ─── */
const UPLOADS_DIR = process.env.NODE_ENV === "production"
  ? path.join("/tmp", "uploads", "voice-calls")
  : path.resolve(process.cwd(), "uploads", "voice-calls");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/* ─── Read stream to buffer ─── */
function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

/* ─── TTS Request ─── */
export interface TtsRequest {
  text: string;
  voiceName?: string | null;
  language?: VoiceLanguage;
  gender?: VoiceGender;
  emotion?: Emotion | null;
  baseUrl: string;
  useCache?: boolean;
}

export interface TtsResult {
  url: string | null;
  filename: string | null;
  useBrowserTts: boolean;
  voice: string;
  emotion: string;
  cached: boolean;
  processedText: string;
}

/* ─── MAIN SYNTHESIZE FUNCTION ─── */
export async function synthesize(req: TtsRequest): Promise<TtsResult> {
  const {
    text,
    voiceName,
    language = "bn-BD",
    gender = "female",
    emotion: reqEmotion,
    baseUrl,
    useCache = true,
  } = req;

  if (!text?.trim()) throw new Error("text is required");

  const preprocessed = preprocessText(text);
  const processedText = preprocessed.processed;

  const resolvedVoice = resolveVoiceName(language, gender, voiceName);
  const emotion: Emotion = reqEmotion || detectEmotion(processedText);

  const cacheKey = makeCacheKey(processedText, resolvedVoice, emotion);

  if (useCache) {
    const cachedPath = getCachedAudio(cacheKey);
    if (cachedPath) {
      const url = getCacheDirUrl(baseUrl, cacheKey);
      return {
        url,
        filename: path.basename(cachedPath),
        useBrowserTts: false,
        voice: resolvedVoice,
        emotion,
        cached: true,
        processedText,
      };
    }
  }

  /* ─── Synthesize with express-as, fallback to plain SSML if 0 bytes ─── */
  async function doSynthesize(ssml: string): Promise<Buffer> {
    const { MsEdgeTTS: EdgeTTS, OUTPUT_FORMAT: FMT } = await getEdgeTTS();
    const tts = new EdgeTTS();
    await tts.setMetadata(resolvedVoice, FMT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const result = tts.rawToStream(ssml);
    return streamToBuffer(result.audioStream as Readable);
  }

  try {
    let ssml = buildSSML(processedText, emotion, resolvedVoice);
    let audioBuffer = await doSynthesize(ssml);

    if (audioBuffer.length < 1000 && ssml.includes("mstts:express-as")) {
      console.warn("[TTS] express-as returned empty audio, retrying with plain SSML");
      ssml = buildPlainSSML(processedText, emotion, resolvedVoice);
      audioBuffer = await doSynthesize(ssml);
    }

    if (audioBuffer.length < 100) throw new Error("TTS returned empty audio buffer");

    const cachedPath = cacheAudio(cacheKey, audioBuffer, {
      text: processedText,
      voice: resolvedVoice,
      emotion,
    });

    const url = getCacheDirUrl(baseUrl, cacheKey);
    return {
      url,
      filename: path.basename(cachedPath),
      useBrowserTts: false,
      voice: resolvedVoice,
      emotion,
      cached: false,
      processedText,
    };
  } catch (err) {
    console.error("[TTS] Edge TTS synthesis failed:", err);
    return {
      url: null,
      filename: null,
      useBrowserTts: true,
      voice: resolvedVoice,
      emotion,
      cached: false,
      processedText,
    };
  }
}

/* ─── Pre-warm cache with common phrases ─── */
export async function prewarmCache(baseUrl: string, voiceName?: string): Promise<void> {
  const { COMMON_PHRASES_BN } = await import("./audioCache.js");
  const voice = voiceName || "bn-BD-NabanitaNeural";

  for (const phrase of COMMON_PHRASES_BN) {
    try {
      await synthesize({ text: phrase, voiceName: voice, baseUrl, useCache: true });
    } catch (e) {
      console.warn("[TTS] Prewarm failed for phrase:", phrase, e);
    }
  }
  console.log("[TTS] Cache prewarmed with", COMMON_PHRASES_BN.length, "phrases");
}

/* ─── Serve cached audio buffer ─── */
export function getCachedBuffer(key: string): Buffer | null {
  const cachePath = getCachedAudio(key);
  if (!cachePath || !fs.existsSync(cachePath)) return null;
  return fs.readFileSync(cachePath);
}
