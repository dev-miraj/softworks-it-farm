import { useEffect, useRef, useState } from "react";
import { useParams, useSearch } from "wouter";
import { Phone, PhoneOff, CheckCircle2, XCircle, Loader2, Volume2, Package, Truck } from "lucide-react";

import { API } from "@/lib/apiUrl";

interface VoiceOption {
  key: string;
  label: string;
  action: string;
  color: "green" | "red" | "yellow" | "blue" | "purple";
  responseText: string;
  responseAudioUrl: string | null;
  enabled: boolean;
}
interface Product { name: string; price: number; quantity: number; deliveryDays?: number; }
interface Session {
  token: string; orderId: string; customerName: string | null; orderAmount: string | null;
  orderDetails: string | null; status: string; actionTaken: string | null;
  products: Product[] | null; deliveryInfo: string | null; ecommerceSiteUrl: string | null;
}
interface Config {
  companyName: string; logoUrl: string | null; welcomeAudioUrl: string | null;
  welcomeText: string | null; announcementAudioUrl: string | null; announcementText: string | null;
  options: VoiceOption[];
}

type CallState = "loading" | "ringing" | "connected" | "menu" | "processing" | "done" | "expired" | "error";

const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  green:  { bg: "bg-green-500/20",  border: "border-green-400/50",  text: "text-green-300" },
  red:    { bg: "bg-red-500/20",    border: "border-red-400/50",    text: "text-red-300" },
  yellow: { bg: "bg-yellow-500/20", border: "border-yellow-400/50", text: "text-yellow-300" },
  blue:   { bg: "bg-blue-500/20",   border: "border-blue-400/50",   text: "text-blue-300" },
  purple: { bg: "bg-purple-500/20", border: "border-purple-400/50", text: "text-purple-300" },
};

function postMsgToParent(data: Record<string, unknown>) {
  try { window.parent.postMessage({ sw_call: data.sw_call, ...data }, "*"); } catch {}
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
  const [dots, setDots] = useState(".");
  const [elapsed, setElapsed] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function playAudio(url: string | null | undefined, onEnd?: () => void) {
    if (!url) { onEnd?.(); return; }
    if (audioRef.current) { audioRef.current.pause(); }
    const a = new Audio(url);
    audioRef.current = a;
    if (onEnd) a.addEventListener("ended", onEnd, { once: true });
    a.play().catch(() => onEnd?.());
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
        setTimeout(() => setCallState("connected"), 2200);
        setTimeout(() => {
          setCallState("menu");
          playAudio(d.config.welcomeAudioUrl, () => {
            setTimeout(() => playAudio(d.config.announcementAudioUrl), 400);
          });
        }, 3200);
      })
      .catch(() => { setCallState("error"); setErrorMsg("Call session not found or has expired."); });
  }, [token]);

  useEffect(() => {
    if (callState !== "ringing") return;
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(t);
  }, [callState]);

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
      playAudio(option.responseAudioUrl);
      setCallState("done");
      setTimeout(() => {
        postMsgToParent({ sw_call: "completed", action: option.action, orderId: session.orderId, dtmfInput: option.key });
      }, 2500);
    } catch {
      setCallState("error");
      setErrorMsg("Connection error. Please try again.");
    }
  }

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const actionBg = (action: string) => {
    if (action === "confirmed") return "from-green-950 to-[#0a0a1a]";
    if (action === "cancelled") return "from-red-950 to-[#0a0a1a]";
    return "from-indigo-950 to-[#0a0a1a]";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-all duration-700"
      style={{ background: `radial-gradient(ellipse at top, ${callState === "done" && chosenOption?.action === "confirmed" ? "#052e16" : callState === "done" ? "#450a0a" : "#1a1040"} 0%, #0a0a1a 70%)` }}>
      <div className="w-full max-w-sm">
        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-white/3 to-transparent pointer-events-none" />

          {/* Header bar */}
          <div className="relative bg-black/20 border-b border-white/10 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {config?.logoUrl ? (
                <img src={config.logoUrl} className="h-5 w-auto rounded" alt="logo" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              )}
              <span className="text-white/70 text-xs font-medium truncate max-w-[180px]">
                {config?.companyName || "Loading..."}
              </span>
            </div>
            {callState === "menu" && (
              <span className="text-white/30 text-xs font-mono">{fmtTime(elapsed)}</span>
            )}
          </div>

          <div className="relative p-6">
            {/* LOADING */}
            {callState === "loading" && (
              <div className="flex flex-col items-center gap-4 py-12">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
                <p className="text-white/50 text-sm">Connecting...</p>
              </div>
            )}

            {/* EXPIRED */}
            {callState === "expired" && (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <PhoneOff className="w-14 h-14 text-white/20" />
                <h2 className="text-xl font-bold text-white">Session Expired</h2>
                <p className="text-white/40 text-sm">This call link has expired.</p>
              </div>
            )}

            {/* ERROR */}
            {callState === "error" && (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <XCircle className="w-14 h-14 text-red-400" />
                <h2 className="text-xl font-bold text-white">Connection Failed</h2>
                <p className="text-white/50 text-sm">{errorMsg}</p>
              </div>
            )}

            {/* RINGING */}
            {callState === "ringing" && (
              <div className="flex flex-col items-center gap-6 py-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-indigo-500/15 animate-ping scale-[2]" />
                  <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping scale-[1.5] [animation-delay:300ms]" />
                  <div className="w-24 h-24 rounded-full bg-indigo-600/25 border-2 border-indigo-400/40 flex items-center justify-center">
                    <Phone className="w-10 h-10 text-indigo-300 animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-2">Incoming Call</p>
                  <h2 className="text-2xl font-bold text-white">{config?.companyName}</h2>
                  <p className="text-white/50 text-sm mt-1">Order #{session?.orderId}</p>
                </div>
                <p className="text-white/30 text-sm">{dots}</p>
              </div>
            )}

            {/* CONNECTED */}
            {callState === "connected" && (
              <div className="flex flex-col items-center gap-5 py-6">
                <div className="w-20 h-20 rounded-full bg-green-600/25 border-2 border-green-400/40 flex items-center justify-center">
                  <Phone className="w-9 h-9 text-green-300" />
                </div>
                <div className="text-center">
                  <p className="text-green-400 text-xs uppercase tracking-widest mb-2">Connected</p>
                  <h2 className="text-2xl font-bold text-white">{config?.companyName}</h2>
                </div>
                <div className="flex items-center gap-2 text-white/30 text-xs">
                  <Volume2 className="w-3.5 h-3.5" /> Playing message...
                </div>
              </div>
            )}

            {/* MENU */}
            {callState === "menu" && config && session && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-xs uppercase tracking-widest">Active Call</span>
                  </div>
                  {session.customerName && (
                    <span className="text-white/40 text-xs truncate max-w-[120px]">{session.customerName}</span>
                  )}
                </div>

                {/* Products */}
                {session.products && session.products.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Package className="w-3.5 h-3.5 text-white/40" />
                      <p className="text-white/40 text-xs uppercase tracking-wider">Order #{session.orderId}</p>
                    </div>
                    {session.products.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-white/30 text-xs w-4 text-right">{p.quantity}×</span>
                          <span className="text-white/80 truncate">{p.name}</span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="text-indigo-300 text-xs">৳{(p.price * p.quantity).toLocaleString()}</span>
                          {p.deliveryDays && (
                            <p className="text-white/25 text-[10px]">{p.deliveryDays}d delivery</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-white/10 pt-2 flex justify-between text-sm">
                      <span className="text-white/50">Total</span>
                      <span className="text-white font-semibold">{session.orderAmount || `৳${session.products.reduce((s, p) => s + p.price * p.quantity, 0).toLocaleString()}`}</span>
                    </div>
                    {session.deliveryInfo && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Truck className="w-3 h-3 text-white/30" />
                        <span className="text-white/30 text-xs">{session.deliveryInfo}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* No products — simple order info */}
                {(!session.products || session.products.length === 0) && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-white/40 text-xs mb-1">Order #{session.orderId}</p>
                    {session.orderAmount && <p className="text-white font-semibold">{session.orderAmount}</p>}
                    {session.orderDetails && <p className="text-white/40 text-xs mt-0.5">{session.orderDetails}</p>}
                  </div>
                )}

                {/* Menu text */}
                <div className="bg-indigo-500/5 border border-indigo-400/15 rounded-xl px-4 py-3 text-center">
                  <p className="text-white/60 text-sm leading-relaxed">
                    {config.announcementText || "Please select an option below"}
                  </p>
                </div>

                {/* Key options */}
                <div className={`grid gap-3 ${(config.options?.filter(o => o.enabled !== false) || []).length <= 2 ? "grid-cols-2" : "grid-cols-2"}`}>
                  {(config.options || [])
                    .filter(o => o.enabled !== false)
                    .map(opt => {
                      const c = COLOR_MAP[opt.color] || COLOR_MAP.green;
                      return (
                        <button key={opt.key} onClick={() => handleRespond(opt)}
                          className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl ${c.bg} border-2 ${c.border} hover:opacity-90 active:scale-95 transition-all duration-150 group`}>
                          <span className={`text-3xl font-bold ${c.text} group-hover:scale-110 transition-transform`}>{opt.key}</span>
                          <span className={`${c.text} text-[11px] font-semibold uppercase tracking-wide text-center leading-tight`}>{opt.label}</span>
                        </button>
                      );
                    })}
                </div>
                <p className="text-center text-white/20 text-[11px]">Press a number key on your keyboard</p>
              </div>
            )}

            {/* PROCESSING */}
            {callState === "processing" && (
              <div className="flex flex-col items-center gap-4 py-12">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
                <p className="text-white/50 text-sm">Processing...</p>
              </div>
            )}

            {/* DONE */}
            {callState === "done" && chosenOption && (
              <div className="flex flex-col items-center gap-5 py-6 text-center">
                {chosenOption.action === "confirmed" ? (
                  <div className="w-20 h-20 rounded-full bg-green-600/20 border-2 border-green-400/40 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </div>
                ) : chosenOption.action === "cancelled" ? (
                  <div className="w-20 h-20 rounded-full bg-red-600/20 border-2 border-red-400/40 flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-400" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-indigo-600/20 border-2 border-indigo-400/40 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-indigo-400" />
                  </div>
                )}
                <div>
                  <h2 className={`text-2xl font-bold ${chosenOption.action === "confirmed" ? "text-green-300" : chosenOption.action === "cancelled" ? "text-red-300" : "text-indigo-300"}`}>
                    {chosenOption.label}
                  </h2>
                  <p className="text-white/50 text-sm mt-2 leading-relaxed">
                    {chosenOption.responseText}
                  </p>
                </div>
                <div className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm">
                  <p className="text-white/40">Order #{session?.orderId}</p>
                  {session?.ecommerceSiteUrl && (
                    <a href={session.ecommerceSiteUrl}
                      className="mt-2 inline-block text-indigo-400 text-xs hover:text-indigo-300">
                      ← Back to Store
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* DONE with no matched option */}
            {callState === "done" && !chosenOption && session?.status === "completed" && (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <CheckCircle2 className="w-14 h-14 text-green-400" />
                <h2 className="text-xl font-bold text-white">Response Recorded</h2>
                <p className="text-white/40 text-sm">Order #{session?.orderId}</p>
              </div>
            )}
          </div>
        </div>
        {!isOverlay && (
          <p className="text-center text-white/15 text-[11px] mt-3">
            Powered by {config?.companyName || "SOFTWORKS IT FARM"}
          </p>
        )}
      </div>
    </div>
  );
}
