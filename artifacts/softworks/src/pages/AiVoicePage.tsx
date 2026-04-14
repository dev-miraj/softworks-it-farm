import { useState, useEffect, useRef, useCallback } from "react";
import {
  Phone, PhoneOff, CheckCircle2, XCircle, Package, Loader2,
  MessageSquare, Volume2, Bot, Calendar, Headphones,
  Globe, Zap, ShoppingCart, BarChart3, Star, ArrowRight, Mic, MicOff,
  Users, Send
} from "lucide-react";
import { API } from "@/lib/apiUrl";

/* ─── Types ─────────────────────────────────── */
interface VoiceOption {
  key: string; label: string; action: string; responseText: string;
  responseAudioUrl: string | null; enabled: boolean;
}
interface Session {
  token: string; orderId: string; customerName: string | null;
  customerPhone: string | null; orderAmount: string | null;
  orderDetails: string | null; status: string;
}
interface Config {
  companyName: string; welcomeAudioUrl: string | null; welcomeText: string | null;
  announcementAudioUrl: string | null; announcementText: string | null;
  options: VoiceOption[];
}
type CallState = "idle" | "creating" | "ringing" | "accepting" | "connected" | "menu" | "processing" | "done" | "error";
type LiveState = "idle" | "connecting" | "ai-speaking" | "user-speaking" | "processing" | "done";
interface ChatMsg { role: "ai" | "user"; text: string; }

/* ─── Packages ───────────────────────────────── */
const PACKAGES = [
  { icon: MessageSquare, title: "মেসেজ অটো রিপ্লাই", desc: "ফেসবুক, হোয়াটসঅ্যাপ ও ইনস্টাগ্রামে গ্রাহকদের তৎক্ষণাৎ উত্তর।", color: "#4f46e5" },
  { icon: Zap, title: "কমেন্ট অটো রিপ্লাই", desc: "আপনার পোস্টের সকল কমেন্টে অটোমেটিক রিপ্লাই ও ইনবক্স সলিউশন।", color: "#f59e0b" },
  { icon: Phone, title: "AI ভয়েস কলিং সিস্টেম", desc: "মানুষের মতো কথা বলতে সক্ষম AI দিয়ে কাস্টমার সাপোর্ট ও সেলস কল।", color: "#00d4c8" },
  { icon: Volume2, title: "AI ভয়েস মেসেজ সিস্টেম", desc: "কাস্টমারদের সরাসরি ভয়েস মেসেজ পাঠিয়ে ব্যক্তিগত সংযোগ স্থাপন।", color: "#10b981" },
  { icon: ShoppingCart, title: "ওয়েবসাইট অর্ডার অটো কনফার্ম", desc: "অর্ডার আসার সাথে সাথে কাস্টমারকে কল বা মেসেজ দিয়ে কনফার্মেশন।", color: "#f97316" },
  { icon: BarChart3, title: "বিজনেস লিড ম্যানেজমেন্ট", desc: "সম্ভাব্য কাস্টমারদের ডাটাবেজ তৈরি ও ফলো-আপ অটোমেশন।", color: "#8b5cf6" },
  { icon: Calendar, title: "অটো শিডিউল ম্যানেজমেন্ট", desc: "আপনার মিটিং বা অ্যাপয়েন্টমেন্ট বুকিং অটোমেটিক হ্যান্ডেল করা।", color: "#ec4899" },
  { icon: Headphones, title: "টেকনিক্যাল সাপোর্ট", desc: "আপনার বিজনেসের জন্য সার্বক্ষণিক ২৪/৭ টেকনিক্যাল সাপোর্ট।", color: "#06b6d4" },
];

/* ─── AI Live Chat Responses ─────────────────── */
const AI_GREET = "আস্সালামুআলাইকুম! আমি সফটওয়ার্কস AI। আপনাকে কীভাবে সাহায্য করতে পারি?";
const AI_RESPONSES: [RegExp, string][] = [
  [/দাম|মূল্য|price|cost|কত/i, "আমাদের AI কলিং প্যাকেজ মাসে মাত্র ২,৫০০ টাকা থেকে শুরু। এন্টারপ্রাইজ প্ল্যানে আনলিমিটেড কল পাবেন।"],
  [/ফিচার|সুবিধা|feature|কী কী|কি কি/i, "আমাদের সিস্টেম বাংলায় কথা বলে, অর্ডার কনফার্ম করে, ২৪/৭ কাজ করে এবং আপনার ওয়েবসাইটের সাথে সংযুক্ত হয়।"],
  [/কীভাবে|কিভাবে|কাজ করে|how/i, "খুব সহজ! আপনার সাইটে আমাদের কোড বসান, অর্ডার হলে API call করুন — AI নিজেই কাস্টমারকে কল করে কনফার্ম নেবে।"],
  [/ধন্যবাদ|thanks|bye|আল্লাহ হাফেজ/i, "আপনার সাথে কথা বলে ভালো লাগলো! আমাদের সেবা নিতে contact@softworks.com.bd তে যোগাযোগ করুন। আল্লাহ হাফেজ!"],
  [/হ্যাঁ|okay|ok|ঠিক আছে|হা/i, "চমৎকার! আপনার জন্য একটি ফ্রি ট্রায়াল সেট আপ করতে পারি। আপনার ফোন নম্বর কি?"],
  [/না|no|নাই|নেই/i, "ঠিক আছে। অন্য কোনো প্রশ্ন থাকলে জিজ্ঞেস করুন। আমি সাহায্য করতে সদা প্রস্তুত।"],
];
function getAiResponse(text: string): string {
  for (const [re, resp] of AI_RESPONSES) { if (re.test(text)) return resp; }
  return "বুঝতে পেরেছি। আপনার আরো কোনো প্রশ্ন আছে কি?";
}

/* ─── Ringtone ───────────────────────────────── */
function useRingtone() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const runRef = useRef(false);

  const playBeep = useCallback((ctx: AudioContext) => {
    if (!runRef.current) return;
    const pairs = [[460, 380], [460, 380]];
    pairs.forEach(([f1, f2], idx) => {
      const off = idx * 0.6;
      [f1, f2].forEach(freq => {
        try {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.value = freq;
          o.connect(g); g.connect(ctx.destination);
          const t = ctx.currentTime + off;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.12, t + 0.03);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
          o.start(t); o.stop(t + 0.45);
        } catch {}
      });
    });
    timerRef.current = setTimeout(() => playBeep(ctx), 2600);
  }, []);

  const start = useCallback(() => {
    if (runRef.current) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      ctx.resume().then(() => {
        ctxRef.current = ctx;
        runRef.current = true;
        playBeep(ctx);
      });
    } catch {}
  }, [playBeep]);

  const stop = useCallback(() => {
    runRef.current = false;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    try { ctxRef.current?.close(); } catch {}
    ctxRef.current = null;
  }, []);

  return { start, stop };
}

/* ─── TTS ────────────────────────────────────── */
function speak(text: string, onEnd?: () => void) {
  if (!text?.trim()) { onEnd?.(); return; }
  window.speechSynthesis?.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.9; utt.pitch = 1.05; utt.volume = 1;
  const vs = window.speechSynthesis?.getVoices() || [];
  const isBn = /[\u0980-\u09FF]/.test(text);
  let v: SpeechSynthesisVoice | undefined;
  if (isBn) v = vs.find(x => x.lang.startsWith("bn")) || vs.find(x => x.lang.startsWith("en") && x.name.toLowerCase().includes("female"));
  if (!v) v = vs.find(x => x.lang.startsWith("en") && x.name.toLowerCase().includes("female")) || vs[0];
  if (v) utt.voice = v;
  if (onEnd) { utt.onend = onEnd; utt.onerror = onEnd; }
  window.speechSynthesis?.speak(utt);
}

/* ─── Animated Orb (AI avatar) ───────────────── */
function AiOrb({ mode }: { mode: "idle" | "speaking" | "listening" | "connecting" }) {
  const colors: Record<string, string[]> = {
    idle:       ["#1a1f35", "#252b40"],
    speaking:   ["#003d3a", "#00d4c8"],
    listening:  ["#1a2e1a", "#22c55e"],
    connecting: ["#2a1f00", "#f59e0b"],
  };
  const [c1, c2] = colors[mode];
  const glow = mode === "speaking" ? "0 0 60px rgba(0,212,200,0.5)" : mode === "listening" ? "0 0 60px rgba(34,197,94,0.5)" : mode === "connecting" ? "0 0 50px rgba(245,158,11,0.5)" : "none";

  return (
    <div style={{ position: "relative", width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {mode !== "idle" && (
        <>
          <div style={{ position: "absolute", inset: -20, borderRadius: "50%", background: `radial-gradient(circle, ${c2}15 0%, transparent 70%)`, animation: "orbPulse 2s ease-in-out infinite" }} />
          <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: `1.5px solid ${c2}40`, animation: "orbRing 2s ease-in-out infinite" }} />
        </>
      )}
      <div style={{
        width: 96, height: 96, borderRadius: "50%",
        background: `radial-gradient(circle at 40% 35%, ${c2}cc 0%, ${c1} 70%)`,
        boxShadow: glow,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
        animation: mode !== "idle" ? "orbFloat 3s ease-in-out infinite" : "none",
      }}>
        {mode === "speaking" && <Volume2 style={{ width: 38, height: 38, color: "#fff" }} />}
        {mode === "listening" && <Mic style={{ width: 38, height: 38, color: "#fff" }} />}
        {mode === "connecting" && <Phone style={{ width: 38, height: 38, color: "#fff" }} />}
        {mode === "idle" && <Bot style={{ width: 38, height: 38, color: "rgba(255,255,255,0.4)" }} />}
      </div>
    </div>
  );
}

/* ─── Waveform ───────────────────────────────── */
function Waveform({ active, color = "#00d4c8" }: { active: boolean; color?: string }) {
  const h = [0.4, 0.75, 1, 0.6, 0.88, 0.5, 0.82, 0.45, 0.7, 0.55, 0.65, 0.9];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3.5, height: 44 }}>
      {h.map((v, i) => (
        <div key={i} style={{
          width: 3.5, borderRadius: 4, background: color,
          height: active ? `${v * 40}px` : 4,
          opacity: active ? 0.6 + v * 0.4 : 0.15,
          animation: active ? `waveB 0.65s ease-in-out ${i * 0.065}s infinite alternate` : "none",
          transition: "height 0.3s ease",
        }} />
      ))}
    </div>
  );
}

/* ─── Ring Pulse ─────────────────────────────── */
function RingAvatar({ ringing }: { ringing: boolean }) {
  return (
    <div style={{ position: "relative", width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {ringing && (
        <>
          <div style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", border: "2px solid rgba(0,212,200,0.12)", animation: "ringPing 1.3s ease-out infinite" }} />
          <div style={{ position: "absolute", width: 128, height: 128, borderRadius: "50%", border: "2px solid rgba(0,212,200,0.22)", animation: "ringPing 1.3s ease-out 0.35s infinite" }} />
          <div style={{ position: "absolute", width: 105, height: 105, borderRadius: "50%", border: "2px solid rgba(0,212,200,0.32)", animation: "ringPing 1.3s ease-out 0.7s infinite" }} />
        </>
      )}
      <div style={{
        width: 88, height: 88, borderRadius: "50%",
        background: ringing ? "linear-gradient(135deg,#0d1a2e,#1a2840)" : "linear-gradient(135deg,#0d3f3c,#1a5c58)",
        border: `3px solid ${ringing ? "rgba(0,212,200,0.35)" : "#00d4c8"}`,
        boxShadow: ringing ? "0 0 25px rgba(0,212,200,0.2)" : "0 0 40px rgba(0,212,200,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: ringing ? "orbFloat 2s ease-in-out infinite" : "none",
      }}>
        <svg viewBox="0 0 24 24" style={{ width: 40, height: 40, color: ringing ? "rgba(255,255,255,0.55)" : "#00d4c8" }} fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>
    </div>
  );
}

/* ─── Demo Form Defaults ─────────────────────── */
const mkOrderId = () => "ORD-" + Math.floor(1000 + Math.random() * 9000);
const DEF_FORM = {
  orderId: mkOrderId(),
  customerName: "রাহিম সাহেব",
  customerPhone: "+8801712345678",
  orderAmount: "৳ ১,২০০",
  orderDetails: "১ কেজি খাঁটি মধু — ঘরেবাজারবিডি.কম | ডেলিভারি: ২-৩ দিন",
};

/* ─── Default fallback config — used when API returns no data ── */
function makeDemoConfig(orderId: string, orderAmount: string, orderDetails: string): Config {
  return {
    companyName: "SOFTWORKS IT FARM",
    welcomeAudioUrl: null,
    welcomeText: `আস্সালামুআলাইকুম! আমি সফটওয়ার্কস AI। আপনি ${orderDetails} অর্ডার করেছিলেন। অর্ডার নম্বর ${orderId}। মোট মূল্য ${orderAmount}।`,
    announcementAudioUrl: null,
    announcementText: "অর্ডারটি কনফার্ম করতে ১ চাপুন। বাতিল করতে ২ চাপুন।",
    options: [
      { key: "1", label: "অর্ডার কনফার্ম করুন", action: "confirmed", responseText: "ধন্যবাদ! আপনার অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে। আমরা শীঘ্রই ডেলিভারি দেব। আল্লাহ হাফেজ!", responseAudioUrl: null, enabled: true },
      { key: "2", label: "অর্ডার বাতিল করুন", action: "cancelled", responseText: "দুঃখিত! আপনার অর্ডারটি বাতিল করা হয়েছে। আপনার কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন।", responseAudioUrl: null, enabled: true },
    ],
  };
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
export function AiVoicePage() {

  /* ─── DTMF / Order Call state ───── */
  const [form, setForm] = useState(DEF_FORM);
  const [callState, setCallState] = useState<CallState>("idle");
  const [session, setSession] = useState<Session | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [chosen, setChosen] = useState<VoiceOption | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [aiPhase, setAiPhase] = useState<"speaking" | "listening">("speaking");
  const [aiText, setAiText] = useState("");
  const ringtone = useRingtone();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* ─── Live Voice Call state ─────── */
  const [liveState, setLiveState] = useState<LiveState>("idle");
  const [chatLog, setChatLog] = useState<ChatMsg[]>([]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognRef = useRef<SpeechRecognition | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  /* Guard flag — set false BEFORE abort() so handlers don't restart */
  const liveActiveRef = useRef(false);

  function stopAudio() {
    audioRef.current?.pause(); audioRef.current = null;
    window.speechSynthesis?.cancel();
  }

  function playAudio(url: string | null | undefined, onEnd?: () => void, fallback?: string | null) {
    stopAudio();
    if (url) {
      const a = new Audio(url); audioRef.current = a;
      if (onEnd) a.addEventListener("ended", onEnd, { once: true });
      a.play().catch(() => fallback ? speak(fallback, onEnd) : onEnd?.());
    } else if (fallback) {
      speak(fallback, onEnd);
    } else onEnd?.();
  }

  /* ─── DTMF call effects ─── */
  useEffect(() => {
    if (callState !== "menu") { setElapsed(0); return; }
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [callState]);

  useEffect(() => {
    if (callState !== "menu") return;
    const t = setInterval(() => setAiPhase(p => p === "speaking" ? "listening" : "speaking"), 5000);
    return () => clearInterval(t);
  }, [callState]);

  useEffect(() => {
    if (callState !== "menu" || !config) return;
    const opts = (config.options || []).filter(o => o.enabled !== false);
    const handler = (e: KeyboardEvent) => { const o = opts.find(x => x.key === e.key); if (o) handleRespond(o); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [callState, config]);

  async function createSession() {
    setCallState("creating");
    const demoConfig = makeDemoConfig(form.orderId, form.orderAmount, form.orderDetails);
    try {
      const r = await fetch(`${API}/api/voice-calls/initiate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: form.orderId, customerName: form.customerName, customerPhone: form.customerPhone, orderAmount: form.orderAmount, orderDetails: form.orderDetails }),
      });
      const d = await r.json();
      if (r.ok) {
        setSession(d.session || { token: d.token || "demo", ...form, status: "pending" });
        const apiCfg: Config | null = d.config ?? null;
        const hasOptions = apiCfg?.options && apiCfg.options.filter((o: VoiceOption) => o.enabled !== false).length > 0;
        setConfig(hasOptions ? apiCfg! : {
          ...demoConfig,
          welcomeText: apiCfg?.welcomeText || demoConfig.welcomeText,
          announcementText: apiCfg?.announcementText || demoConfig.announcementText,
        });
      } else {
        setSession({ token: "demo", ...form, status: "pending" });
        setConfig(demoConfig);
      }
    } catch {
      setSession({ token: "demo", ...form, status: "pending" });
      setConfig(demoConfig);
    }
    setChosen(null);
    setElapsed(0);
    setCallState("ringing");
    ringtone.start();
  }

  function acceptCall() {
    ringtone.stop();
    setCallState("accepting");
    setTimeout(() => {
      setCallState("connected");
      setTimeout(() => {
        setCallState("menu");
        setAiPhase("speaking");
        if (config) {
          setAiText(config.welcomeText || "");
          playAudio(config.welcomeAudioUrl, () => {
            setAiText(config.announcementText || "");
            setTimeout(() => playAudio(config.announcementAudioUrl, undefined, config.announcementText), 350);
          }, config.welcomeText);
        }
      }, 1600);
    }, 1900);
  }

  function rejectCall() { try { ringtone.stop(); stopAudio(); } catch {} resetCall(); }
  function endCall() { try { ringtone.stop(); stopAudio(); } catch {} resetCall(); }
  function resetCall() {
    setCallState("idle"); setSession(null); setChosen(null); setElapsed(0); setAiText("");
    setForm(f => ({ ...f, orderId: mkOrderId() }));
  }

  async function handleRespond(option: VoiceOption) {
    if (callState !== "menu") return;
    setCallState("processing");
    try {
      if (session?.token) {
        await fetch(`${API}/api/voice-calls/session/${session.token}/respond`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dtmf: option.key }),
        });
      }
    } catch {}
    setChosen(option);
    setAiText(option.responseText || "");
    speak(option.responseText);
    setCallState("done");
  }

  /* ─── Live Voice Call logic ─── */
  function startListening() {
    /* Guard: don't start if call has been ended */
    if (!liveActiveRef.current) return;

    const SR = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) { alert("আপনার browser speech recognition সাপোর্ট করে না। Chrome ব্যবহার করুন।"); return; }

    const rec = new SR();
    rec.lang = "bn-BD,bn,en-US";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onstart = () => {
      if (!liveActiveRef.current) { try { rec.abort(); } catch {} return; }
      setLiveState("user-speaking");
    };

    rec.onresult = (e) => {
      if (!liveActiveRef.current) return;
      const t = Array.from(e.results).map(r => r[0].transcript).join("");
      setLiveTranscript(t);
    };

    rec.onend = () => {
      /* CRITICAL: check guard FIRST before doing anything */
      if (!liveActiveRef.current) return;

      setLiveTranscript(currentTranscript => {
        const userText = currentTranscript.trim();
        if (userText) {
          setLiveTranscript("");
          setChatLog(l => [...l, { role: "user", text: userText }]);
          setLiveState("processing");
          setTimeout(() => {
            if (!liveActiveRef.current) return;
            const reply = getAiResponse(userText);
            setChatLog(l => [...l, { role: "ai", text: reply }]);
            setLiveState("ai-speaking");
            speak(reply, () => {
              if (!liveActiveRef.current) return;
              if (reply.includes("হাফেজ") || reply.includes("goodbye")) {
                liveActiveRef.current = false;
                setLiveState("done");
                return;
              }
              setTimeout(() => startListening(), 700);
            });
          }, 600);
        } else {
          if (!liveActiveRef.current) return;
          setLiveState("ai-speaking");
          setTimeout(() => startListening(), 500);
        }
        return currentTranscript;
      });
    };

    rec.onerror = (event) => {
      /* Guard: don't restart if user ended the call — this was the main bug */
      if (!liveActiveRef.current) return;
      /* Ignore "aborted" errors (caused by our own abort() calls) */
      if ((event as SpeechRecognitionErrorEvent).error === "aborted") return;
      setLiveState("ai-speaking");
      setTimeout(() => startListening(), 1000);
    };

    recognRef.current = rec;
    rec.start();
  }

  function startLiveCall() {
    liveActiveRef.current = true;
    setChatLog([]); setLiveTranscript("");
    setLiveState("connecting");
    setTimeout(() => {
      if (!liveActiveRef.current) return;
      setLiveState("ai-speaking");
      setChatLog([{ role: "ai", text: AI_GREET }]);
      speak(AI_GREET, () => {
        if (liveActiveRef.current) startListening();
      });
    }, 2000);
  }

  function endLiveCall(e?: React.MouseEvent | React.PointerEvent) {
    e?.stopPropagation();
    e?.preventDefault();
    /* Set guard to false FIRST — this prevents onerror/onend from restarting */
    liveActiveRef.current = false;
    /* Stop speech synthesis */
    try { window.speechSynthesis?.cancel(); } catch {}
    /* Abort recognition — onerror will fire but guard check will prevent restart */
    try {
      const rec = recognRef.current;
      recognRef.current = null;
      rec?.abort();
    } catch {}
    /* Show done screen */
    setLiveTranscript("");
    setLiveState("done");
  }

  function closeLiveDone() {
    setLiveState("idle");
    setChatLog([]);
  }

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatLog]);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const opts = (config?.options || []).filter(o => o.enabled !== false);
  const confirmOpt = opts.find(o => o.action === "confirmed");
  const cancelOpt = opts.find(o => o.action === "cancelled");
  const isCallActive = !["idle", "creating"].includes(callState);
  /* "done" also shows overlay so user sees the success/ended screen */
  const liveActive = liveState !== "idle";

  return (
    <>
      <style>{`
        @keyframes orbPulse { 0%,100%{transform:scale(1);opacity:0.8} 50%{transform:scale(1.15);opacity:0.4} }
        @keyframes orbRing { 0%,100%{transform:scale(1);opacity:0.7} 50%{transform:scale(1.08);opacity:0.3} }
        @keyframes orbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes waveB { 0%{transform:scaleY(0.25)} 100%{transform:scaleY(1)} }
        @keyframes ringPing { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(1.6);opacity:0} }
        @keyframes slideUp { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes ticker { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes btnGlow { 0%,100%{box-shadow:0 0 20px rgba(0,212,200,0.3)} 50%{box-shadow:0 0 50px rgba(0,212,200,0.7)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes progressBar { from{width:0%} to{width:100%} }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#05060e", color: "#fff", fontFamily: "system-ui,-apple-system,sans-serif", overflowX: "hidden" }}>

        {/* ══════ DTMF CALL OVERLAY ══════ */}
        {isCallActive && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            /* Solid base + gradient layered on top = always fully opaque */
            background: "radial-gradient(ellipse at 50% 15%, rgba(0,212,200,0.10) 0%, rgba(5,6,14,0) 60%), #05060e",
            display: "flex", flexDirection: "column", alignItems: "center",
            animation: "fadeIn 0.35s ease",
            overflowY: "auto",
          }}>
            {/* Step badge */}
            {(callState === "ringing" || callState === "accepting" || callState === "connected" || callState === "menu" || callState === "processing") && (
              <div style={{ position: "fixed", top: 18, left: 18, zIndex: 1, background: "rgba(0,212,200,0.12)", border: "1px solid rgba(0,212,200,0.3)", borderRadius: 20, padding: "4px 13px", fontSize: 12, color: "#00d4c8", fontWeight: 700, letterSpacing: "0.06em" }}>
                ⚡ {callState === "ringing" ? "ধাপ ১/৩" : callState === "accepting" || callState === "connected" ? "ধাপ ২/৩" : "ধাপ ৩/৩"}
              </div>
            )}
            {/* Timer */}
            {callState === "menu" && (
              <div style={{ position: "fixed", top: 18, right: 18, zIndex: 1, background: "rgba(239,68,68,0.14)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: "4px 13px", fontSize: 12, color: "#f87171", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                ⏱ {fmtTime(elapsed)}
              </div>
            )}

            <div style={{ width: "100%", maxWidth: 400, padding: "64px 20px 40px", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", gap: 24 }}>

              {/* ── RINGING ── */}
              {callState === "ringing" && (
                <>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}>
                    <RingAvatar ringing />
                    <div style={{ textAlign: "center" }}>
                      <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: "#fff" }}>SOFTWORKS AI</h2>
                      <p style={{ margin: 0, fontFamily: "monospace", color: "rgba(255,255,255,0.45)", fontSize: 15 }}>{form.customerPhone}</p>
                      <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(0,212,200,0.08)", border: "1px solid rgba(0,212,200,0.2)", borderRadius: 20, padding: "5px 14px" }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00d4c8", display: "inline-block", animation: "ticker 1.2s ease-in-out infinite" }} />
                        <span style={{ fontSize: 12, color: "#00d4c8", fontWeight: 700, letterSpacing: "0.18em" }}>INCOMING WEB CALL</span>
                      </div>
                      <p style={{ marginTop: 12, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>রিং হচ্ছে — কল রিসিভ করুন</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 60, justifyContent: "center", paddingBottom: 20 }}>
                    <button onClick={rejectCall} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}>
                      <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(239,68,68,0.9)", boxShadow: "0 0 30px rgba(239,68,68,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <PhoneOff style={{ width: 28, height: 28, color: "#fff" }} />
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, letterSpacing: "0.15em" }}>REJECT</span>
                    </button>
                    <button onClick={acceptCall} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}>
                      <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(16,185,129,0.9)", boxShadow: "0 0 40px rgba(16,185,129,0.55)", display: "flex", alignItems: "center", justifyContent: "center", animation: "btnGlow 1.8s ease-in-out infinite" }}>
                        <Phone style={{ width: 28, height: 28, color: "#fff" }} />
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, letterSpacing: "0.15em" }}>ACCEPT</span>
                    </button>
                  </div>
                </>
              )}

              {/* ── ACCEPTING (Yellow phone animation) ── */}
              {callState === "accepting" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}>
                  <div style={{ width: 96, height: 96, borderRadius: "50%", background: "radial-gradient(circle at 40% 35%, #fbbf24, #f59e0b)", boxShadow: "0 0 60px rgba(245,158,11,0.55)", display: "flex", alignItems: "center", justifyContent: "center", animation: "orbFloat 1.4s ease-in-out infinite" }}>
                    <Phone style={{ width: 42, height: 42, color: "#fff" }} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 10px" }}>কল কানেক্ট হচ্ছে...</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.6 }}>রিং হচ্ছে, প্রতিনিধি কলটি রিসিভ করার জন্য তৈরি...</p>
                  </div>
                  <button onClick={endCall} onPointerDown={() => endCall()} style={{ background: "rgba(239,68,68,0.75)", border: "2px solid rgba(239,68,68,0.6)", borderRadius: 50, padding: "13px 36px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, touchAction: "manipulation" }}>
                    <PhoneOff style={{ width: 16, height: 16 }} /> কল শেষ করুন
                  </button>
                </div>
              )}

              {/* ── CONNECTED (brief) ── */}
              {callState === "connected" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
                  <RingAvatar ringing={false} />
                  <div style={{ textAlign: "center" }}>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>SOFTWORKS AI</h2>
                    <p style={{ color: "#00d4c8", fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", margin: 0 }}>সংযুক্ত হচ্ছে...</p>
                  </div>
                  <Waveform active />
                </div>
              )}

              {/* ── MENU (AI speaking + DTMF options) ── */}
              {callState === "menu" && config && (
                <>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, width: "100%" }}>
                    <AiOrb mode={aiPhase === "speaking" ? "speaking" : "listening"} />

                    <div style={{ textAlign: "center" }}>
                      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
                        {aiPhase === "speaking" ? "এআই কথা বলছে..." : "আপনার কথা শুনছি..."}
                      </h2>
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: 0 }}>
                        {aiPhase === "speaking" ? "এআই এখন আপনার সাথে কথা বলছে।" : "এআই এখন আপনার উত্তরের জন্য অপেক্ষা করছে।"}
                      </p>
                    </div>

                    <Waveform active={aiPhase === "speaking"} />

                    {/* AI transcript */}
                    {aiText && (
                      <div style={{ width: "100%", borderRadius: 14, padding: "12px 16px", background: "rgba(0,212,200,0.06)", border: "1px solid rgba(0,212,200,0.15)", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.65, fontStyle: "italic" }}>
                        "{aiText}"
                      </div>
                    )}

                    {/* Order card */}
                    <div style={{ width: "100%", borderRadius: 16, padding: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                        <Package style={{ width: 13, height: 13, color: "rgba(255,255,255,0.3)" }} />
                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0, letterSpacing: "0.1em" }}>অর্ডার #{session?.orderId || form.orderId}</p>
                      </div>
                      <p style={{ color: "#fff", fontWeight: 700, margin: "0 0 4px" }}>{session?.orderAmount || form.orderAmount}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>{session?.orderDetails || form.orderDetails}</p>
                    </div>

                    {/* DTMF Action Buttons — always visible */}
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, animation: "slideUp 0.4s ease" }}>
                      {confirmOpt && (
                        <button onClick={() => handleRespond(confirmOpt)} style={{ width: "100%", borderRadius: 16, border: "none", background: "linear-gradient(135deg,#00d4c8,#00a89e)", padding: "16px 20px", color: "#000", fontSize: 16, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, boxShadow: "0 0 35px rgba(0,212,200,0.4)" }}>
                          <span style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900 }}>১</span>
                          {confirmOpt.label || "অর্ডার কনফার্ম করুন"}
                        </button>
                      )}
                      {cancelOpt && (
                        <button onClick={() => handleRespond(cancelOpt)} style={{ width: "100%", borderRadius: 16, background: "rgba(239,68,68,0.12)", outline: "1px solid rgba(239,68,68,0.35)", border: "none", padding: "16px 20px", color: "#f87171", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                          <span style={{ background: "rgba(239,68,68,0.25)", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900 }}>২</span>
                          {cancelOpt.label || "অর্ডার বাতিল করুন"}
                        </button>
                      )}
                      {opts.filter(o => o.action !== "confirmed" && o.action !== "cancelled").map(opt => (
                        <button key={opt.key} onClick={() => handleRespond(opt)} style={{ width: "100%", borderRadius: 16, background: "rgba(139,92,246,0.12)", outline: "1px solid rgba(139,92,246,0.35)", border: "none", padding: "15px 20px", color: "#a78bfa", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                          <span style={{ background: "rgba(139,92,246,0.25)", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900 }}>{opt.key}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={endCall} onPointerDown={() => endCall()} style={{ background: "rgba(239,68,68,0.75)", border: "2px solid rgba(239,68,68,0.6)", borderRadius: 50, padding: "12px 30px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, touchAction: "manipulation" }}>
                    <PhoneOff style={{ width: 15, height: 15 }} /> কল শেষ করুন
                  </button>
                </>
              )}

              {/* ── PROCESSING ── */}
              {callState === "processing" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(0,212,200,0.1)", border: "3px solid rgba(0,212,200,0.4)", boxShadow: "0 0 40px rgba(0,212,200,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Loader2 style={{ width: 32, height: 32, color: "#00d4c8", animation: "spin 1s linear infinite" }} />
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", fontSize: 14 }}>প্রক্রিয়াকরণ হচ্ছে...</p>
                </div>
              )}

              {/* ── DONE ── */}
              {callState === "done" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, width: "100%", animation: "slideUp 0.5s ease" }}>
                  <div style={{ width: 100, height: 100, borderRadius: "50%", background: chosen?.action === "confirmed" ? "rgba(0,212,200,0.1)" : "rgba(239,68,68,0.1)", border: `3px solid ${chosen?.action === "confirmed" ? "rgba(0,212,200,0.5)" : "rgba(239,68,68,0.4)"}`, boxShadow: `0 0 50px ${chosen?.action === "confirmed" ? "rgba(0,212,200,0.3)" : "rgba(239,68,68,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {chosen?.action === "confirmed" ? <CheckCircle2 style={{ width: 46, height: 46, color: "#00d4c8" }} /> : <XCircle style={{ width: 46, height: 46, color: "#f87171" }} />}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 10px", color: chosen?.action === "cancelled" ? "#f87171" : "#fff" }}>{chosen?.label || "সম্পন্ন"}</h2>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.7, maxWidth: 300 }}>{chosen?.responseText || "আপনার উত্তর রেকর্ড হয়েছে।"}</p>
                  </div>
                  <div style={{ width: "100%", borderRadius: 16, padding: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: "0 0 4px" }}>অর্ডার #{session?.orderId || form.orderId}</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>SOFTWORKS AI কলিং সিস্টেম</p>
                  </div>
                  <button onClick={endCall} style={{ background: "rgba(0,212,200,0.1)", border: "1px solid rgba(0,212,200,0.3)", borderRadius: 50, padding: "13px 32px", color: "#00d4c8", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    ← আবার চেষ্টা করুন
                  </button>
                </div>
              )}

              {/* ── ERROR ── */}
              {callState === "error" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <XCircle style={{ width: 36, height: 36, color: "#f87171" }} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <h2 style={{ color: "#fff", fontSize: 20, margin: "0 0 8px" }}>সংযোগ ব্যর্থ</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Session তৈরি করা যায়নি। আবার চেষ্টা করুন।</p>
                  </div>
                  <button onClick={endCall} style={{ background: "rgba(0,212,200,0.1)", border: "1px solid rgba(0,212,200,0.3)", borderRadius: 50, padding: "13px 32px", color: "#00d4c8", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>ফিরে যান</button>
                </div>
              )}

              {/* ── CREATING ── */}
              {callState === "creating" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(0,212,200,0.1)", border: "3px solid rgba(0,212,200,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Loader2 style={{ width: 32, height: 32, color: "#00d4c8", animation: "spin 1s linear infinite" }} />
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>কল সেশন তৈরি হচ্ছে...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════ LIVE AI VOICE CALL OVERLAY ══════ */}
        {liveActive && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "radial-gradient(ellipse at 50% 10%, rgba(99,102,241,0.12) 0%, rgba(5,6,14,0) 60%), #05060e", display: "flex", flexDirection: "column", alignItems: "center", animation: "fadeIn 0.35s ease" }}>
            <div style={{ width: "100%", maxWidth: 440, padding: "20px 20px 32px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                <div style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 20, padding: "4px 13px", fontSize: 12, color: "#818cf8", fontWeight: 700 }}>
                  ⚡ সরাসরি ভয়েজ কল
                </div>
                {liveState === "user-speaking" || liveState === "ai-speaking" ? (
                  <div style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 20, padding: "4px 13px", fontSize: 12, color: "#4ade80", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "ticker 1s ease-in-out infinite" }} />
                    LIVE
                  </div>
                ) : null}
              </div>

              {/* ── DONE / CALL ENDED SUCCESS SCREEN ── */}
              {liveState === "done" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, animation: "slideUp 0.4s ease", textAlign: "center" }}>
                  {/* Checkmark circle */}
                  <div style={{ width: 110, height: 110, borderRadius: "50%", background: "radial-gradient(circle at 40% 35%, rgba(0,212,200,0.6) 0%, rgba(0,150,130,0.3) 70%)", border: "3px solid rgba(0,212,200,0.6)", boxShadow: "0 0 60px rgba(0,212,200,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle2 style={{ width: 52, height: 52, color: "#00d4c8" }} />
                  </div>
                  {/* Message */}
                  <div>
                    <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 10px", color: "#fff" }}>কল সফলভাবে শেষ হয়েছে</h2>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, lineHeight: 1.7, maxWidth: 300, margin: "0 auto" }}>
                      SOFTWORKS AI-এর সাথে আপনার কথোপকথন সম্পন্ন হয়েছে। আমাদের সেবা নিতে আগ্রহী হলে যোগাযোগ করুন।
                    </p>
                  </div>
                  {/* Summary of conversation */}
                  {chatLog.length > 0 && (
                    <div style={{ width: "100%", borderRadius: 16, padding: "14px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", textAlign: "left" }}>
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "0 0 8px", letterSpacing: "0.1em", fontWeight: 600 }}>কথোপকথনের সারসংক্ষেপ</p>
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>{chatLog.length} টি বার্তা বিনিময় হয়েছে।</p>
                    </div>
                  )}
                  {/* Actions */}
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                    <button
                      onClick={closeLiveDone}
                      onPointerDown={closeLiveDone}
                      style={{ width: "100%", background: "linear-gradient(135deg,#00d4c8,#00a89e)", border: "none", borderRadius: 50, padding: "15px 30px", color: "#000", fontSize: 15, fontWeight: 800, cursor: "pointer", touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}>
                      ← আবার চেষ্টা করুন
                    </button>
                    <a href="/contact" style={{ width: "100%", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 50, padding: "15px 30px", color: "#818cf8", fontSize: 15, fontWeight: 600, cursor: "pointer", textAlign: "center", textDecoration: "none", display: "block", boxSizing: "border-box" }}>
                      আমাদের সাথে যোগাযোগ করুন
                    </a>
                  </div>
                </div>
              )}

              {/* ── ACTIVE CALL CONTENT ── */}
              {liveState !== "done" && (
                <>
                  {/* AI Orb */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginBottom: 20 }}>
                    <AiOrb mode={liveState === "connecting" ? "connecting" : liveState === "ai-speaking" ? "speaking" : liveState === "user-speaking" ? "listening" : "idle"} />
                    <div style={{ textAlign: "center" }}>
                      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
                        {liveState === "connecting" ? "কল কানেক্ট হচ্ছে..." : liveState === "ai-speaking" ? "এআই কথা বলছে..." : liveState === "user-speaking" ? "আপনার কথা শুনছি..." : liveState === "processing" ? "প্রক্রিয়াকরণ..." : "SOFTWORKS AI"}
                      </h2>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                        {liveState === "connecting" ? "সংযোগ স্থাপিত হচ্ছে..." : liveState === "ai-speaking" ? "AI এখন আপনার সাথে কথা বলছে।" : liveState === "user-speaking" ? "আপনার কথা বলুন — AI শুনছে।" : ""}
                      </p>
                    </div>
                    <Waveform active={liveState === "ai-speaking"} color={liveState === "user-speaking" ? "#22c55e" : "#00d4c8"} />
                  </div>

                  {/* Live transcript (user speaking) */}
                  {liveTranscript && (
                    <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 12, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", fontSize: 13, color: "#4ade80", fontStyle: "italic" }}>
                      🎙 "{liveTranscript}"
                    </div>
                  )}

                  {/* Chat log */}
                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, marginBottom: 16, maxHeight: 300, paddingRight: 4 }}>
                    {chatLog.map((msg, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", animation: "slideUp 0.3s ease" }}>
                        <div style={{
                          maxWidth: "82%", padding: "10px 14px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          background: msg.role === "user" ? "rgba(99,102,241,0.18)" : "rgba(0,212,200,0.1)",
                          border: msg.role === "user" ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(0,212,200,0.2)",
                          fontSize: 14, color: "#fff", lineHeight: 1.6,
                        }}>
                          {msg.role === "ai" && <p style={{ fontSize: 10, color: "#00d4c8", margin: "0 0 4px", fontWeight: 700, letterSpacing: "0.08em" }}>SOFTWORKS AI</p>}
                          {msg.role === "user" && <p style={{ fontSize: 10, color: "#818cf8", margin: "0 0 4px", fontWeight: 700, letterSpacing: "0.08em" }}>আপনি</p>}
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* End call button */}
                  <button
                    onClick={endLiveCall}
                    onPointerDown={endLiveCall}
                    onTouchStart={e => { e.stopPropagation(); }}
                    style={{ width: "100%", background: "rgba(239,68,68,0.85)", border: "2px solid rgba(239,68,68,0.7)", borderRadius: 50, padding: "16px 30px", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 4px 24px rgba(239,68,68,0.35)", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}>
                    <PhoneOff style={{ width: 20, height: 20 }} /> কল শেষ করুন
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══════ LANDING PAGE ══════ */}
        {/* Header */}
        <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(5,6,14,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#00d4c8,#0096c7)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(0,212,200,0.4)" }}>
              <Bot style={{ width: 20, height: 20, color: "#fff" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 900, fontSize: 15, letterSpacing: "0.03em" }}>SOFTWORKS</p>
              <p style={{ margin: 0, fontSize: 11, color: "#00d4c8", letterSpacing: "0.1em" }}>AI CALLING SYSTEM</p>
            </div>
          </div>
          <a href="/" style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none" }}>← হোমে যান</a>
        </header>

        {/* Hero */}
        <section style={{ textAlign: "center", padding: "80px 24px 64px", background: "radial-gradient(ellipse at 50% 0%, rgba(0,212,200,0.07) 0%, transparent 65%)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,212,200,0.08)", border: "1px solid rgba(0,212,200,0.2)", borderRadius: 20, padding: "5px 14px", marginBottom: 24, fontSize: 12, color: "#00d4c8", fontWeight: 600, letterSpacing: "0.08em" }}>
            <Star style={{ width: 12, height: 12 }} /> বাংলাদেশের সেরা AI কলিং প্ল্যাটফর্ম
          </div>
          <h1 style={{ fontSize: "clamp(30px,6vw,54px)", fontWeight: 900, margin: "0 0 16px", lineHeight: 1.15, background: "linear-gradient(135deg,#fff 0%,#00d4c8 55%,#6366f1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundSize: "200% auto", animation: "shimmer 4s linear infinite" }}>
            AI ভয়েস কলিং সিস্টেম
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "clamp(14px,2.5vw,18px)", maxWidth: 540, margin: "0 auto 40px", lineHeight: 1.75 }}>
            মানুষের মতো বাংলায় কথা বলে অর্ডার কনফার্ম করে, গ্রাহক সেবা দেয় এবং সেলস করে — সম্পূর্ণ অটোমেটিক।
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {[{ icon: Globe, text: "২৪/৭ অটোমেটিক কল" }, { icon: Zap, text: "তৎক্ষণাৎ সক্রিয়" }, { icon: BarChart3, text: "রিয়েল-টাইম রিপোর্ট" }, { icon: Users, text: "মাল্টি-টেনেন্ট সাপোর্ট" }].map(({ icon: I, text }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "7px 14px", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                <I style={{ width: 14, height: 14, color: "#00d4c8" }} />{text}
              </div>
            ))}
          </div>
        </section>

        {/* Packages */}
        <section style={{ padding: "64px 24px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, margin: "0 0 10px" }}>আমাদের প্যাকেজসমূহ</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, margin: 0 }}>আপনার বিজনেসের জন্য সঠিক সমাধান বেছে নিন</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16 }}>
            {PACKAGES.map(({ icon: I, title, desc, color }, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px", cursor: "default", transition: "transform 0.22s,border-color 0.22s,box-shadow 0.22s" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-5px)"; el.style.borderColor = `${color}50`; el.style.boxShadow = `0 8px 32px ${color}30`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.borderColor = "rgba(255,255,255,0.07)"; el.style.boxShadow = "none"; }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <I style={{ width: 22, height: 22, color }} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 8px", color: "#fff" }}>{title}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Live AI Voice Call Section */}
        <section style={{ padding: "0 24px 64px", maxWidth: 900, margin: "0 auto", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 64 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20, padding: "5px 14px", marginBottom: 16, fontSize: 12, color: "#818cf8", fontWeight: 600 }}>
              <Mic style={{ width: 12, height: 12 }} /> সরাসরি এআই ভয়েজ কল
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 12px" }}>AI-এর সাথে সরাসরি কথা বলুন</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
              এআই-এর সাথে সরাসরি মানুষের মতো বাংলায় কথা বলে দেখুন এটি কতটা স্মার্ট এবং কার্যকর।
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 24, overflow: "hidden" }}>
            {/* Chat preview (static) */}
            <div style={{ padding: "28px 28px 0" }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#00d4c8,#0096c7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bot style={{ width: 18, height: 18, color: "#fff" }} />
                </div>
                <div style={{ background: "rgba(0,212,200,0.08)", border: "1px solid rgba(0,212,200,0.15)", borderRadius: "16px 16px 16px 4px", padding: "12px 16px", fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.65, maxWidth: "80%" }}>
                  <p style={{ fontSize: 11, color: "#00d4c8", fontWeight: 700, letterSpacing: "0.08em", margin: "0 0 5px" }}>SOFTWORKS AI</p>
                  আস্সালামুআলাইকুম! আমি সফটওয়ার্কস AI। আপনাকে কীভাবে সাহায্য করতে পারি?
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginBottom: 16 }}>
                <div style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "16px 16px 4px 16px", padding: "12px 16px", fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.65, maxWidth: "80%" }}>
                  <p style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, letterSpacing: "0.08em", margin: "0 0 5px" }}>আপনি</p>
                  আপনাদের AI কলিং সিস্টেমের দাম কত?
                </div>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Users style={{ width: 18, height: 18, color: "#818cf8" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#00d4c8,#0096c7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bot style={{ width: 18, height: 18, color: "#fff" }} />
                </div>
                <div style={{ background: "rgba(0,212,200,0.08)", border: "1px solid rgba(0,212,200,0.15)", borderRadius: "16px 16px 16px 4px", padding: "12px 16px", fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.65, maxWidth: "80%" }}>
                  <p style={{ fontSize: 11, color: "#00d4c8", fontWeight: 700, letterSpacing: "0.08em", margin: "0 0 5px" }}>SOFTWORKS AI</p>
                  আমাদের AI কলিং প্যাকেজ মাসে মাত্র ২,৫০০ টাকা থেকে শুরু। এন্টারপ্রাইজ প্ল্যানে আনলিমিটেড কল পাবেন।
                </div>
              </div>
            </div>

            <div style={{ padding: "0 28px 28px" }}>
              <button onClick={startLiveCall} style={{ width: "100%", padding: "18px 24px", background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", borderRadius: 16, color: "#fff", fontSize: 17, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 0 40px rgba(99,102,241,0.4)", letterSpacing: "0.02em", transition: "transform 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
                <Mic style={{ width: 22, height: 22 }} />
                কল শুরু করুন
                <ArrowRight style={{ width: 18, height: 18 }} />
              </button>
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 12 }}>Chrome browser-এ microphone permission দিন</p>
            </div>
          </div>
        </section>

        {/* Order Auto Confirm Interactive Demo */}
        <section style={{ padding: "0 24px 64px", maxWidth: 900, margin: "0 auto", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 64 }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,212,200,0.08)", border: "1px solid rgba(0,212,200,0.2)", borderRadius: 20, padding: "5px 14px", marginBottom: 16, fontSize: 12, color: "#00d4c8", fontWeight: 600 }}>
              <Zap style={{ width: 12, height: 12 }} /> Interactive Order Experience
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 12px" }}>অর্ডার অটোমেশন সেশন</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
              ওয়েবসাইট থেকে অর্ডার আসার পর AI কীভাবে অটোমেটিক কল দিয়ে তা ভেরিফাই করে, তা এখনই লাইভ টেস্ট করুন।
            </p>
          </div>

          {/* 3 Steps */}
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 40, flexWrap: "wrap" }}>
            {[{ n: "০১", t: "অর্ডার প্লেস করুন", d: "নিচের ফর্মে তথ্য দিয়ে একটি ডামি অর্ডার করুন।" }, { n: "০২", t: "এআই কল রিসিভ করুন", d: "আপনার স্ক্রিনে একটি ইনকামিং কল আসবে।" }, { n: "০৩", t: "অর্ডার কনফার্ম করুন", d: "কল চলাকালীন বাটন চেপে কনফার্ম বা ক্যানসেল করুন।" }].map(({ n, t, d }, i) => (
              <div key={i} style={{ flex: "1 1 200px", maxWidth: 250, textAlign: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px 16px" }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: "#00d4c8", opacity: 0.4, marginBottom: 10, letterSpacing: "0.05em" }}>{n}</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 8px", color: "#fff" }}>{t}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.6 }}>{d}</p>
              </div>
            ))}
          </div>

          {/* Demo Form */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,212,200,0.18)", borderRadius: 20, padding: "28px 28px" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 22px", color: "#00d4c8", display: "flex", alignItems: "center", gap: 8 }}>
              <Package style={{ width: 18, height: 18 }} /> ডামি অর্ডার করুন
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[{ label: "অর্ডার ID", key: "orderId" as keyof typeof form }, { label: "পরিমাণ (Amount)", key: "orderAmount" as keyof typeof form }, { label: "গ্রাহকের নাম", key: "customerName" as keyof typeof form }, { label: "ফোন নম্বর", key: "customerPhone" as keyof typeof form }].map(({ label, key }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>{label}</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", transition: "border-color 0.2s", width: "100%", boxSizing: "border-box" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(0,212,200,0.5)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")} />
                </div>
              ))}
              <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>অর্ডার বিবরণ</label>
                <input value={form.orderDetails} onChange={e => setForm(f => ({ ...f, orderDetails: e.target.value }))}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(0,212,200,0.5)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")} />
              </div>
            </div>
            <button onClick={createSession} style={{ marginTop: 22, width: "100%", padding: "16px 24px", background: "linear-gradient(135deg,#00d4c8,#00a89e)", border: "none", borderRadius: 14, color: "#000", fontSize: 17, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 0 40px rgba(0,212,200,0.4)", transition: "transform 0.15s", letterSpacing: "0.02em" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
              <Phone style={{ width: 20, height: 20 }} /> ডেমো কল শুরু করুন <ArrowRight style={{ width: 18, height: 18 }} />
            </button>
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 12 }}>এটি একটি ডেমো — কোনো প্রকৃত কল বা চার্জ প্রযোজ্য নয়।</p>
          </div>
        </section>

        {/* Voice Flow Preview */}
        <section style={{ padding: "0 24px 64px", maxWidth: 900, margin: "0 auto", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 64 }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 20, padding: "5px 14px", marginBottom: 14, fontSize: 12, color: "#a78bfa", fontWeight: 600 }}>
              <Bot style={{ width: 12, height: 12 }} /> Programmable Voice Flows
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 10px" }}>ভয়েস অটোমেশন এডিট ও ডেমো</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>আপনার বিজনেসের জন্য কাস্টম ভয়েস ফ্লো তৈরি করুন এবং সরাসরি ডেমো কল দিয়ে টেস্ট করুন।</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 20, overflow: "hidden" }}>
            {[
              { label: "ওয়েলকাম মেসেজ (Greeting)", badge: "Required", color: "#a78bfa", text: "Assalamoalikum, আপনি ঘরেবাজারবিডি.কম এ এক কেজি মধু অর্ডার করেছিলেন। যার মূল্য ১২০০ টাকা। অর্ডার কনফার্ম করতে ১ চাপুন, ক্যানসেল করতে ২ চাপুন।" },
              { label: "Option 1: Confirm", color: "#00d4c8", text: "ধন্যবাদ। আপনার অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে।" },
              { label: "Option 2: Cancel", color: "#f87171", text: "দুঃখিত। আপনার অর্ডারটি বাতিল করা হয়েছে।" },
              { label: "Option 3: Support", color: "#fbbf24", text: "আমাদের কাস্টমার কেয়ার প্রতিনিধি এই মুহূর্তে ব্যস্ত আছেন।" },
            ].map(({ label, badge, color, text }, i) => (
              <div key={i} style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, fontSize: 13, fontWeight: 800, color }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color }}>{label}</span>
                    {badge && <span style={{ fontSize: 10, background: `${color}18`, color, border: `1px solid ${color}30`, borderRadius: 4, padding: "2px 7px" }}>{badge}</span>}
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: 0, lineHeight: 1.65 }}>{text}</p>
                </div>
              </div>
            ))}
            <div style={{ padding: "20px 24px" }}>
              <button onClick={createSession} style={{ width: "100%", padding: "14px 24px", background: "linear-gradient(135deg,#8b5cf6,#6d28d9)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 0 30px rgba(139,92,246,0.3)", transition: "transform 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
                <Phone style={{ width: 18, height: 18 }} /> ডেমো কল শুরু করুন
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ textAlign: "center", padding: "40px 24px", borderTop: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
          <p style={{ margin: 0 }}>© 2024 SOFTWORKS IT FARM — AI Calling System. All rights reserved.</p>
          <p style={{ margin: "8px 0 0" }}><a href="/" style={{ color: "#00d4c8", textDecoration: "none" }}>softworks.com.bd</a></p>
        </footer>
      </div>
    </>
  );
}
