/**
 * PROSODY & EMOTION ENGINE — Human-Level Voice System
 *
 * Edge TTS SSML constraints (reverse-engineered from testing):
 * ✅ Works: <speak><voice><prosody rate pitch volume>text</prosody></voice></speak>
 * ✗ Fails: <break> tags anywhere → 0 bytes
 * ✗ Fails: xmlns:mstts / mstts:express-as → 0 bytes
 * ✗ Fails: xmlns namespace → 0 bytes
 *
 * To maximize human-sounding quality within these constraints:
 * 1. Never change pitch (neural voice has natural intonation — overriding it sounds robotic)
 * 2. Minimal rate changes (±5–10% max)
 * 3. Natural punctuation in text creates organic pauses
 */

export type Emotion = "neutral" | "polite" | "happy" | "urgent" | "apology" | "professional";
export type VoiceLanguage = "bn-BD" | "en-US" | "mixed";
export type VoiceGender = "female" | "male";

export interface ProsodyConfig {
  rate: string;
  pitch: string;
  volume: string;
}

export interface EmotionConfig {
  prosody: ProsodyConfig;
  description: string;
}

export const EMOTION_CONFIGS: Record<Emotion, EmotionConfig> = {
  neutral: {
    prosody: { rate: "0%", pitch: "medium", volume: "medium" },
    description: "স্বাভাবিক কণ্ঠস্বর",
  },
  polite: {
    prosody: { rate: "-5%", pitch: "medium", volume: "medium" },
    description: "ভদ্র ও মার্জিত",
  },
  happy: {
    prosody: { rate: "+3%", pitch: "medium", volume: "medium" },
    description: "আনন্দিত ও উৎসাহী",
  },
  urgent: {
    prosody: { rate: "+10%", pitch: "medium", volume: "loud" },
    description: "দ্রুত ও জোরালো",
  },
  apology: {
    prosody: { rate: "-8%", pitch: "medium", volume: "soft" },
    description: "বিনীত ও ক্ষমাপ্রার্থী",
  },
  professional: {
    prosody: { rate: "-3%", pitch: "medium", volume: "medium" },
    description: "পেশাদার ও আস্থাশীল",
  },
};

/* ─── Voice profiles ─── */
export const VOICE_PROFILES: Record<VoiceLanguage, Record<VoiceGender, string[]>> = {
  "bn-BD": {
    female: ["bn-BD-NabanitaNeural"],
    male:   ["bn-BD-PradeepNeural"],
  },
  "en-US": {
    female: ["en-US-JennyNeural", "en-US-AriaNeural"],
    male:   ["en-US-GuyNeural"],
  },
  "mixed": {
    female: ["bn-BD-NabanitaNeural"],
    male:   ["bn-BD-PradeepNeural"],
  },
};

export interface VoiceProfile {
  name: string;
  language: VoiceLanguage;
  gender: VoiceGender;
  emotion: Emotion;
  displayName: string;
}

export const ALL_VOICES: VoiceProfile[] = [
  { name: "bn-BD-NabanitaNeural", language: "bn-BD", gender: "female", emotion: "polite",   displayName: "নবনীতা (বাংলা মহিলা)" },
  { name: "bn-BD-PradeepNeural",  language: "bn-BD", gender: "male",   emotion: "polite",   displayName: "প্রদীপ (বাংলা পুরুষ)" },
  { name: "en-US-JennyNeural",    language: "en-US", gender: "female", emotion: "neutral",  displayName: "জেনি (ইংরেজি মহিলা)" },
  { name: "en-US-GuyNeural",      language: "en-US", gender: "male",   emotion: "neutral",  displayName: "গাই (ইংরেজি পুরুষ)" },
  { name: "en-US-AriaNeural",     language: "en-US", gender: "female", emotion: "happy",    displayName: "আরিয়া (ইংরেজি মহিলা)" },
];

/* ─── Build SSML ─── */
export function buildSSML(text: string, emotion: Emotion, voiceName: string): string {
  const cfg = EMOTION_CONFIGS[emotion] || EMOTION_CONFIGS.neutral;
  const { rate, pitch, volume } = cfg.prosody;

  const lang = voiceName.startsWith("bn-") ? "bn-BD"
    : voiceName.startsWith("en-") ? "en-US"
    : "bn-BD";

  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  return `<speak version="1.0" xml:lang="${lang}"><voice name="${voiceName}"><prosody rate="${rate}" pitch="${pitch}" volume="${volume}">${escaped}</prosody></voice></speak>`;
}

/* ─── Alias for backwards compat ─── */
export const buildPlainSSML = buildSSML;

/* ─── Resolve voice name ─── */
export function resolveVoiceName(
  language: VoiceLanguage = "bn-BD",
  gender: VoiceGender = "female",
  customName?: string | null,
): string {
  if (customName && ALL_VOICES.some(v => v.name === customName)) return customName;
  const profiles = VOICE_PROFILES[language]?.[gender] || VOICE_PROFILES["bn-BD"].female;
  return profiles[0];
}

/* ─── Auto-detect emotion from text ─── */
export function detectEmotion(text: string): Emotion {
  if (/দুঃখিত|ক্ষমা|sorry|apolog/i.test(text)) return "apology";
  if (/ধন্যবাদ|অভিনন্দন|সাফল্য|সফল|congrat/i.test(text)) return "happy";
  if (/জরুরি|এখনই|তৎক্ষণাৎ|urgent|immediately/i.test(text)) return "urgent";
  if (/আস্সালাম|নমস্কার|স্বাগতম|welcome|hello/i.test(text)) return "polite";
  return "neutral";
}
