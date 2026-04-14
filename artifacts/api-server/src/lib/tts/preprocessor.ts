/**
 * TEXT PREPROCESSING ENGINE
 * Converts raw text → clean, pronounceable speech text
 * Supports: Bangla, English, Banglish (mixed)
 */

/* ─── Bangla digit map ─────────────────────────── */
const BN_DIGITS: Record<string, string> = {
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
};

const EN_DIGITS_BN: Record<string, string> = {
  "0": "শূন্য", "1": "এক", "2": "দুই", "3": "তিন", "4": "চার",
  "5": "পাঁচ", "6": "ছয়", "7": "সাত", "8": "আট", "9": "নয়",
};

const TENS_BN: Record<number, string> = {
  10: "দশ", 11: "এগারো", 12: "বারো", 13: "তেরো", 14: "চৌদ্দ",
  15: "পনেরো", 16: "ষোলো", 17: "সতেরো", 18: "আঠারো", 19: "উনিশ",
  20: "বিশ", 30: "ত্রিশ", 40: "চল্লিশ", 50: "পঞ্চাশ", 60: "ষাট",
  70: "সত্তর", 80: "আশি", 90: "নব্বই",
};

const UNITS_BN: Record<number, string> = {
  1: "এক", 2: "দুই", 3: "তিন", 4: "চার", 5: "পাঁচ",
  6: "ছয়", 7: "সাত", 8: "আট", 9: "নয়",
};

function numberToBangla(n: number): string {
  if (n === 0) return "শূন্য";
  if (n < 0) return "মাইনাস " + numberToBangla(-n);

  const parts: string[] = [];

  if (n >= 10000000) {
    parts.push(numberToBangla(Math.floor(n / 10000000)) + " কোটি");
    n %= 10000000;
  }
  if (n >= 100000) {
    parts.push(numberToBangla(Math.floor(n / 100000)) + " লাখ");
    n %= 100000;
  }
  if (n >= 1000) {
    parts.push(numberToBangla(Math.floor(n / 1000)) + " হাজার");
    n %= 1000;
  }
  if (n >= 100) {
    parts.push(numberToBangla(Math.floor(n / 100)) + " শো");
    n %= 100;
  }
  if (n > 0) {
    if (TENS_BN[n]) {
      parts.push(TENS_BN[n]);
    } else if (n >= 21) {
      const ten = Math.floor(n / 10) * 10;
      const unit = n % 10;
      parts.push((TENS_BN[ten] || "") + (UNITS_BN[unit] ? " " + UNITS_BN[unit] : ""));
    } else {
      parts.push(UNITS_BN[n] || String(n));
    }
  }

  return parts.join(" ");
}

/* ─── Convert Bangla numerals to Arabic ─── */
function normalizeBanglaDigits(text: string): string {
  return text.replace(/[০-৯]/g, c => BN_DIGITS[c] || c);
}

/* ─── Expand amount (টাকা / BDT / ৳) ─── */
function expandCurrency(text: string): string {
  return text
    .replace(/৳\s*([\d,]+)/g, (_, n) => {
      const num = parseInt(n.replace(/,/g, ""), 10);
      return numberToBangla(num) + " টাকা";
    })
    .replace(/([\d,]+)\s*(?:টাকা|BDT|taka)/gi, (_, n, suffix) => {
      const num = parseInt(n.replace(/,/g, ""), 10);
      return numberToBangla(num) + " " + (suffix.toLowerCase() === "bdt" ? "টাকা" : suffix);
    })
    .replace(/Tk\.?\s*([\d,]+)/gi, (_, n) => {
      const num = parseInt(n.replace(/,/g, ""), 10);
      return numberToBangla(num) + " টাকা";
    });
}

/* ─── Abbreviations ─── */
const ABBREV_MAP: [RegExp, string][] = [
  [/\bORD[-#]?(\w+)/gi, "অর্ডার নম্বর $1"],
  [/\bID[-#]?(\w+)/gi, "আইডি $1"],
  [/\bKG\b/gi, "কেজি"],
  [/\bGM\b/gi, "গ্রাম"],
  [/\bLTR?\b/gi, "লিটার"],
  [/\bPCS\b/gi, "পিস"],
  [/\bQTY\b/gi, "পরিমাণ"],
  [/\bDEL(?:IVERY)?\b/gi, "ডেলিভারি"],
  [/\bCOD\b/gi, "ক্যাশ অন ডেলিভারি"],
  [/\bBDT\b/gi, "টাকা"],
  [/\bURL|HTTP[S]?:\/\/\S+/gi, "ওয়েব লিংক"],
  [/\bAI\b/gi, "এআই"],
  [/\bAPI\b/gi, "এপিআই"],
];

/* ─── Phone number expansion ─── */
function expandPhone(text: string): string {
  return text.replace(/(\+?880|0)1[3-9]\d{8}/g, (match) => {
    return match.split("").map(c => EN_DIGITS_BN[c] || c).join(" ");
  });
}

/* ─── Expand standalone numbers ─── */
function expandNumbers(text: string): string {
  return text.replace(/\b(\d{1,9})\b/g, (_, n) => {
    const num = parseInt(n, 10);
    if (isNaN(num)) return n;
    return numberToBangla(num);
  });
}

/* ─── Punctuation to natural pauses ─── */
function normalizePunctuation(text: string): string {
  return text
    .replace(/[،,]/g, ", ")
    .replace(/[।.!?]+/g, ". ")
    .replace(/[:—–]/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/* ─── DTMF key → natural instruction ─── */
export function expandDtmfInstruction(text: string): string {
  return text
    .replace(/\b1\b.*?চাপুন/g, "এক চাপুন")
    .replace(/\b2\b.*?চাপুন/g, "দুই চাপুন")
    .replace(/\b3\b.*?চাপুন/g, "তিন চাপুন")
    .replace(/\bkey\s+(\d)\b/gi, (_, k) => EN_DIGITS_BN[k] + " চাবি চাপুন");
}

/* ─── MAIN EXPORT ─── */
export interface PreprocessedText {
  original: string;
  processed: string;
  language: "bn" | "en" | "mixed";
  hasNumbers: boolean;
  hasCurrency: boolean;
}

export function preprocessText(raw: string): PreprocessedText {
  const original = raw;
  let text = raw;

  const hasBangla = /[\u0980-\u09FF]/.test(text);
  const hasEnglish = /[a-zA-Z]/.test(text);
  const language: "bn" | "en" | "mixed" = hasBangla && hasEnglish ? "mixed" : hasBangla ? "bn" : "en";

  const hasCurrency = /[৳]|টাকা|BDT|Tk/i.test(text);
  const hasNumbers = /\d/.test(text);

  text = normalizeBanglaDigits(text);
  text = expandCurrency(text);

  for (const [re, replacement] of ABBREV_MAP) {
    text = text.replace(re, replacement);
  }

  text = expandPhone(text);
  if (hasBangla) {
    text = expandNumbers(text);
  }

  text = normalizePunctuation(text);

  return { original, processed: text, language, hasNumbers, hasCurrency };
}

/* ─── Cache-key generator ─── */
export function textToKey(text: string, voiceName: string, emotion: string): string {
  const crypto = require("crypto");
  const hash = crypto.createHash("md5").update(`${text}::${voiceName}::${emotion}`).digest("hex");
  return hash;
}
