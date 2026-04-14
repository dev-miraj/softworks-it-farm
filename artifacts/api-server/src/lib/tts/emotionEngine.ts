/**
 * PROSODY & EMOTION ENGINE — Human-Level Voice System
 * Principle: Neural TTS has its own intelligent prosody. Less override = more natural.
 * Key insight: pitch overrides are the #1 cause of robotic sound in TTS.
 * For English voices: use Microsoft express-as styles (trained neural speaking styles)
 * For Bengali voices: minimal prosody, natural sentence breaks
 */

export type Emotion = "neutral" | "polite" | "happy" | "urgent" | "apology" | "professional";
export type VoiceLanguage = "bn-BD" | "en-US" | "mixed";
export type VoiceGender = "female" | "male";

export interface ProsodyConfig {
  rate: string;
  volume: string;
}

export interface EmotionConfig {
  prosody: ProsodyConfig;
  description: string;
}

/* ─── Emotion → prosody (minimal overrides for maximum naturalness) ─── */
export const EMOTION_CONFIGS: Record<Emotion, EmotionConfig> = {
  neutral: {
    prosody: { rate: "0%", volume: "medium" },
    description: "স্বাভাবিক কণ্ঠস্বর",
  },
  polite: {
    prosody: { rate: "-5%", volume: "medium" },
    description: "ভদ্র ও মার্জিত",
  },
  happy: {
    prosody: { rate: "+3%", volume: "medium" },
    description: "আনন্দিত ও উৎসাহী",
  },
  urgent: {
    prosody: { rate: "+10%", volume: "loud" },
    description: "দ্রুত ও জোরালো",
  },
  apology: {
    prosody: { rate: "-8%", volume: "soft" },
    description: "বিনীত ও ক্ষমাপ্রার্থী",
  },
  professional: {
    prosody: { rate: "-3%", volume: "medium" },
    description: "পেশাদার ও আস্থাশীল",
  },
};

/* ─── Microsoft Neural TTS express-as styles per emotion ─── */
/* These are pre-trained neural speaking styles — FAR more human than prosody overrides */
const EXPRESS_AS_STYLES: Record<string, Record<Emotion, string>> = {
  "en-US-JennyNeural": {
    neutral:      "assistant",
    polite:       "customerservice",
    happy:        "cheerful",
    urgent:       "excited",
    apology:      "empathetic",
    professional: "newscast",
  },
  "en-US-AriaNeural": {
    neutral:      "chat",
    polite:       "customerservice",
    happy:        "cheerful",
    urgent:       "excited",
    apology:      "empathetic",
    professional: "narration-professional",
  },
  "en-US-GuyNeural": {
    neutral:      "newscast",
    polite:       "newscast",
    happy:        "cheerful",
    urgent:       "newscast",
    apology:      "empathetic",
    professional: "newscast",
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

/* ─── Segment text into SSML sentences with natural breaks ─── */
function segmentWithBreaks(escapedText: string): string {
  // Split at sentence boundaries: ।  .  !  ?  followed by space or end
  const sentences = escapedText
    .split(/(?<=[।.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 2);

  if (sentences.length <= 1) return escapedText;

  // Join with natural pause breaks between sentences
  return sentences
    .map(s => `<s>${s}</s>`)
    .join('<break time="450ms"/>');
}

/* ─── Build human-level SSML ─── */
export function buildSSML(text: string, emotion: Emotion, voiceName: string): string {
  const cfg = EMOTION_CONFIGS[emotion] || EMOTION_CONFIGS.neutral;
  const { rate, volume } = cfg.prosody;

  const lang = voiceName.startsWith("bn-") ? "bn-BD"
    : voiceName.startsWith("en-") ? "en-US"
    : "bn-BD";

  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  const innerContent = segmentWithBreaks(escaped);

  const expressStyles = EXPRESS_AS_STYLES[voiceName];
  if (expressStyles && lang === "en-US") {
    const style = expressStyles[emotion] || "assistant";
    return [
      `<speak version="1.0" xml:lang="${lang}" xmlns:mstts="http://www.w3.org/2001/mstts">`,
      `<voice name="${voiceName}">`,
      `<mstts:express-as style="${style}" styledegree="1.2">`,
      `<prosody rate="${rate}" volume="${volume}">${innerContent}</prosody>`,
      `</mstts:express-as>`,
      `</voice></speak>`,
    ].join("");
  }

  return `<speak version="1.0" xml:lang="${lang}"><voice name="${voiceName}"><prosody rate="${rate}" volume="${volume}">${innerContent}</prosody></voice></speak>`;
}

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

/* ─── Plain SSML (no express-as) — used as fallback if express-as returns 0 bytes ─── */
export function buildPlainSSML(text: string, emotion: Emotion, voiceName: string): string {
  const cfg = EMOTION_CONFIGS[emotion] || EMOTION_CONFIGS.neutral;
  const { rate, volume } = cfg.prosody;
  const lang = voiceName.startsWith("bn-") ? "bn-BD"
    : voiceName.startsWith("en-") ? "en-US"
    : "bn-BD";
  const escaped = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  const innerContent = segmentWithBreaks(escaped);
  return `<speak version="1.0" xml:lang="${lang}"><voice name="${voiceName}"><prosody rate="${rate}" volume="${volume}">${innerContent}</prosody></voice></speak>`;
}

/* ─── Auto-detect emotion from text ─── */
export function detectEmotion(text: string): Emotion {
  if (/দুঃখিত|ক্ষমা|sorry|apolog/i.test(text)) return "apology";
  if (/ধন্যবাদ|অভিনন্দন|সাফল্য|সফল|congrat/i.test(text)) return "happy";
  if (/জরুরি|এখনই|তৎক্ষণাৎ|urgent|immediately/i.test(text)) return "urgent";
  if (/আস্সালাম|নমস্কার|স্বাগতম|welcome|hello/i.test(text)) return "polite";
  return "neutral";
}
