import { useState, useEffect, useRef, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Phone, Upload, Save, Settings, Volume2, Link2, CheckCircle2, Copy, Loader2, Play, Plus, Trash2, Sparkles, Wand2, Mic, MicOff, Square, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

import { API } from "@/lib/apiUrl";
const FRONTEND = typeof window !== "undefined" ? window.location.origin : "";

interface VoiceOption {
  key: string; label: string; action: string; color: "green" | "red" | "yellow" | "blue" | "purple";
  responseText: string; responseAudioUrl: string | null; enabled: boolean;
}
interface VoiceConfig {
  id: number; companyName: string; logoUrl: string | null; welcomeAudioUrl: string | null;
  welcomeText: string; announcementAudioUrl: string | null; announcementText: string;
  options: VoiceOption[]; ttsVoice: string; sessionExpiryMinutes: number; enabled: boolean;
}

const COLOR_OPTS = ["green", "red", "yellow", "blue", "purple"] as const;
const TTS_VOICES = ["nova", "alloy", "echo", "fable", "onyx", "shimmer"];
const DEFAULT_OPTION: VoiceOption = { key: "", label: "", action: "custom", color: "blue", responseText: "", responseAudioUrl: null, enabled: true };

function AudioRow({ label, desc, audioUrl, fieldKey, configId, onUpdated }: {
  label: string; desc: string; audioUrl: string | null; fieldKey: string;
  configId: number; onUpdated: (url: string) => void;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [genText, setGenText] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  async function startRecord() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      chunksRef.current = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const b = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(b); setRecordedUrl(URL.createObjectURL(b));
        stream.getTracks().forEach(t => t.stop());
      };
      rec.start(); mediaRecRef.current = rec; setIsRecording(true);
    } catch { toast({ title: "Mic access denied", variant: "destructive" }); }
  }

  function stopRecord() {
    mediaRecRef.current?.stop(); setIsRecording(false);
  }

  async function uploadRecording() {
    if (!recordedBlob) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("audio", recordedBlob, `rec-${Date.now()}.webm`);
    fd.append("field", fieldKey);
    try {
      const r = await fetch(`${API}/api/voice-calls/upload-audio`, { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onUpdated(d.url);
      setRecordedBlob(null); setRecordedUrl(null);
      toast({ title: "Recording uploaded!" });
    } catch (e) {
      toast({ title: "Upload failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setUploading(false); }
  }

  async function handleFile(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("audio", file);
    fd.append("field", fieldKey);
    try {
      const r = await fetch(`${API}/api/voice-calls/upload-audio`, { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onUpdated(d.url);
      toast({ title: "Audio uploaded!" });
    } catch (e) {
      toast({ title: "Upload failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setUploading(false); }
  }

  async function handleTts() {
    if (!genText.trim()) return;
    setGenLoading(true);
    try {
      const r = await fetch(`${API}/api/voice-calls/tts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: genText }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (d.useBrowserTts || !d.url) {
        window.speechSynthesis?.cancel();
        const utt = new SpeechSynthesisUtterance(genText);
        utt.rate = 0.95;
        const voices = window.speechSynthesis?.getVoices() || [];
        const v = voices.find(v => v.lang.startsWith("en")) || voices[0];
        if (v) utt.voice = v;
        window.speechSynthesis?.speak(utt);
        toast({ title: "Browser TTS preview", description: "Playing via browser voice. Upload an audio file to save permanently." });
      } else {
        onUpdated(d.url);
        toast({ title: "Voice generated!", description: "TTS audio saved." });
      }
    } catch (e) {
      toast({ title: "TTS failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setGenLoading(false); }
  }

  async function generateTtsAndSave(text: string) {
    if (!text.trim()) return null;
    const r = await fetch(`${API}/api/voice-calls/tts`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    if (d.useBrowserTts || !d.url) return null;
    return d.url as string;
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white text-sm font-medium">{label}</p>
          <p className="text-white/40 text-xs mt-0.5">{desc}</p>
        </div>
        {audioUrl && (
          <button onClick={() => new Audio(audioUrl).play()} className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 transition shrink-0 ml-2">
            <Play className="w-3.5 h-3.5 text-indigo-400" />
          </button>
        )}
      </div>
      {audioUrl ? (
        <audio controls src={audioUrl} className="w-full h-8" />
      ) : (
        <div className="border border-dashed border-white/15 rounded-lg py-3 text-center">
          <Volume2 className="w-4 h-4 text-white/20 mx-auto mb-1" />
          <p className="text-white/25 text-xs">No audio</p>
        </div>
      )}
      <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 border-white/15 text-white/60 text-xs" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
          Upload File
        </Button>
        <Button size="sm" variant="outline"
          className={`border-white/15 text-xs px-3 ${isRecording ? "bg-red-500/20 border-red-400/40 text-red-300" : "text-white/60"}`}
          onClick={isRecording ? stopRecord : startRecord}>
          {isRecording ? <><MicOff className="w-3 h-3 mr-1" /> Stop</> : <><Mic className="w-3 h-3 mr-1" /> Record</>}
          {isRecording && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />}
        </Button>
      </div>
      {recordedUrl && (
        <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-400/20 rounded-lg p-2">
          <audio src={recordedUrl} controls className="flex-1 h-7" />
          <Button size="sm" className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs px-3 h-7 border border-teal-400/30" disabled={uploading} onClick={uploadRecording}>
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
            Save
          </Button>
        </div>
      )}
      <div className="flex gap-2">
        <Input placeholder="Type text to generate AI voice..." value={genText} onChange={e => setGenText(e.target.value)}
          className="bg-white/5 border-white/10 text-white text-xs h-8 flex-1" />
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs px-3 h-8" disabled={genLoading || !genText.trim()} onClick={handleTts}>
          {genLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        </Button>
      </div>
    </div>
  );
}

const DEMO_PRODUCTS = [
  { name: "প্রিমিয়াম কটন টি-শার্ট", price: 850, quantity: 2, deliveryDays: 3 },
  { name: "রানিং শু (Size 42)", price: 1200, quantity: 1, deliveryDays: 5 },
];

function launchCallOverlay(token: string) {
  const scriptId = "sw-call-widget-script";
  function showIt() {
    const sw = (window as any).SoftworksCall;
    if (sw) {
      sw.configure({ frontendUrl: FRONTEND });
      sw.show(token, {
        onComplete: (r: any) => console.log("[SWCall] completed:", r),
      });
    }
  }
  if (document.getElementById(scriptId)) {
    showIt();
  } else {
    const s = document.createElement("script");
    s.id = scriptId;
    s.src = `${API}/api/voice-calls/widget.js`;
    s.onload = showIt;
    document.head.appendChild(s);
  }
}

function TestPanel() {
  const { toast } = useToast();
  const [orderId, setOrderId] = useState("DEMO-001");
  const [customerName, setCustomerName] = useState("করিম সাহেব");
  const [customerPhone, setCustomerPhone] = useState("+8801707384005");
  const [amount, setAmount] = useState("৳ 2,900");
  const [callToken, setCallToken] = useState("");
  const [loading, setLoading] = useState(false);

  async function createTestCall() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/voice-calls/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId, customerName, customerPhone, orderAmount: amount,
          products: DEMO_PRODUCTS,
          deliveryInfo: "৩-৫ কার্যদিবসের মধ্যে ডেলিভারি",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setCallToken(d.token);
      launchCallOverlay(d.token);
      toast({ title: "টেস্ট কল শুরু হয়েছে!", description: "Call overlay এখন দেখা যাচ্ছে।" });
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setLoading(false); }
  }

  const callUrl = callToken ? `${FRONTEND}/call/${callToken}` : "";

  return (
    <div className="space-y-5">

      {/* AI Voice Demo Page Banner */}
      <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "linear-gradient(135deg,rgba(0,212,200,0.12),rgba(79,70,229,0.1))", border: "1px solid rgba(0,212,200,0.25)" }}>
        <Globe className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#00d4c8" }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "#00d4c8" }}>পাবলিক AI Calling Demo পেজ</p>
          <p className="text-xs mt-0.5 mb-3" style={{ color: "rgba(0,212,200,0.6)" }}>
            এই URL টি client-দের শেয়ার করুন — ভিজিট করলে সব package ও interactive demo দেখতে পাবেন।
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-black/30 rounded-lg px-3 py-2 truncate" style={{ color: "rgba(255,255,255,0.7)" }}>
              {FRONTEND}/ai-voice
            </code>
            <button onClick={() => navigator.clipboard.writeText(`${FRONTEND}/ai-voice`)}
              className="p-2 rounded-lg flex-shrink-0"
              style={{ background: "rgba(0,212,200,0.15)", color: "#00d4c8" }}
              title="Copy link">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <a href={`${FRONTEND}/ai-voice`} target="_blank" rel="noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
              style={{ background: "rgba(0,212,200,0.2)", color: "#00d4c8" }}>
              Open ↗
            </a>
          </div>
        </div>
      </div>

      {/* Demo info banner */}
      <div className="bg-teal-500/10 border border-teal-400/20 rounded-xl px-4 py-3 flex items-start gap-3">
        <Phone className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-teal-300 text-sm font-medium">Live Preview Mode</p>
          <p className="text-teal-400/60 text-xs mt-0.5">
            নিচের demo order details দিয়ে "Create Test Call" চাপুন — সরাসরি এই পেজেই call overlay দেখা যাবে।
          </p>
        </div>
      </div>

      {/* Demo order card */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <h4 className="text-white/50 text-xs uppercase tracking-wider font-semibold">Demo Order Info</h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Order ID", value: orderId, set: setOrderId },
            { label: "Customer Name", value: customerName, set: setCustomerName },
            { label: "Phone Number", value: customerPhone, set: setCustomerPhone },
            { label: "Order Amount", value: amount, set: setAmount },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="text-xs text-white/35 mb-1 block">{label}</label>
              <Input value={value} onChange={e => set(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-sm" />
            </div>
          ))}
        </div>

        {/* Demo products preview */}
        <div className="rounded-lg p-3 space-y-1.5" style={{ background: "rgba(0,212,200,0.05)", border: "1px solid rgba(0,212,200,0.1)" }}>
          <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">Demo Products (pre-filled)</p>
          {DEMO_PRODUCTS.map((p, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-white/60">{p.quantity}× {p.name}</span>
              <span className="text-white/40">৳{(p.price * p.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="border-t border-white/5 pt-1.5 flex justify-between text-xs font-semibold">
            <span className="text-white/40">Total</span>
            <span className="text-teal-400">৳{DEMO_PRODUCTS.reduce((s, p) => s + p.price * p.quantity, 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <Button onClick={createTestCall} disabled={loading}
        className="bg-teal-500 hover:bg-teal-400 text-black font-bold w-full py-5 text-base">
        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Phone className="w-5 h-5 mr-2" />}
        Create Test Call — দেখুন কেমন লাগে
      </Button>

      {callToken && (
        <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-xl p-4 space-y-3">
          <p className="text-emerald-300 text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Call created! Overlay টা এখন দেখা যাচ্ছে।
          </p>
          <div className="flex items-center gap-2">
            <Input value={callUrl} readOnly className="bg-white/5 border-white/10 text-white/40 text-xs flex-1" />
            <button onClick={() => navigator.clipboard.writeText(callUrl)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20" title="Copy link">
              <Copy className="w-3.5 h-3.5 text-white/60" />
            </button>
            <button onClick={() => launchCallOverlay(callToken)}
              className="px-3 py-2 rounded-lg bg-teal-500/20 text-teal-300 text-xs font-medium hover:bg-teal-500/30 transition-all">
              Show Again
            </button>
          </div>
        </div>
      )}

      {/* Widget integration code */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5" /> Integration Widget Code
        </h4>
        <pre className="text-xs text-green-300 bg-black/40 rounded-lg p-3 overflow-x-auto font-mono leading-relaxed">
{`<script src="${API}/api/voice-calls/widget.js"></script>
<script>
SoftworksCall.configure({ frontendUrl: '${FRONTEND}' });

// আপনার সার্ভার থেকে token নিয়ে:
SoftworksCall.show(token, {
  onComplete: function(result) {
    if (result.action === 'confirmed') {
      // অর্ডার confirm হয়েছে
      console.log('Order confirmed:', result.orderId);
    }
  }
});
</script>`}
        </pre>
        <button
          onClick={() => navigator.clipboard.writeText(
            `<script src="${API}/api/voice-calls/widget.js"></script>\n<script>\nSoftworksCall.configure({ frontendUrl: '${FRONTEND}' });\nSoftworksCall.show(token, { onComplete: function(r) { console.log(r); } });\n</script>`
          )}
          className="mt-2 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-all">
          <Copy className="w-3 h-3" /> Copy code
        </button>
      </div>
    </div>
  );
}

export function VoiceCallConfigPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<VoiceConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "audio" | "keys" | "test">("general");
  const [editingOption, setEditingOption] = useState<number | null>(null);
  const [ttsLoading, setTtsLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetch(`${API}/api/voice-calls/config`)
      .then(r => r.json()).then(setConfig)
      .catch(() => toast({ title: "Failed to load", variant: "destructive" }));
  }, []);

  async function saveConfig() {
    if (!config) return;
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/voice-calls/config`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: config.companyName, welcomeText: config.welcomeText, announcementText: config.announcementText, options: config.options, ttsVoice: config.ttsVoice, sessionExpiryMinutes: config.sessionExpiryMinutes, enabled: config.enabled }),
      });
      setConfig(await r.json());
      toast({ title: "Saved!" });
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  async function generateTtsForOption(idx: number, text: string) {
    if (!text.trim() || !config) return;
    setTtsLoading(p => ({ ...p, [idx]: true }));
    try {
      const r = await fetch(`${API}/api/voice-calls/tts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: config.ttsVoice }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (d.useBrowserTts || !d.url) {
        window.speechSynthesis?.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = 0.95;
        const voices = window.speechSynthesis?.getVoices() || [];
        const v = voices.find(v => v.lang.startsWith("en")) || voices[0];
        if (v) utt.voice = v;
        window.speechSynthesis?.speak(utt);
        toast({ title: "Browser TTS preview", description: "Audio played via browser. Set OPENAI_API_KEY to save audio files." });
      } else {
        const opts = [...config.options];
        opts[idx] = { ...opts[idx], responseAudioUrl: d.url };
        setConfig({ ...config, options: opts });
        toast({ title: "Voice generated!" });
      }
    } catch (e) { toast({ title: "TTS failed", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setTtsLoading(p => ({ ...p, [idx]: false })); }
  }

  function updateOption(idx: number, patch: Partial<VoiceOption>) {
    if (!config) return;
    const opts = [...config.options];
    opts[idx] = { ...opts[idx], ...patch };
    setConfig({ ...config, options: opts });
  }

  function addOption() {
    if (!config) return;
    const usedKeys = config.options.map(o => parseInt(o.key)).filter(n => !isNaN(n));
    const nextKey = (usedKeys.length > 0 ? Math.max(...usedKeys) + 1 : 3).toString();
    setConfig({ ...config, options: [...config.options, { ...DEFAULT_OPTION, key: nextKey }] });
    setEditingOption(config.options.length);
  }

  const tabs = [
    { key: "general" as const, label: "General", icon: Settings },
    { key: "audio" as const, label: "Audio & TTS", icon: Volume2 },
    { key: "keys" as const, label: "Key Options", icon: Phone },
    { key: "test" as const, label: "Test & Embed", icon: Link2 },
  ];

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Phone className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Call Configuration</h1>
            <p className="text-white/40 text-sm">Configure voices, key options, and messages</p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit border border-white/10">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? "bg-indigo-600 text-white" : "text-white/50 hover:text-white"}`}>
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>

        {!config ? (
          <div className="flex items-center gap-3 text-white/40 p-8"><Loader2 className="w-5 h-5 animate-spin" /> Loading...</div>
        ) : (
          <>
            {/* GENERAL TAB */}
            {activeTab === "general" && (
              <div className="space-y-5">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold text-sm">General Settings</h3>
                    <div className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${config.enabled ? "bg-indigo-600" : "bg-white/10"}`}
                      onClick={() => setConfig({ ...config, enabled: !config.enabled })}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${config.enabled ? "left-5" : "left-0.5"}`} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/40 text-xs mb-1.5 block">Company Name</label>
                      <Input value={config.companyName || ""} onChange={e => setConfig({ ...config, companyName: e.target.value })}
                        className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs mb-1.5 block">Session Expiry (min)</label>
                      <Input type="number" value={config.sessionExpiryMinutes} min={5} max={1440}
                        onChange={e => setConfig({ ...config, sessionExpiryMinutes: parseInt(e.target.value) })}
                        className="bg-white/5 border-white/10 text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs mb-1.5 block">Welcome Text (shown/spoken when call connects)</label>
                    <Textarea value={config.welcomeText || ""} onChange={e => setConfig({ ...config, welcomeText: e.target.value })}
                      className="bg-white/5 border-white/10 text-white" rows={2} />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs mb-1.5 block">Announcement Text (menu instruction)</label>
                    <Textarea value={config.announcementText || ""} onChange={e => setConfig({ ...config, announcementText: e.target.value })}
                      className="bg-white/5 border-white/10 text-white" rows={2} />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs mb-1.5 block">TTS Voice (for generating audio)</label>
                    <div className="flex gap-2 flex-wrap">
                      {TTS_VOICES.map(v => (
                        <button key={v} onClick={() => setConfig({ ...config, ttsVoice: v })}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${config.ttsVoice === v ? "bg-purple-600 text-white" : "bg-white/5 text-white/50 hover:text-white border border-white/10"}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <Button onClick={saveConfig} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Save
                </Button>
              </div>
            )}

            {/* AUDIO TAB */}
            {activeTab === "audio" && (
              <div className="space-y-4">
                <div className="bg-indigo-500/10 border border-indigo-400/20 rounded-xl px-4 py-3 text-sm text-indigo-300">
                  🔊 <strong>Browser TTS active</strong> — Text-to-speech works using the browser's built-in voice engine. No API key needed. Upload custom audio files for higher quality.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <AudioRow label="Welcome Audio" desc="Plays when call starts" audioUrl={config.welcomeAudioUrl} fieldKey="welcome" configId={config.id}
                    onUpdated={url => setConfig({ ...config, welcomeAudioUrl: url })} />
                  <AudioRow label="Announcement Audio" desc="Plays after welcome (menu instructions)" audioUrl={config.announcementAudioUrl} fieldKey="announcement" configId={config.id}
                    onUpdated={url => setConfig({ ...config, announcementAudioUrl: url })} />
                </div>
              </div>
            )}

            {/* KEY OPTIONS TAB */}
            {activeTab === "keys" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-white/40 text-sm">Configure what happens when customer presses each key.</p>
                  <Button size="sm" onClick={addOption} className="bg-indigo-600 hover:bg-indigo-700 text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Key
                  </Button>
                </div>
                {(config.options || []).map((opt, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                          ${opt.color === "green" ? "bg-green-500/20 text-green-300" : opt.color === "red" ? "bg-red-500/20 text-red-300" : opt.color === "yellow" ? "bg-yellow-500/20 text-yellow-300" : opt.color === "blue" ? "bg-blue-500/20 text-blue-300" : "bg-purple-500/20 text-purple-300"}`}>
                          {opt.key || "?"}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{opt.label || "Unnamed Option"}</p>
                          <p className="text-white/30 text-xs">Action: {opt.action}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-4 rounded-full cursor-pointer transition-colors ${opt.enabled !== false ? "bg-indigo-600" : "bg-white/10"}`}
                          onClick={() => updateOption(idx, { enabled: opt.enabled === false })}>
                          <div className={`w-3 h-3 rounded-full bg-white mt-0.5 transition-all ${opt.enabled !== false ? "ml-4" : "ml-0.5"}`} />
                        </div>
                        <button onClick={() => setEditingOption(editingOption === idx ? null : idx)}
                          className="text-white/40 hover:text-white text-xs border border-white/10 rounded px-2 py-0.5">
                          {editingOption === idx ? "Close" : "Edit"}
                        </button>
                        <button onClick={() => { const opts = config.options.filter((_, i) => i !== idx); setConfig({ ...config, options: opts }); }}
                          className="p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {editingOption === idx && (
                      <div className="space-y-3 pt-3 border-t border-white/10">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-white/40 text-xs mb-1 block">Key</label>
                            <Input value={opt.key} onChange={e => updateOption(idx, { key: e.target.value })}
                              className="bg-white/5 border-white/10 text-white text-sm" placeholder="1" maxLength={1} />
                          </div>
                          <div>
                            <label className="text-white/40 text-xs mb-1 block">Label</label>
                            <Input value={opt.label} onChange={e => updateOption(idx, { label: e.target.value })}
                              className="bg-white/5 border-white/10 text-white text-sm" placeholder="Confirm Order" />
                          </div>
                          <div>
                            <label className="text-white/40 text-xs mb-1 block">Action ID</label>
                            <Input value={opt.action} onChange={e => updateOption(idx, { action: e.target.value })}
                              className="bg-white/5 border-white/10 text-white text-sm" placeholder="confirmed" />
                          </div>
                        </div>
                        <div>
                          <label className="text-white/40 text-xs mb-1 block">Button Color</label>
                          <div className="flex gap-2">
                            {COLOR_OPTS.map(c => (
                              <button key={c} onClick={() => updateOption(idx, { color: c })}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${opt.color === c ? "scale-125 border-white" : "border-transparent opacity-60 hover:opacity-100"}
                                  ${c === "green" ? "bg-green-500" : c === "red" ? "bg-red-500" : c === "yellow" ? "bg-yellow-500" : c === "blue" ? "bg-blue-500" : "bg-purple-500"}`} />
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-white/40 text-xs mb-1 block">Response Message (shown after key press)</label>
                          <Textarea value={opt.responseText} onChange={e => updateOption(idx, { responseText: e.target.value })}
                            className="bg-white/5 border-white/10 text-white text-sm" rows={2} />
                        </div>
                        <div>
                          <label className="text-white/40 text-xs mb-2 block">Response Audio</label>
                          <div className="flex gap-2 items-center flex-wrap">
                            {opt.responseAudioUrl && (
                              <audio controls src={opt.responseAudioUrl} className="h-7 flex-1 min-w-0" />
                            )}
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs gap-1"
                              disabled={!opt.responseText.trim() || ttsLoading[idx]}
                              onClick={() => generateTtsForOption(idx, opt.responseText)}>
                              {ttsLoading[idx] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                              Generate Voice
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <Button onClick={saveConfig} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 mt-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Save All Options
                </Button>
              </div>
            )}

            {activeTab === "test" && <TestPanel />}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
