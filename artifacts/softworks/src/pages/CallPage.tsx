import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearch } from "wouter";
import { Phone, PhoneOff, CheckCircle2, XCircle, Loader2, Package, Mic, MicOff, Bot, User, Volume2 } from "lucide-react";
import { API } from "@/lib/apiUrl";
import { io, type Socket } from "socket.io-client";

interface VoiceOption {
  key: string; label: string; action: string;
  color: "green" | "red" | "yellow" | "blue" | "purple";
  responseText: string; responseAudioUrl: string | null; enabled: boolean;
}
interface Product { name: string; price: number; quantity: number; deliveryDays?: number; imageUrl?: string; }
interface Session {
  token: string; orderId: string; customerName: string | null; customerPhone: string | null;
  orderAmount: string | null; orderDetails: string | null; status: string;
  actionTaken: string | null; products: Product[] | null; deliveryInfo: string | null;
  ecommerceSiteUrl: string | null;
}
interface Config {
  companyName: string; logoUrl: string | null; welcomeAudioUrl: string | null;
  welcomeText: string | null; announcementAudioUrl: string | null; announcementText: string | null;
  options: VoiceOption[];
}

type CallState =
  | "loading" | "ringing" | "menu" | "processing" | "done" | "expired" | "error"
  | "agent_announce" | "agent_mode";

interface AgentMessage { role: "ai" | "user"; text: string; }

function WaveformBars({ active, color = "#00d4c8" }: { active: boolean; color?: string }) {
  const bars = [0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.45, 0.75, 0.55];
  return (
    <div className="flex items-center justify-center gap-[3px] h-12">
      {bars.map((h, i) => (
        <div key={i} className="w-[3px] rounded-full"
          style={{
            backgroundColor: color,
            height: active ? `${h * 48}px` : "8px",
            animation: active ? `waveBar 0.8s ease-in-out ${i * 0.08}s infinite alternate` : "none",
            transition: "height 0.3s ease",
            opacity: active ? 1 : 0.3,
          }} />
      ))}
    </div>
  );
}

function RingPulse({ state }: { state: "ringing" | "connected" | "idle" }) {
  return (
    <div className="relative flex items-center justify-center">
      {state === "ringing" && (
        <>
          <div className="absolute w-36 h-36 rounded-full border-2 border-[#00d4c8]/20 animate-ping" />
          <div className="absolute w-44 h-44 rounded-full border border-[#00d4c8]/10 animate-ping [animation-delay:0.3s]" />
        </>
      )}
      {state === "connected" && (
        <>
          <div className="absolute w-36 h-36 rounded-full border-2 border-[#00d4c8]/50 animate-pulse" />
          <div className="absolute w-40 h-40 rounded-full border border-[#00d4c8]/25" />
        </>
      )}
      <div className="relative w-28 h-28 rounded-full flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #1a1f2e 0%, #252b3a 100%)",
          border: state === "connected" ? "3px solid #00d4c8" : state === "ringing" ? "3px solid rgba(0,212,200,0.4)" : "3px solid rgba(255,255,255,0.1)",
          boxShadow: state === "connected" ? "0 0 30px rgba(0,212,200,0.3)" : "none",
        }}>
        <svg viewBox="0 0 24 24" className="w-12 h-12 text-white/60" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>
    </div>
  );
}

function postMsgToParent(data: Record<string, unknown>) {
  try { window.parent.postMessage({ sw_call: data.sw_call, ...data }, "*"); } catch {}
}

function useRingtone() {
  const ctxRef = useRef<AudioContext | null>(null);
  const activeRef = useRef(false);
  const start = useCallback(() => {
    if (activeRef.current) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      ctxRef.current = ctx; activeRef.current = true;
      function ring(t: number) {
        if (!activeRef.current || !ctxRef.current) return;
        const c = ctxRef.current;
        [[480, 440], [480, 440]].forEach((freqs, idx) => {
          const off = idx * 0.55; const dur = 0.42;
          freqs.forEach(freq => {
            const osc = c.createOscillator(); const gain = c.createGain();
            osc.frequency.value = freq; osc.type = "sine";
            osc.connect(gain); gain.connect(c.destination);
            gain.gain.setValueAtTime(0, t + off);
            gain.gain.linearRampToValueAtTime(0.15, t + off + 0.02);
            gain.gain.setValueAtTime(0.15, t + off + dur - 0.06);
            gain.gain.linearRampToValueAtTime(0, t + off + dur);
            osc.start(t + off); osc.stop(t + off + dur);
          });
        });
        setTimeout(() => { if (activeRef.current) ring(ctxRef.current!.currentTime); }, 2500);
      }
      ring(ctx.currentTime);
    } catch {}
  }, []);
  const stop = useCallback(() => {
    activeRef.current = false;
    try { ctxRef.current?.close(); } catch {}
    ctxRef.current = null;
  }, []);
  return { start, stop };
}

function speakText(text: string | null | undefined, onEnd?: () => void, lang?: string) {
  if (!text?.trim()) { onEnd?.(); return; }
  if (!window.speechSynthesis) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.88; utt.pitch = 1.05; utt.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const isBangla = lang === "bn" || /[\u0980-\u09FF]/.test(text);
  let preferred: SpeechSynthesisVoice | undefined;
  if (isBangla) {
    preferred = voices.find(v => v.lang === "bn-BD" && v.name.toLowerCase().includes("female"))
      || voices.find(v => v.lang === "bn-BD")
      || voices.find(v => v.lang === "bn-IN" && v.name.toLowerCase().includes("female"))
      || voices.find(v => v.lang === "bn-IN")
      || voices.find(v => v.lang.startsWith("bn"));
  }
  if (!preferred) {
    preferred = voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("female"))
      || voices.find(v => v.lang.startsWith("en"))
      || voices[0];
  }
  if (preferred) utt.voice = preferred;
  if (onEnd) { utt.onend = () => onEnd(); utt.onerror = () => onEnd(); }
  window.speechSynthesis.speak(utt);
}

function buildAgentContext(session: Session, config: Config): string {
  const products = session.products?.map(p => `${p.quantity}টি ${p.name} (৳${p.price * p.quantity})`).join(", ") || session.orderDetails || "পণ্যের বিবরণ নেই";
  const amount = session.orderAmount || (session.products ? `৳${session.products.reduce((s, p) => s + p.price * p.quantity, 0).toLocaleString()}` : "");
  const delivery = session.deliveryInfo || "২-৩ কার্যদিবস";
  return `অর্ডার #${session.orderId} | পণ্য: ${products} | মোট: ${amount} | ডেলিভারি: ${delivery}`;
}

function generateAgentResponse(input: string, session: Session, turnCount: number): { text: string; isConfirm: boolean; isCancel: boolean } {
  const low = input.toLowerCase().trim();
  const bn = input;

  const confirmKeywords = ["confirm", "কনফার্ম", "হ্যাঁ", "হ্যা", "yes", "ok", "ঠিক আছে", "ঠিকাছে", "রাখি", "নিব", "দিন", "আমি নেব", "accept", "এক", "১"];
  const cancelKeywords = ["cancel", "বাতিল", "ক্যান্সেল", "না", "no", "চাই না", "নাহ", "রাখব না", "রাখবো না", "বাদ", "দুই", "২"];
  const priceKeywords = ["দাম", "price", "কত", "মূল্য", "টাকা", "amount"];
  const deliveryKeywords = ["ডেলিভারি", "delivery", "কবে", "কতদিন", "কখন", "পাব", "পাবো"];
  const productKeywords = ["পণ্য", "কী", "কি", "what", "product", "item", "অর্ডার", "order"];
  const repeatKeywords = ["আবার", "repeat", "again", "বলুন", "শুনতে পাইনি", "পারিনি"];

  const isConfirm = confirmKeywords.some(k => low.includes(k) || bn.includes(k));
  const isCancel = cancelKeywords.some(k => low.includes(k) || bn.includes(k));

  if (isConfirm) {
    return {
      text: `অবশ্যই! আপনার অর্ডার #${session.orderId} নিশ্চিত করা হচ্ছে। আমরা দ্রুত আপনার কাছে পৌঁছে দেওয়ার ব্যবস্থা করছি। ধন্যবাদ আমাদের সাথে থাকার জন্য!`,
      isConfirm: true, isCancel: false,
    };
  }
  if (isCancel) {
    return {
      text: `ঠিক আছে, আপনার অর্ডার বাতিল করা হচ্ছে। যদি পরবর্তীতে কিছু প্রয়োজন হয়, আমরা সবসময় আছি। ধন্যবাদ!`,
      isConfirm: false, isCancel: true,
    };
  }
  if (priceKeywords.some(k => low.includes(k) || bn.includes(k))) {
    const amount = session.orderAmount || (session.products ? `৳${session.products.reduce((s, p) => s + p.price * p.quantity, 0).toLocaleString()}` : "জানা নেই");
    return { text: `আপনার অর্ডারের মোট মূল্য হলো ${amount}। এই মূল্যে কি আপনি অর্ডারটি নিশ্চিত করতে চান?`, isConfirm: false, isCancel: false };
  }
  if (deliveryKeywords.some(k => low.includes(k) || bn.includes(k))) {
    const delivery = session.deliveryInfo || "২-৩ কার্যদিবসের মধ্যে";
    return { text: `আপনার ডেলিভারি ${delivery} হবে। অর্ডারটি কি নিশ্চিত করবেন?`, isConfirm: false, isCancel: false };
  }
  if (productKeywords.some(k => low.includes(k) || bn.includes(k))) {
    const products = session.products?.map(p => `${p.quantity}টি ${p.name}`).join(", ") || session.orderDetails || "পণ্য বিবরণ";
    return { text: `আপনার অর্ডারে রয়েছে: ${products}। এই পণ্যগুলো কি আপনি নিশ্চিত করতে চান?`, isConfirm: false, isCancel: false };
  }
  if (repeatKeywords.some(k => low.includes(k) || bn.includes(k))) {
    const products = session.products?.map(p => `${p.quantity}টি ${p.name}`).join(", ") || session.orderDetails || "";
    const amount = session.orderAmount || "";
    return { text: `আপনার অর্ডার #${session.orderId}-এ ${products} রয়েছে, মোট ${amount}। অর্ডারটি কি কনফার্ম করবেন?`, isConfirm: false, isCancel: false };
  }

  const fallbacks = [
    `আপনার অর্ডার #${session.orderId} কি নিশ্চিত করতে চান? "হ্যাঁ" বলুন বা "এক" চাপুন কনফার্মের জন্য, "না" বলুন বা "দুই" চাপুন বাতিলের জন্য।`,
    `আমি বুঝতে পারছি। আপনার অর্ডারটি কনফার্ম করতে বলুন "হ্যাঁ", আর বাতিল করতে বলুন "না"।`,
    `দয়া করে জানান, আপনি কি অর্ডারটি রাখতে চান? "কনফার্ম" বা "বাতিল" বলুন।`,
  ];
  return { text: fallbacks[Math.min(turnCount, fallbacks.length - 1)], isConfirm: false, isCancel: false };
}

export function CallPage() {
  const { token } = useParams<{ token: string }>();
  const search = useSearch();
  const isOverlay = search.includes("overlay=1");

  const [session, setSession] = useState<Session | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [callState, setCallState] = useState<CallState>("loading");
  const [chosenOption, setChosenOption] = useState<VoiceOption | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [agentListening, setAgentListening] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [agentTranscript, setAgentTranscript] = useState("");
  const [agentTurnCount, setAgentTurnCount] = useState(0);
  const agentActiveRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const agentMsgRef = useRef<HTMLDivElement>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const ringtone = useRingtone();

  function stopAudio() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (window.speechSynthesis?.speaking) { window.speechSynthesis.cancel(); }
  }

  function playAudio(url: string | null | undefined, onEnd?: () => void, fallbackText?: string | null) {
    stopAudio();
    if (url) {
      const a = new Audio(url); audioRef.current = a;
      if (onEnd) a.addEventListener("ended", onEnd, { once: true });
      a.play().catch(() => fallbackText ? speakText(fallbackText, onEnd) : onEnd?.());
      return;
    }
    if (fallbackText) { speakText(fallbackText, onEnd); return; }
    onEnd?.();
  }

  useEffect(() => {
    if (!token) return;
    const socket = io(API, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;
    socket.on("connect", () => { setSocketConnected(true); socket.emit("join_call", token); });
    socket.on("disconnect", () => setSocketConnected(false));
    return () => { socket.emit("leave_call", token); socket.disconnect(); socketRef.current = null; };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/voice-calls/session/${token}`)
      .then(async (r) => {
        if (r.status === 410) { setCallState("expired"); return; }
        if (!r.ok) throw new Error("Session not found");
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setSession(d.session);
        setConfig(d.config);
        if (d.session.status === "completed") {
          const opt = (d.config.options || []).find((o: VoiceOption) => o.key === d.session.dtmfInput);
          setChosenOption(opt || null);
          setCallState("done");
          return;
        }
        if (d.session.status === "in_progress" || d.session.status === "active") {
          setCallState("menu");
          return;
        }
        setCallState("ringing");
        setTimeout(() => ringtone.start(), 200);
      })
      .catch(() => { setCallState("error"); setErrorMsg("Call session not found or has expired."); });
  }, [token]);

  useEffect(() => {
    if (callState !== "menu") return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [callState]);

  useEffect(() => {
    if (callState !== "menu" || !config) return;
    const enabledOpts = (config.options || []).filter(o => o.enabled !== false);
    const handler = (e: KeyboardEvent) => {
      const opt = enabledOpts.find(o => o.key === e.key);
      if (opt) handleRespond(opt);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [callState, config]);

  useEffect(() => {
    if (agentMsgRef.current) {
      agentMsgRef.current.scrollTop = agentMsgRef.current.scrollHeight;
    }
  }, [agentMessages]);

  useEffect(() => {
    return () => {
      agentActiveRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  function acceptCall() {
    ringtone.stop();
    setCallState("menu");
    if (token) {
      fetch(`${API}/api/voice-calls/session/${token}/connected`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
    }
    setTimeout(() => {
      if (config) {
        playAudio(config.welcomeAudioUrl, () => {
          setTimeout(() => playAudio(config.announcementAudioUrl, undefined, config.announcementText), 400);
        }, config.welcomeText);
      }
    }, 300);
  }

  async function handleRespond(option: VoiceOption) {
    if (!session || callState !== "menu") return;

    if (option.action === "transfer_to_agent") {
      initiateAgentTransfer();
      return;
    }

    setCallState("processing");
    try {
      await fetch(`${API}/api/voice-calls/session/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dtmf: option.key }),
      });
      setChosenOption(option);
      playAudio(option.responseAudioUrl, undefined, option.responseText);
      setCallState("done");
      setTimeout(() => {
        postMsgToParent({ sw_call: "completed", action: option.action, orderId: session.orderId, dtmfInput: option.key });
      }, 2500);
    } catch {
      setCallState("error");
      setErrorMsg("Connection error. Please try again.");
    }
  }

  function initiateAgentTransfer() {
    if (!session || !config) return;
    stopAudio();
    setCallState("agent_announce");

    if (token) {
      fetch(`${API}/api/voice-calls/session/${token}/transfer-to-agent`, { method: "POST" }).catch(() => {});
    }

    const announcement = "আপনার কল আমাদের AI এজেন্টের কাছে ট্রান্সফার করা হচ্ছে। অনুগ্রহ করে একটু অপেক্ষা করুন...";
    speakText(announcement, () => {
      setCallState("agent_mode");
      agentActiveRef.current = true;

      const greeting = buildAgentGreeting(session);
      setAgentMessages([{ role: "ai", text: greeting }]);
      setAgentSpeaking(true);
      speakText(greeting, () => {
        setAgentSpeaking(false);
        if (agentActiveRef.current) startListening();
      });
    });
  }

  function buildAgentGreeting(sess: Session): string {
    const products = sess.products?.map(p => `${p.quantity}টি ${p.name}`).join(" এবং ") || sess.orderDetails || "আপনার পণ্য";
    const amount = sess.orderAmount || (sess.products ? `৳${sess.products.reduce((s, p) => s + p.price * p.quantity, 0).toLocaleString()}` : "");
    const delivery = sess.deliveryInfo || "২-৩ কার্যদিবস";
    return `আস্সালামু আলাইকুম! আমি সফটওয়ার্কস AI এজেন্ট। আপনি ${sess.customerName || "ভাই/আপু"}, অর্ডার নম্বর #${sess.orderId}—${products}, মোট ${amount}, ডেলিভারি ${delivery}। আপনার অর্ডারটি কি নিশ্চিত করতে চান?`;
  }

  function startListening() {
    if (!agentActiveRef.current) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAgentMessages(prev => [...prev, { role: "ai", text: "দুঃখিত, আপনার ব্রাউজার ভয়েস ইনপুট সাপোর্ট করে না। নিচের বোতাম ব্যবহার করুন।" }]);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "bn-BD";
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.continuous = false;
    recognitionRef.current = rec;

    setAgentListening(true);
    setAgentTranscript("");

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setAgentTranscript(final || interim);
    };

    rec.onend = () => {
      setAgentListening(false);
      const transcript = agentTranscriptRef.current;
      setAgentTranscript("");
      if (!agentActiveRef.current || !transcript.trim()) {
        if (agentActiveRef.current) {
          setTimeout(() => { if (agentActiveRef.current) startListening(); }, 1500);
        }
        return;
      }
      processAgentInput(transcript);
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      setAgentListening(false);
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setTimeout(() => { if (agentActiveRef.current) startListening(); }, 2000);
      } else if (e.error === "no-speech" && agentActiveRef.current) {
        setTimeout(() => { if (agentActiveRef.current) startListening(); }, 1000);
      }
    };

    try { rec.start(); } catch { setAgentListening(false); }
  }

  const agentTranscriptRef = useRef("");
  useEffect(() => { agentTranscriptRef.current = agentTranscript; }, [agentTranscript]);

  function processAgentInput(input: string) {
    if (!session || !agentActiveRef.current) return;
    setAgentMessages(prev => [...prev, { role: "user", text: input }]);
    const currentTurn = agentTurnCount;
    setAgentTurnCount(t => t + 1);

    const { text, isConfirm, isCancel } = generateAgentResponse(input, session, currentTurn);

    setAgentSpeaking(true);
    setAgentMessages(prev => [...prev, { role: "ai", text }]);

    speakText(text, () => {
      setAgentSpeaking(false);
      if (!agentActiveRef.current) return;

      if (isConfirm) {
        agentActiveRef.current = false;
        const confirmOpt = (config?.options || []).find(o => o.action === "confirmed");
        if (confirmOpt) {
          setTimeout(() => finalizeFromAgent(confirmOpt), 800);
        } else {
          setTimeout(() => finalizeFromAgent({
            key: "1", label: "অর্ডার কনফার্ম", action: "confirmed",
            color: "green", responseText: text, responseAudioUrl: null, enabled: true,
          }), 800);
        }
        return;
      }
      if (isCancel) {
        agentActiveRef.current = false;
        const cancelOpt = (config?.options || []).find(o => o.action === "cancelled");
        if (cancelOpt) {
          setTimeout(() => finalizeFromAgent(cancelOpt), 800);
        } else {
          setTimeout(() => finalizeFromAgent({
            key: "2", label: "অর্ডার বাতিল", action: "cancelled",
            color: "red", responseText: text, responseAudioUrl: null, enabled: true,
          }), 800);
        }
        return;
      }

      setTimeout(() => { if (agentActiveRef.current) startListening(); }, 600);
    });
  }

  async function finalizeFromAgent(option: VoiceOption) {
    if (!session) return;
    setCallState("processing");
    try {
      await fetch(`${API}/api/voice-calls/session/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dtmf: option.key }),
      });
      setChosenOption(option);
      setCallState("done");
      setTimeout(() => {
        postMsgToParent({ sw_call: "completed", action: option.action, orderId: session.orderId, dtmfInput: option.key });
      }, 2500);
    } catch {
      setCallState("error");
      setErrorMsg("Connection error. Please try again.");
    }
  }

  function stopAgentMode() {
    agentActiveRef.current = false;
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    setAgentListening(false);
    setAgentSpeaking(false);
  }

  function handleEndCall() {
    stopAudio();
    stopAgentMode();
    if (token && ["menu", "agent_mode", "agent_announce"].includes(callState)) {
      fetch(`${API}/api/voice-calls/session/${token}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "user_ended" }),
      }).catch(() => {});
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    postMsgToParent({ sw_call: "close" });
    setCallState("expired");
  }

  const toggleMute = useCallback(async () => {
    if (!isMuted) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        stream.getAudioTracks().forEach(t => { t.enabled = false; });
        setIsMuted(true);
      } catch { setIsMuted(true); }
    } else {
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach(t => { t.enabled = true; });
        micStreamRef.current.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
      }
      setIsMuted(false);
    }
  }, [isMuted]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setVoiceNote(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      rec.start();
      mediaRecRef.current = rec;
      setIsRecording(true);
    } catch { alert("Microphone access denied"); }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecRef.current?.state === "recording") {
      mediaRecRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const enabledOptions = (config?.options || []).filter(o => o.enabled !== false);
  const confirmOpt = enabledOptions.find(o => o.action === "confirmed");
  const cancelOpt = enabledOptions.find(o => o.action === "cancelled");
  const transferOpt = enabledOptions.find(o => o.action === "transfer_to_agent");
  const otherOpts = enabledOptions.filter(o => o.action !== "confirmed" && o.action !== "cancelled" && o.action !== "transfer_to_agent");

  const bgGradient = callState === "done" && chosenOption?.action === "confirmed"
    ? "radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.08) 0%, #0a0c14 60%)"
    : callState === "done" && chosenOption?.action === "cancelled"
    ? "radial-gradient(ellipse at 30% 20%, rgba(239,68,68,0.06) 0%, #0a0c14 60%)"
    : callState === "agent_mode"
    ? "radial-gradient(ellipse at 30% 20%, rgba(139,92,246,0.08) 0%, #0a0c14 60%)"
    : "radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.05) 0%, #0a0c14 60%)";

  return (
    <>
      <style>{`
        @keyframes waveBar {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes agentPulse {
          0% { box-shadow: 0 0 0 0 rgba(139,92,246,0.6); }
          70% { box-shadow: 0 0 0 20px rgba(139,92,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(139,92,246,0); }
        }
        @keyframes listenPulse {
          0% { box-shadow: 0 0 0 0 rgba(0,212,200,0.6); }
          70% { box-shadow: 0 0 0 20px rgba(0,212,200,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,212,200,0); }
        }
      `}</style>
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: bgGradient, backgroundColor: "#0a0c14" }}>
        <div className="w-full max-w-[380px] px-4 py-6 flex flex-col items-center min-h-screen justify-between">

          <div className="h-8" />

          <div className="flex flex-col items-center gap-5 w-full">

            {/* LOADING */}
            {callState === "loading" && (
              <div className="flex flex-col items-center gap-6 py-16">
                <div className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #1a1f2e 0%, #252b3a 100%)" }}>
                  <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#00d4c8" }} />
                </div>
                <p className="text-white/40 text-sm tracking-wider">CONNECTING</p>
              </div>
            )}

            {/* EXPIRED */}
            {callState === "expired" && (
              <div className="flex flex-col items-center gap-6 py-16 text-center">
                <div className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #1a1f2e 0%, #252b3a 100%)" }}>
                  <PhoneOff className="w-10 h-10 text-white/20" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Call Ended</h2>
                  <p className="text-white/30 text-sm">This session has expired.</p>
                </div>
              </div>
            )}

            {/* ERROR */}
            {callState === "error" && (
              <div className="flex flex-col items-center gap-6 py-16 text-center">
                <div className="w-24 h-24 rounded-full flex items-center justify-center bg-red-900/20 border-2 border-red-500/30">
                  <XCircle className="w-10 h-10 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Connection Failed</h2>
                  <p className="text-white/50 text-sm">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* RINGING */}
            {callState === "ringing" && (
              <>
                <div className="absolute top-5 left-5" style={{
                  background: "rgba(0,212,200,0.1)", border: "1px solid rgba(0,212,200,0.25)",
                  borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#00d4c8", fontWeight: 600,
                }}>⚡ ইনকামিং কল</div>
                <RingPulse state="ringing" />
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-white">{config?.companyName || "SOFTWORKS AI"}</h2>
                  {session?.customerPhone && (
                    <p className="text-white/40 text-sm font-mono">{session.customerPhone}</p>
                  )}
                  <p className="text-xs font-semibold tracking-[0.2em] mt-3" style={{ color: "#00d4c8" }}>
                    INCOMING WEB CALL
                  </p>
                  <p className="text-white/30 text-sm mt-2">রিং হচ্ছে, কল রিসিভ করুন...</p>
                </div>
              </>
            )}

            {/* AGENT ANNOUNCE */}
            {callState === "agent_announce" && (
              <div className="flex flex-col items-center gap-6 py-8 text-center">
                <div className="w-28 h-28 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #4c1d95, #7c3aed)",
                    animation: "agentPulse 1.5s ease-in-out infinite",
                  }}>
                  <Bot className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">AI এজেন্ট সংযুক্ত হচ্ছে</h2>
                  <p className="text-purple-300/70 text-sm mt-2">ট্রান্সফার হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</p>
                </div>
                <WaveformBars active={true} color="#8b5cf6" />
              </div>
            )}

            {/* AGENT MODE */}
            {callState === "agent_mode" && session && (
              <>
                {/* Header */}
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg, #4c1d95, #7c3aed)",
                        animation: agentSpeaking ? "agentPulse 1.2s ease-in-out infinite" : "none",
                        boxShadow: agentSpeaking ? "0 0 20px rgba(139,92,246,0.5)" : "none",
                      }}>
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">AI এজেন্ট</p>
                      <p className="text-xs" style={{ color: agentSpeaking ? "#8b5cf6" : agentListening ? "#00d4c8" : "rgba(255,255,255,0.3)" }}>
                        {agentSpeaking ? "বলছে..." : agentListening ? "শুনছে..." : "অপেক্ষায়..."}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/30 text-xs font-mono">{fmtTime(elapsed)}</p>
                    <div className={`flex items-center gap-1 justify-end mt-0.5`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${agentListening ? "bg-teal-400 animate-pulse" : agentSpeaking ? "bg-purple-400 animate-pulse" : "bg-white/20"}`} />
                      <span className="text-[10px] text-white/20">{agentListening ? "REC" : agentSpeaking ? "AI" : "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Waveform */}
                <WaveformBars active={agentSpeaking || agentListening} color={agentSpeaking ? "#8b5cf6" : "#00d4c8"} />

                {/* Listening indicator */}
                {agentListening && agentTranscript && (
                  <div className="w-full rounded-xl px-4 py-2.5"
                    style={{ background: "rgba(0,212,200,0.08)", border: "1px solid rgba(0,212,200,0.2)" }}>
                    <p className="text-[#00d4c8] text-sm italic">{agentTranscript}...</p>
                  </div>
                )}

                {/* Conversation log */}
                <div ref={agentMsgRef}
                  className="w-full space-y-3 max-h-[220px] overflow-y-auto scrollbar-none rounded-2xl p-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {agentMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "ai" ? "bg-purple-600/30" : "bg-teal-500/20"}`}>
                        {msg.role === "ai" ? <Bot className="w-3.5 h-3.5 text-purple-300" /> : <User className="w-3.5 h-3.5 text-teal-300" />}
                      </div>
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === "ai"
                          ? "bg-purple-900/30 text-white/80 rounded-tl-sm"
                          : "bg-teal-900/30 text-white/80 rounded-tr-sm"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {agentSpeaking && (
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-purple-600/30">
                        <Volume2 className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                      </div>
                      <div className="bg-purple-900/30 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                        <div className="flex gap-1 items-center h-4">
                          {[0, 1, 2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                              style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Order info in agent mode */}
                {session.products && session.products.length > 0 && (
                  <div className="w-full rounded-xl p-3 space-y-1.5"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Package className="w-3 h-3 text-white/20" />
                      <p className="text-white/20 text-[10px] uppercase tracking-wider">অর্ডার #{session.orderId}</p>
                    </div>
                    {session.products.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-white/50 truncate max-w-[160px]">{p.quantity}× {p.name}</span>
                        <span className="text-white/30">৳{(p.price * p.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t border-white/5 pt-1 flex justify-between text-xs">
                      <span className="text-white/30">Total</span>
                      <span className="text-white/50 font-medium">{session.orderAmount}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* MENU */}
            {callState === "menu" && config && session && (
              <>
                <RingPulse state="connected" />
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-bold text-white">{config.companyName}</h2>
                  {session.customerPhone && (
                    <p className="text-white/40 text-sm font-mono">{session.customerPhone}</p>
                  )}
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <p className="text-xs font-semibold tracking-[0.2em]" style={{ color: "#00d4c8" }}>
                      CONNECTED · {fmtTime(elapsed)}
                    </p>
                    <div className="flex items-center gap-1" title={socketConnected ? "Real-time connected" : "Offline mode"}>
                      <div className={`w-1.5 h-1.5 rounded-full ${socketConnected ? "bg-teal-400 animate-pulse" : "bg-white/20"}`} />
                      <div className={`w-1.5 h-2 rounded-full ${socketConnected ? "bg-teal-400/70" : "bg-white/20"}`} />
                      <div className={`w-1.5 h-3 rounded-full ${socketConnected ? "bg-teal-400/50" : "bg-white/20"}`} />
                    </div>
                    {isMuted && (
                      <div className="flex items-center gap-1 bg-red-500/20 border border-red-400/30 rounded-full px-2 py-0.5">
                        <MicOff className="w-2.5 h-2.5 text-red-400" />
                        <span className="text-red-400 text-[9px] font-bold uppercase tracking-wider">Muted</span>
                      </div>
                    )}
                  </div>
                </div>

                <WaveformBars active={!isMuted} />

                {/* AI welcome message */}
                {(config.welcomeText || config.announcementText) && (
                  <div className="w-full rounded-2xl p-4"
                    style={{ background: "rgba(0,212,200,0.04)", border: "1px solid rgba(0,212,200,0.12)" }}>
                    <p className="text-white/60 text-sm leading-relaxed">
                      "{config.welcomeText || ""}{config.announcementText ? " " + config.announcementText : ""}"
                    </p>
                  </div>
                )}

                {/* Order details */}
                {session.products && session.products.length > 0 && (
                  <div className="w-full rounded-2xl p-4 space-y-2"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-3.5 h-3.5 text-white/30" />
                      <p className="text-white/30 text-xs uppercase tracking-wider">Order #{session.orderId}</p>
                    </div>
                    {session.products.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-white/70 truncate max-w-[180px]">{p.quantity}× {p.name}</span>
                        <span className="text-white/50 text-xs">৳{(p.price * p.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t border-white/5 pt-2 flex justify-between">
                      <span className="text-white/40 text-sm">Total</span>
                      <span className="text-white font-semibold text-sm">
                        {session.orderAmount || `৳${session.products.reduce((s, p) => s + p.price * p.quantity, 0).toLocaleString()}`}
                      </span>
                    </div>
                    {session.deliveryInfo && (
                      <p className="text-white/25 text-xs flex items-center gap-1 pt-1">
                        <span>🚚</span> {session.deliveryInfo}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* PROCESSING */}
            {callState === "processing" && (
              <div className="flex flex-col items-center gap-6 py-16">
                <div className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #1a1f2e 0%, #252b3a 100%)", border: "3px solid rgba(0,212,200,0.4)" }}>
                  <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#00d4c8" }} />
                </div>
                <p className="text-white/40 text-sm tracking-wider">PROCESSING</p>
              </div>
            )}

            {/* DONE */}
            {callState === "done" && (
              <div className="flex flex-col items-center gap-6 py-8 text-center w-full">
                {chosenOption?.action === "confirmed" ? (
                  <div className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,212,200,0.1)", border: "3px solid rgba(0,212,200,0.4)", boxShadow: "0 0 30px rgba(0,212,200,0.2)" }}>
                    <CheckCircle2 className="w-10 h-10" style={{ color: "#00d4c8" }} />
                  </div>
                ) : chosenOption?.action === "cancelled" ? (
                  <div className="w-24 h-24 rounded-full flex items-center justify-center bg-red-900/20 border-2 border-red-500/30">
                    <XCircle className="w-10 h-10 text-red-400" />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,212,200,0.1)", border: "3px solid rgba(0,212,200,0.4)" }}>
                    <CheckCircle2 className="w-10 h-10" style={{ color: "#00d4c8" }} />
                  </div>
                )}
                <div>
                  <h2 className={`text-2xl font-bold ${chosenOption?.action === "cancelled" ? "text-red-400" : "text-white"}`}>
                    {chosenOption?.label || "Response Recorded"}
                  </h2>
                  <p className="text-white/40 text-sm mt-2 leading-relaxed">
                    {chosenOption?.responseText || "Thank you!"}
                  </p>
                </div>
                <div className="w-full rounded-2xl p-4"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-white/30 text-xs">Order #{session?.orderId}</p>
                  {session?.ecommerceSiteUrl && (
                    <a href={session.ecommerceSiteUrl} className="mt-2 inline-block text-xs hover:underline" style={{ color: "#00d4c8" }}>
                      ← Back to Store
                    </a>
                  )}
                </div>
                {voiceNote && (
                  <div className="w-full rounded-2xl p-3" style={{ background: "rgba(0,212,200,0.05)", border: "1px solid rgba(0,212,200,0.2)" }}>
                    <p className="text-xs text-white/40 mb-2">Your voice note</p>
                    <audio src={voiceNote} controls className="w-full h-8" style={{ filter: "invert(1) hue-rotate(160deg)" }} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BOTTOM ACTIONS */}
          <div className="w-full space-y-3 pb-4">

            {/* RINGING — Accept/Reject */}
            {callState === "ringing" && (
              <div className="flex items-center justify-center gap-16">
                <button onClick={() => { ringtone.stop(); handleEndCall(); }}
                  className="flex flex-col items-center gap-2 group">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-90 group-hover:scale-105"
                    style={{ background: "rgba(239,68,68,0.9)", boxShadow: "0 0 24px rgba(239,68,68,0.4)" }}>
                    <PhoneOff className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-white/40 text-[11px] uppercase tracking-wider">REJECT</span>
                </button>
                <button onClick={acceptCall} className="flex flex-col items-center gap-2 group">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-90 group-hover:scale-105"
                    style={{ background: "rgba(16,185,129,0.9)", boxShadow: "0 0 30px rgba(16,185,129,0.5)", animation: "ringPulse 1.5s ease-in-out infinite" }}>
                    <Phone className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-white/40 text-[11px] uppercase tracking-wider">ACCEPT</span>
                </button>
              </div>
            )}

            {/* AGENT MODE buttons */}
            {callState === "agent_mode" && (
              <div className="space-y-3 w-full">
                {/* Status row */}
                <div className="flex items-center justify-center gap-2 text-xs">
                  {agentListening ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                      style={{ background: "rgba(0,212,200,0.1)", border: "1px solid rgba(0,212,200,0.3)" }}>
                      <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                      <span style={{ color: "#00d4c8" }}>কথা বলুন...</span>
                    </div>
                  ) : agentSpeaking ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                      style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)" }}>
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                      <span className="text-purple-300">AI বলছে...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <div className="w-2 h-2 rounded-full bg-white/30" />
                      <span className="text-white/30">অপেক্ষায়...</span>
                    </div>
                  )}
                </div>

                {/* Manual confirm/cancel */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      stopAgentMode();
                      const opt = confirmOpt || { key: "1", label: "অর্ডার কনফার্ম", action: "confirmed", color: "green" as const, responseText: "অর্ডার কনফার্ম হয়েছে।", responseAudioUrl: null, enabled: true };
                      finalizeFromAgent(opt);
                    }}
                    className="flex-1 py-3.5 rounded-2xl font-semibold text-[#0a0c14] text-sm transition-all active:scale-95"
                    style={{ background: "#00d4c8" }}>
                    ১ — অর্ডার কনফার্ম করুন
                  </button>
                  <button
                    onClick={() => {
                      stopAgentMode();
                      const opt = cancelOpt || { key: "2", label: "অর্ডার বাতিল", action: "cancelled", color: "red" as const, responseText: "অর্ডার বাতিল হয়েছে।", responseAudioUrl: null, enabled: true };
                      finalizeFromAgent(opt);
                    }}
                    className="flex-1 py-3.5 rounded-2xl font-semibold text-white/80 text-sm transition-all active:scale-95"
                    style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                    ২ — অর্ডার বাতিল করুন
                  </button>
                </div>

                <button onClick={handleEndCall}
                  className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm transition-all active:scale-95 hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ background: "rgba(239,68,68,0.85)" }}>
                  <PhoneOff className="w-4 h-4" />
                  কল শেষ করুন
                </button>
              </div>
            )}

            {/* AGENT ANNOUNCE — just end call */}
            {callState === "agent_announce" && (
              <button onClick={handleEndCall}
                className="w-full py-4 rounded-2xl font-semibold text-white text-sm flex items-center justify-center gap-2 active:scale-95"
                style={{ background: "rgba(239,68,68,0.85)" }}>
                <PhoneOff className="w-4 h-4" />
                কল শেষ করুন
              </button>
            )}

            {/* MENU — Phone Dialpad */}
            {callState === "menu" && (
              <div className="space-y-4 w-full">

                {/* Announcement text if configured */}
                {config?.announcementText && (
                  <div className="px-4 py-3 rounded-2xl text-center"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="text-white/50 text-xs leading-relaxed">{config.announcementText}</p>
                  </div>
                )}

                {/* ===== NUMBER KEYPAD ===== */}
                <div className="w-full">
                  <div className="grid grid-cols-3 gap-3">
                    {["1","2","3","4","5","6","7","8","9","*","0","#"].map((key) => {
                      const opt = enabledOptions.find(o => o.key === key);
                      const isAgent = opt?.action === "transfer_to_agent";
                      const isConfirmed = opt?.action === "confirmed";
                      const isCancelled = opt?.action === "cancelled";

                      let keyBg = "rgba(255,255,255,0.05)";
                      let keyBorder = "rgba(255,255,255,0.08)";
                      let keyColor = "rgba(255,255,255,0.25)";
                      let numColor = "rgba(255,255,255,0.45)";
                      let glowShadow = "none";

                      if (opt) {
                        if (isConfirmed) {
                          keyBg = "rgba(0,212,200,0.12)";
                          keyBorder = "rgba(0,212,200,0.4)";
                          keyColor = "rgba(0,212,200,0.7)";
                          numColor = "#00d4c8";
                          glowShadow = "0 0 20px rgba(0,212,200,0.2)";
                        } else if (isCancelled) {
                          keyBg = "rgba(239,68,68,0.1)";
                          keyBorder = "rgba(239,68,68,0.4)";
                          keyColor = "rgba(248,113,113,0.7)";
                          numColor = "#f87171";
                          glowShadow = "0 0 20px rgba(239,68,68,0.15)";
                        } else if (isAgent) {
                          keyBg = "rgba(139,92,246,0.12)";
                          keyBorder = "rgba(139,92,246,0.45)";
                          keyColor = "rgba(167,139,250,0.8)";
                          numColor = "#a78bfa";
                          glowShadow = "0 0 20px rgba(139,92,246,0.2)";
                        } else {
                          keyBg = "rgba(96,165,250,0.1)";
                          keyBorder = "rgba(96,165,250,0.35)";
                          keyColor = "rgba(147,197,253,0.7)";
                          numColor = "#93c5fd";
                          glowShadow = "0 0 16px rgba(96,165,250,0.15)";
                        }
                      }

                      return (
                        <button
                          key={key}
                          onClick={() => opt ? handleRespond(opt) : undefined}
                          disabled={!opt}
                          className="flex flex-col items-center justify-center rounded-2xl transition-all active:scale-90 select-none"
                          style={{
                            background: keyBg,
                            border: `1.5px solid ${keyBorder}`,
                            boxShadow: glowShadow,
                            padding: "10px 8px 8px",
                            minHeight: "72px",
                            cursor: opt ? "pointer" : "default",
                            opacity: opt ? 1 : 0.35,
                          }}
                        >
                          {/* Number */}
                          <span className="text-2xl font-light leading-none mb-0.5" style={{ color: numColor, fontFamily: "system-ui, sans-serif" }}>
                            {key === "*" ? "✱" : key === "#" ? "#" : key}
                          </span>
                          {/* Label or sub-letters */}
                          {opt ? (
                            <span className="text-[9px] font-semibold tracking-wide text-center leading-tight px-1 mt-1" style={{ color: keyColor }}>
                              {isAgent ? "🤖 AGENT" : opt.label.length > 12 ? opt.label.slice(0, 12) + "…" : opt.label}
                            </span>
                          ) : (
                            <span className="text-[9px] tracking-widest" style={{ color: "rgba(255,255,255,0.1)" }}>
                              {key === "1" ? "" : key === "2" ? "ABC" : key === "3" ? "DEF" : key === "4" ? "GHI" : key === "5" ? "JKL" : key === "6" ? "MNO" : key === "7" ? "PQRS" : key === "8" ? "TUV" : key === "9" ? "WXYZ" : key === "0" ? "+" : ""}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Agent Transfer button (prominent) if configured */}
                {transferOpt && (
                  <button onClick={() => handleRespond(transferOpt)}
                    className="w-full py-3 rounded-2xl font-semibold text-purple-200 text-sm transition-all active:scale-95 hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.35)" }}>
                    <Bot className="w-4 h-4 text-purple-300" />
                    {transferOpt.label}
                  </button>
                )}

                {/* Voice recording */}
                <div className="flex gap-3">
                  <button onClick={isRecording ? stopRecording : startRecording}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-medium transition-all active:scale-95"
                    style={{
                      background: isRecording ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                      border: isRecording ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      color: isRecording ? "#f87171" : "rgba(255,255,255,0.4)",
                    }}>
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    {isRecording ? "Stop Recording" : "Voice Note"}
                    {isRecording && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
                  </button>
                  {voiceNote && (
                    <audio src={voiceNote} controls className="flex-1 h-10 rounded-xl"
                      style={{ filter: "invert(0.8) hue-rotate(160deg)" }} />
                  )}
                </div>

                {/* Mute + End row */}
                <div className="flex items-center gap-3">
                  <button onClick={toggleMute} className="flex flex-col items-center gap-1.5 group" title={isMuted ? "Unmute" : "Mute"}>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${isMuted ? "bg-red-500/80" : "bg-white/10 hover:bg-white/15"}`}
                      style={{ border: isMuted ? "2px solid rgba(239,68,68,0.5)" : "2px solid rgba(255,255,255,0.1)" }}>
                      {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white/60" />}
                    </div>
                    <span className="text-white/30 text-[10px] uppercase tracking-wider">{isMuted ? "MUTED" : "MUTE"}</span>
                  </button>
                  <button onClick={handleEndCall}
                    className="flex-1 py-4 rounded-2xl font-semibold text-white text-sm transition-all active:scale-95 hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ background: "rgba(239,68,68,0.85)" }}>
                    <PhoneOff className="w-4 h-4" />
                    কল শেষ করুন
                  </button>
                </div>
              </div>
            )}

            {/* DONE — back to store */}
            {callState === "done" && session?.ecommerceSiteUrl && (
              <a href={session.ecommerceSiteUrl}
                className="block w-full py-4 rounded-2xl font-semibold text-[#0a0c14] text-sm text-center transition-all hover:opacity-90"
                style={{ background: "#00d4c8" }}>
                Back to Store
              </a>
            )}

            {!isOverlay && (
              <p className="text-center text-white/15 text-[10px] pt-2">
                Powered by {config?.companyName || "SOFTWORKS IT FARM"}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
