import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { Phone, PhoneOff, CheckCircle2, XCircle, Loader2, Volume2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL || (import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "");

interface SessionConfig {
  session: {
    token: string;
    orderId: string;
    customerName: string | null;
    orderAmount: string | null;
    orderDetails: string | null;
    status: string;
  };
  config: {
    companyName: string;
    welcomeAudioUrl: string | null;
    menuText: string | null;
    confirmAudioUrl: string | null;
    confirmText: string | null;
    cancelAudioUrl: string | null;
    cancelText: string | null;
  };
}

type CallState = "loading" | "ringing" | "connected" | "menu" | "processing" | "confirmed" | "cancelled" | "expired" | "error";

export function CallPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SessionConfig | null>(null);
  const [callState, setCallState] = useState<CallState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [dots, setDots] = useState(".");
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
        if (d.session.status === "completed") {
          setData(d);
          setCallState(d.session.actionTaken === "confirmed" ? "confirmed" : "cancelled");
          return;
        }
        setData(d);
        setCallState("ringing");
        setTimeout(() => setCallState("connected"), 2500);
        setTimeout(() => {
          setCallState("menu");
          playAudio(d.config.welcomeAudioUrl);
        }, 3500);
      })
      .catch(() => { setCallState("error"); setErrorMsg("Call session not found"); });
  }, [token]);

  useEffect(() => {
    if (callState !== "ringing") return;
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(t);
  }, [callState]);

  function playAudio(url: string | null | undefined) {
    if (!url) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    const a = new Audio(url);
    audioRef.current = a;
    a.play().catch(() => {});
  }

  async function respond(dtmf: string) {
    if (!data || callState !== "menu") return;
    setCallState("processing");
    try {
      const r = await fetch(`${API}/api/voice-calls/session/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dtmf }),
      });
      const result = await r.json();
      if (dtmf === "1") {
        playAudio(data.config.confirmAudioUrl);
        setCallState("confirmed");
      } else if (dtmf === "2") {
        playAudio(data.config.cancelAudioUrl);
        setCallState("cancelled");
      }
    } catch {
      setCallState("error");
      setErrorMsg("Connection error. Please try again.");
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (callState === "menu") {
        if (e.key === "1") respond("1");
        if (e.key === "2") respond("2");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [callState, data]);

  const renderContent = () => {
    if (callState === "loading") {
      return (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
          <p className="text-white/60">Connecting{dots}</p>
        </div>
      );
    }

    if (callState === "expired") {
      return (
        <div className="flex flex-col items-center gap-4">
          <PhoneOff className="w-16 h-16 text-red-400" />
          <h2 className="text-2xl font-bold text-white">Session Expired</h2>
          <p className="text-white/60 text-center">This call link has expired. Please contact the store for a new link.</p>
        </div>
      );
    }

    if (callState === "error") {
      return (
        <div className="flex flex-col items-center gap-4">
          <XCircle className="w-16 h-16 text-red-400" />
          <h2 className="text-2xl font-bold text-white">Connection Failed</h2>
          <p className="text-white/60 text-center">{errorMsg}</p>
        </div>
      );
    }

    if (callState === "ringing") {
      return (
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping scale-150" />
            <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping scale-125 delay-150" />
            <div className="w-24 h-24 rounded-full bg-indigo-600/30 border-2 border-indigo-400/50 flex items-center justify-center">
              <Phone className="w-10 h-10 text-indigo-300 animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-white/50 text-sm uppercase tracking-widest mb-1">Incoming Call</p>
            <h2 className="text-3xl font-bold text-white">{data?.config.companyName}</h2>
            <p className="text-white/60 mt-2">Order #{data?.session.orderId}</p>
          </div>
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Ringing{dots}
          </div>
        </div>
      );
    }

    if (callState === "connected") {
      return (
        <div className="flex flex-col items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-green-600/30 border-2 border-green-400/50 flex items-center justify-center">
            <Phone className="w-10 h-10 text-green-300" />
          </div>
          <div className="text-center">
            <p className="text-green-400 text-sm uppercase tracking-widest mb-1">Connected</p>
            <h2 className="text-3xl font-bold text-white">{data?.config.companyName}</h2>
          </div>
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Volume2 className="w-4 h-4" />
            Loading message...
          </div>
        </div>
      );
    }

    if (callState === "menu") {
      return (
        <div className="flex flex-col items-center gap-6 w-full max-w-xs">
          <div className="w-20 h-20 rounded-full bg-green-600/30 border-2 border-green-400/50 flex items-center justify-center">
            <Phone className="w-9 h-9 text-green-300" />
          </div>
          <div className="text-center">
            <p className="text-green-400 text-xs uppercase tracking-widest mb-1">Active Call</p>
            <h2 className="text-2xl font-bold text-white">{data?.config.companyName}</h2>
            {data?.session.customerName && (
              <p className="text-white/50 text-sm mt-1">{data.session.customerName}</p>
            )}
          </div>

          <div className="w-full bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Order</p>
            <p className="text-white font-semibold">#{data?.session.orderId}</p>
            {data?.session.orderAmount && (
              <p className="text-indigo-300 text-sm">Amount: {data.session.orderAmount}</p>
            )}
            {data?.session.orderDetails && (
              <p className="text-white/50 text-xs mt-1">{data.session.orderDetails}</p>
            )}
          </div>

          <div className="w-full bg-white/5 rounded-xl p-4 border border-white/10 text-center">
            <p className="text-white/70 text-sm leading-relaxed">
              {data?.config.menuText || "Press 1 to confirm. Press 2 to cancel."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <button
              onClick={() => respond("1")}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-green-500/20 border-2 border-green-400/50 hover:bg-green-500/30 active:scale-95 transition-all duration-150 group"
            >
              <span className="text-4xl font-bold text-green-300 group-hover:scale-110 transition-transform">1</span>
              <span className="text-green-300 text-xs font-medium uppercase tracking-wide">Confirm</span>
            </button>
            <button
              onClick={() => respond("2")}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-red-500/20 border-2 border-red-400/50 hover:bg-red-500/30 active:scale-95 transition-all duration-150 group"
            >
              <span className="text-4xl font-bold text-red-300 group-hover:scale-110 transition-transform">2</span>
              <span className="text-red-300 text-xs font-medium uppercase tracking-wide">Cancel</span>
            </button>
          </div>

          <p className="text-white/20 text-xs">You can also press 1 or 2 on your keyboard</p>
        </div>
      );
    }

    if (callState === "processing") {
      return (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
          <p className="text-white/60">Processing your response...</p>
        </div>
      );
    }

    if (callState === "confirmed") {
      return (
        <div className="flex flex-col items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-green-600/20 border-2 border-green-400/50 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-green-300">Order Confirmed!</h2>
            <p className="text-white/60 mt-2">
              {data?.config.confirmText || "Your order has been successfully confirmed. Thank you!"}
            </p>
          </div>
          <div className="w-full bg-green-500/10 rounded-xl p-4 border border-green-400/20 text-center">
            <p className="text-white/50 text-sm">Order #{data?.session.orderId}</p>
            {data?.session.ecommerceSiteUrl && (
              <a href={data.session.ecommerceSiteUrl}
                className="mt-3 inline-block text-indigo-400 text-sm hover:text-indigo-300 underline">
                Back to Store
              </a>
            )}
          </div>
        </div>
      );
    }

    if (callState === "cancelled") {
      return (
        <div className="flex flex-col items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-red-600/20 border-2 border-red-400/50 flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-400" />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-red-300">Order Cancelled</h2>
            <p className="text-white/60 mt-2">
              {data?.config.cancelText || "Your order has been cancelled."}
            </p>
          </div>
          <div className="w-full bg-red-500/10 rounded-xl p-4 border border-red-400/20 text-center">
            <p className="text-white/50 text-sm">Order #{data?.session.orderId}</p>
            {data?.session.ecommerceSiteUrl && (
              <a href={data.session.ecommerceSiteUrl}
                className="mt-3 inline-block text-indigo-400 text-sm hover:text-indigo-300 underline">
                Back to Store
              </a>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4"
      style={{ background: "radial-gradient(ellipse at top, #1a1040 0%, #0a0a1a 70%)" }}>
      <div className="w-full max-w-sm">
        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
          <div className="relative flex flex-col items-center gap-6 min-h-[320px] justify-center">
            {renderContent()}
          </div>
        </div>
        <p className="text-center text-white/20 text-xs mt-4">
          Powered by {data?.config.companyName || "SOFTWORKS IT FARM"}
        </p>
      </div>
    </div>
  );
}
