import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearch } from "wouter";
import { Phone, PhoneOff, CheckCircle2, XCircle, Loader2, Package, Truck, Mic, MicOff } from "lucide-react";
import { API } from "@/lib/apiUrl";

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

type CallState = "loading" | "ringing" | "accepting" | "connected" | "menu" | "processing" | "done" | "expired" | "error";

function WaveformBars({ active }: { active: boolean }) {
  const bars = [0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.45, 0.75, 0.55];
  return (
    <div className="flex items-center justify-center gap-[3px] h-12">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            backgroundColor: "#00d4c8",
            height: active ? `${h * 48}px` : "8px",
            animation: active ? `waveBar 0.8s ease-in-out ${i * 0.08}s infinite alternate` : "none",
            transition: "height 0.3s ease",
            opacity: active ? 1 : 0.3,
          }}
        />
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
      <div
        className="relative w-28 h-28 rounded-full flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #1a1f2e 0%, #252b3a 100%)",
          border: state === "connected" ? "3px solid #00d4c8" : state === "ringing" ? "3px solid rgba(0,212,200,0.4)" : "3px solid rgba(255,255,255,0.1)",
          boxShadow: state === "connected" ? "0 0 30px rgba(0,212,200,0.3)" : "none",
        }}
      >
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
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const ringtone = useRingtone();

  function stopAudio() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (window.speechSynthesis?.speaking) { window.speechSynthesis.cancel(); }
  }

  function speakText(text: string | null | undefined, onEnd?: () => void) {
    if (!text?.trim()) { onEnd?.(); return; }
    if (!window.speechSynthesis) { onEnd?.(); return; }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.88; utt.pitch = 1.05; utt.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const isBangla = /[\u0980-\u09FF]/.test(text);
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
        setCallState("ringing");
        // Ringtone starts here (user must manually ACCEPT)
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
    const enabledOptions = (config.options || []).filter(o => o.enabled !== false);
    const handler = (e: KeyboardEvent) => {
      const opt = enabledOptions.find(o => o.key === e.key);
      if (opt) handleRespond(opt);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [callState, config]);

  async function handleRespond(option: VoiceOption) {
    if (!session || callState !== "menu") return;
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

  function handleEndCall() {
    stopAudio();
    postMsgToParent({ sw_call: "close" });
    setCallState("expired");
  }

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        setVoiceNote(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      rec.start();
      mediaRecRef.current = rec;
      setIsRecording(true);
    } catch {
      alert("Microphone access denied");
    }
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

  const bgGradient = callState === "done" && chosenOption?.action === "confirmed"
    ? "radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.08) 0%, #0a0c14 60%)"
    : callState === "done" && chosenOption?.action === "cancelled"
    ? "radial-gradient(ellipse at 30% 20%, rgba(239,68,68,0.06) 0%, #0a0c14 60%)"
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
      `}</style>
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: bgGradient, backgroundColor: "#0a0c14" }}
      >
        <div className="w-full max-w-[360px] px-5 py-8 flex flex-col items-center min-h-screen justify-between">

          {/* Top spacer */}
          <div className="h-8" />

          {/* Main card area */}
          <div className="flex flex-col items-center gap-6 w-full">

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
                }}>⚡ ধাপ ১/৩</div>
                <RingPulse state="ringing" />
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-white">
                    {config?.companyName || "SOFTWORKS AI"}
                  </h2>
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

            {/* ACCEPTING (কল কানেক্ট হচ্ছে) */}
            {callState === "accepting" && (
              <div className="flex flex-col items-center gap-6 py-8">
                <div className="absolute top-5 left-5" style={{
                  background: "rgba(0,212,200,0.1)", border: "1px solid rgba(0,212,200,0.25)",
                  borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#00d4c8", fontWeight: 600,
                }}>⚡ ধাপ ২/৩</div>
                <div className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg,#f59e0b,#fbbf24)",
                    boxShadow: "0 0 50px rgba(245,158,11,0.5)",
                    animation: "waveBar 1.5s ease-in-out infinite alternate",
                  }}>
                  <Phone className="w-10 h-10 text-white" />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">কল কানেক্ট হচ্ছে...</h2>
                  <p className="text-white/40 text-sm mt-2">রিং হচ্ছে, প্রতিনিধি কলটি রিসিভ করার জন্য তৈরি...</p>
                </div>
              </div>
            )}

            {/* CONNECTED */}
            {callState === "connected" && (
              <>
                <div className="absolute top-5 left-5" style={{
                  background: "rgba(0,212,200,0.1)", border: "1px solid rgba(0,212,200,0.25)",
                  borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#00d4c8", fontWeight: 600,
                }}>⚡ ধাপ ২/৩</div>
                <RingPulse state="connected" />
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-white">
                    {config?.companyName || "SOFTWORKS AI"}
                  </h2>
                  {session?.customerPhone && (
                    <p className="text-white/40 text-sm font-mono">{session.customerPhone}</p>
                  )}
                  <p className="text-xs font-semibold tracking-[0.2em] mt-3" style={{ color: "#00d4c8" }}>
                    সংযুক্ত হচ্ছে...
                  </p>
                </div>
                <div className="mt-2">
                  <WaveformBars active={true} />
                </div>
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
                  <p className="text-xs font-semibold tracking-[0.2em] mt-2" style={{ color: "#00d4c8" }}>
                    CONNECTED · {fmtTime(elapsed)}
                  </p>
                </div>

                <div className="mt-1">
                  <WaveformBars active={true} />
                </div>

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
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3 h-3 text-white/20" />
                        <span className="text-white/25 text-xs">{session.deliveryInfo}</span>
                      </div>
                    )}
                  </div>
                )}

                {(!session.products || session.products.length === 0) && session.orderDetails && (
                  <div className="w-full rounded-2xl p-4"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-white/30 text-xs mb-1">Order #{session.orderId}</p>
                    {session.orderAmount && <p className="text-white font-semibold">{session.orderAmount}</p>}
                    <p className="text-white/40 text-xs mt-1">{session.orderDetails}</p>
                  </div>
                )}

                {config.announcementText && (
                  <p className="text-white/40 text-sm text-center leading-relaxed px-2">
                    {config.announcementText}
                  </p>
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
                    <a href={session.ecommerceSiteUrl}
                      className="mt-2 inline-block text-xs hover:underline"
                      style={{ color: "#00d4c8" }}>
                      ← Back to Store
                    </a>
                  )}
                </div>

                {/* Voice note option on done */}
                {voiceNote && (
                  <div className="w-full rounded-2xl p-3" style={{ background: "rgba(0,212,200,0.05)", border: "1px solid rgba(0,212,200,0.2)" }}>
                    <p className="text-xs text-white/40 mb-2">Your voice note</p>
                    <audio src={voiceNote} controls className="w-full h-8" style={{ filter: "invert(1) hue-rotate(160deg)" }} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom action buttons */}
          <div className="w-full space-y-3 pb-4">

            {/* RINGING buttons */}
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
                <button onClick={() => {
                  ringtone.stop();
                  setCallState("accepting");
                  setTimeout(() => {
                    setCallState("connected");
                    setTimeout(() => {
                      setCallState("menu");
                      playAudio(config?.welcomeAudioUrl, () => {
                        setTimeout(() => playAudio(config?.announcementAudioUrl, undefined, config?.announcementText), 400);
                      }, config?.welcomeText);
                    }, 1400);
                  }, 1800);
                }}
                  className="flex flex-col items-center gap-2 group">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-90 group-hover:scale-105"
                    style={{ background: "rgba(16,185,129,0.9)", boxShadow: "0 0 30px rgba(16,185,129,0.5)", animation: "ringPulse 1.5s ease-in-out infinite" }}>
                    <Phone className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-white/40 text-[11px] uppercase tracking-wider">ACCEPT</span>
                </button>
              </div>
            )}

            {/* CONNECTED buttons (just waveform, no action) */}
            {callState === "connected" && (
              <div className="flex items-center justify-center gap-16">
                <button onClick={handleEndCall}
                  className="flex flex-col items-center gap-2 group">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-90"
                    style={{ background: "rgba(239,68,68,0.9)" }}>
                    <PhoneOff className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-white/40 text-[11px] uppercase tracking-wider">END</span>
                </button>
              </div>
            )}

            {/* MENU buttons — Confirm / Cancel / End Call */}
            {callState === "menu" && (
              <div className="space-y-3 w-full">

                {/* Keyboard shortcut key badges */}
                {enabledOptions.length > 0 && (
                  <div className="flex items-center justify-center gap-3 py-1">
                    {enabledOptions.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => handleRespond(opt)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all active:scale-95 hover:opacity-90 group"
                        style={{
                          background: opt.action === "confirmed"
                            ? "rgba(0,212,200,0.08)"
                            : opt.action === "cancelled"
                            ? "rgba(239,68,68,0.08)"
                            : "rgba(255,255,255,0.05)",
                          border: opt.action === "confirmed"
                            ? "1px solid rgba(0,212,200,0.25)"
                            : opt.action === "cancelled"
                            ? "1px solid rgba(239,68,68,0.25)"
                            : "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold font-mono"
                          style={{
                            background: opt.action === "confirmed"
                              ? "rgba(0,212,200,0.2)"
                              : opt.action === "cancelled"
                              ? "rgba(239,68,68,0.2)"
                              : "rgba(255,255,255,0.1)",
                            color: opt.action === "confirmed"
                              ? "#00d4c8"
                              : opt.action === "cancelled"
                              ? "#f87171"
                              : "rgba(255,255,255,0.6)",
                            boxShadow: opt.action === "confirmed"
                              ? "0 0 8px rgba(0,212,200,0.3), inset 0 1px 0 rgba(255,255,255,0.15)"
                              : opt.action === "cancelled"
                              ? "0 0 8px rgba(239,68,68,0.2), inset 0 1px 0 rgba(255,255,255,0.1)"
                              : "inset 0 1px 0 rgba(255,255,255,0.1)",
                          }}
                        >
                          {opt.key}
                        </span>
                        <span
                          className="text-xs font-medium"
                          style={{
                            color: opt.action === "confirmed"
                              ? "rgba(0,212,200,0.8)"
                              : opt.action === "cancelled"
                              ? "rgba(248,113,113,0.8)"
                              : "rgba(255,255,255,0.4)",
                          }}
                        >
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Main action buttons */}
                <div className="flex gap-3">
                  {confirmOpt && (
                    <button onClick={() => handleRespond(confirmOpt)}
                      className="flex-1 py-4 rounded-2xl font-semibold text-[#0a0c14] text-sm transition-all active:scale-95 hover:opacity-90"
                      style={{ background: "#00d4c8" }}>
                      {confirmOpt.label}
                    </button>
                  )}
                  {cancelOpt && (
                    <button onClick={() => handleRespond(cancelOpt)}
                      className="flex-1 py-4 rounded-2xl font-semibold text-white/80 text-sm transition-all active:scale-95 hover:opacity-90"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                      {cancelOpt.label}
                    </button>
                  )}
                  {enabledOptions
                    .filter(o => o.action !== "confirmed" && o.action !== "cancelled")
                    .map(opt => (
                      <button key={opt.key} onClick={() => handleRespond(opt)}
                        className="flex-1 py-4 rounded-2xl font-semibold text-white/80 text-sm transition-all active:scale-95"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {opt.label}
                      </button>
                    ))}
                </div>

                {/* Voice recording during call */}
                <div className="flex gap-3">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-medium transition-all active:scale-95"
                    style={{
                      background: isRecording ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                      border: isRecording ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      color: isRecording ? "#f87171" : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    {isRecording ? "Stop Recording" : "Voice Note"}
                    {isRecording && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    )}
                  </button>
                  {voiceNote && (
                    <audio src={voiceNote} controls className="flex-1 h-10 rounded-xl"
                      style={{ filter: "invert(0.8) hue-rotate(160deg)" }} />
                  )}
                </div>

                <button onClick={handleEndCall}
                  className="w-full py-4 rounded-2xl font-semibold text-white text-sm transition-all active:scale-95 hover:opacity-90"
                  style={{ background: "rgba(239,68,68,0.85)" }}>
                  End Call
                </button>
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

            {/* Powered by */}
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
