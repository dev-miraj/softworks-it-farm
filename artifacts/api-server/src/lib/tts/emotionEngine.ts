/**
 * PROSODY & EMOTION ENGINE
 * Maps emotions to SSML prosody parameters for Edge TTS
 */

export type Emotion = "neutral" | "polite" | "happy" | "urgent" | "apology" | "professional";
export type VoiceLanguage = "bn-BD" | "en-US" | "mixed";
export type VoiceGender = "female" | "male";

export interface ProsodyConfig {
  rate: string;   // SSML rate: "slow" | "medium" | "fast" | "-10%" ... "+20%"
  pitch: string;  // SSML pitch: "low" | "medium" | "high" | "+5Hz" | "-5Hz"
  volume: string; // SSML volume: "soft" | "medium" | "loud" | "x-loud" | "x-soft"
}

export interface EmotionConfig {
  prosody: ProsodyConfig;
  preText: string;
  postText: string;
  description: string;
}

/* ─── Emotion profiles ─── */
export const EMOTION_CONFIGS: Record<Emotion, EmotionConfig> = {
  neutral: {
    prosody: { rate: "-5%", pitch: "medium", volume: "medium" },
    preText: "",
    postText: "",
    description: "স্বাভাবিক কণ্ঠস্বর",
  },
  polite: {
    prosody: { rate: "-10%", pitch: "medium", volume: "medium" },
    preText: "",
    postText: "",
    description: "ভদ্র ও মার্জিত",
  },
  happy: {
    prosody: { rate: "+5%", pitch: "high", volume: "loud" },
    preText: "",
    postText: "",
    description: "আনন্দিত ও উৎসাহী",
  },
  urgent: {
    prosody: { rate: "+15%", pitch: "high", volume: "x-loud" },
    preText: "",
    postText: "",
    description: "দ্রুত ও জোরালো",
  },
  apology: {
    prosody: { rate: "-15%", pitch: "low", volume: "soft" },
    preText: "",
    postText: "",
    description: "বিনীত ও ক্ষমাপ্রার্থী",
  },
  professional: {
    prosody: { rate: "-8%", pitch: "medium", volume: "loud" },
    preText: "",
    postText: "",
    description: "পেশাদার ও আস্থাশীল",
  },
};

/* ─── Voice profiles by language + gender ─── */
export const VOICE_PROFILES: Record<VoiceLanguage, Record<VoiceGender, string[]>> = {
  "bn-BD": {
    female: ["bn-BD-NabanitaNeural"],
    male:   ["bn-BD-PradeepNeural"],
  },
  "en-US": {
    female: ["en-US-AnaNeural", "en-US-AriaNeural", "en-US-JennyNeural"],
    male:   ["en-US-GuyNeural", "en-US-ChristopherNeural"],
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

/* ─── All available voice options ─── */
export const ALL_VOICES: VoiceProfile[] = [
  { name: "bn-BD-NabanitaNeural", language: "bn-BD", gender: "female", emotion: "polite", displayName: "নবনীতা (বাংলা মহিলা)" },
  { name: "bn-BD-PradeepNeural",  language: "bn-BD", gender: "male",   emotion: "polite", displayName: "প্রদীপ (বাংলা পুরুষ)" },
  { name: "en-US-JennyNeural",    language: "en-US", gender: "female", emotion: "neutral", displayName: "জেনি (ইংরেজি মহিলা)" },
  { name: "en-US-GuyNeural",      language: "en-US", gender: "male",   emotion: "neutral", displayName: "গাই (ইংরেজি পুরুষ)" },
  { name: "en-US-AriaNeural",     language: "en-US", gender: "female", emotion: "happy",   displayName: "আরিয়া (ইংরেজি মহিলা)" },
];

/* ─── Build SSML from text + emotion ─── */
export function buildSSML(text: string, emotion: Emotion, voiceName: string): string {
  const cfg = EMOTION_CONFIGS[emotion] || EMOTION_CONFIGS.neutral;
  const { rate, pitch, volume } = cfg.prosody;

  const lang = voiceName.startsWith("bn-") ? "bn-BD"
    : voiceName.startsWith("en-") ? "en-US"
    : "bn-BD";

  const cleanText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  return `<speak version="1.0" xml:lang="${lang}"><voice name="${voiceName}"><prosody rate="${rate}" pitch="${pitch}" volume="${volume}">${cleanText}</prosody></voice></speak>`;
}

/* ─── Get voice name for profile ─── */
export function resolveVoiceName(
  language: VoiceLanguage = "bn-BD",
  gender: VoiceGender = "female",
  customName?: string | null,
): string {
  if (customName && ALL_VOICES.some(v => v.name === customName)) return customName;
  const profiles = VOICE_PROFILES[language]?.[gender] || VOICE_PROFILES["bn-BD"].female;
  return profiles[0];
}

/* ─── Detect emotion from text content ─── */
export function detectEmotion(text: string): Emotion {
  if (/দুঃখিত|ক্ষমা|sorry|apolog/i.test(text)) return "apology";
  if (/ধন্যবাদ|অভিনন্দন|সাফল্য|সফল|congrat/i.test(text)) return "happy";
  if (/জরুরি|এখনই|তৎক্ষণাৎ|urgent|immediately/i.test(text)) return "urgent";
  if (/আস্সালাম|নমস্কার|স্বাগতম|welcome|hello/i.test(text)) return "polite";
  return "neutral";
}
