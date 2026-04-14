import { useState, useEffect, useRef, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  Phone, Upload, Save, Settings, Volume2, Link2, CheckCircle2, Copy,
  Loader2, Play, Plus, Trash2, Sparkles, Wand2, Mic, MicOff, Globe,
  Webhook, RefreshCw, Clock, BarChart3, AlertCircle, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight, Info, Zap, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { API } from "@/lib/apiUrl";

const FRONTEND = typeof window !== "undefined" ? window.location.origin : "";

interface VoiceOption {
  key: string; label: string; action: string;
  color: "green" | "red" | "yellow" | "blue" | "purple";
  responseText: string; responseAudioUrl: string | null; enabled: boolean;
}
interface VoiceConfig {
  id: number; companyName: string; logoUrl: string | null;
  welcomeAudioUrl: string | null; welcomeText: string;
  announcementAudioUrl: string | null; announcementText: string;
  options: VoiceOption[]; ttsVoice: string;
  sessionExpiryMinutes: number; enabled: boolean;
  webhookSecret?: string;
}

const COLOR_OPTS = ["green", "red", "yellow", "blue", "purple"] as const;
const COLOR_MAP: Record<string, string> = {
  green: "bg-green-500/20 text-green-300 border-green-500/30",
  red: "bg-red-500/20 text-red-300 border-red-500/30",
  yellow: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  blue: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  purple: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};
const TTS_VOICES = ["nova", "alloy", "echo", "fable", "onyx", "shimmer"];
const ACTION_PRESETS = [
  { value: "confirmed", label: "✅ অর্ডার কনফার্ম", color: "green" as const, defaultLabel: "অর্ডার কনফার্ম করুন" },
  { value: "cancelled", label: "❌ অর্ডার বাতিল", color: "red" as const, defaultLabel: "অর্ডার বাতিল করুন" },
  { value: "transfer_to_agent", label: "🤖 AI Agent Transfer", color: "purple" as const, defaultLabel: "AI এজেন্টে স্থানান্তর" },
  { value: "callback", label: "📞 Callback Request", color: "yellow" as const, defaultLabel: "কলব্যাক অনুরোধ করুন" },
  { value: "custom", label: "⚙️ Custom Action", color: "blue" as const, defaultLabel: "" },
];
const DEFAULT_OPTION: VoiceOption = {
  key: "", label: "", action: "confirmed", color: "green",
  responseText: "", responseAudioUrl: null, enabled: true,
};

const DEMO_PRODUCTS = [
  { name: "প্রিমিয়াম কটন টি-শার্ট", price: 850, quantity: 2, deliveryDays: 3 },
  { name: "রানিং শু (Size 42)", price: 1200, quantity: 1, deliveryDays: 5 },
];

/* ─── AudioRow ─── */
function AudioRow({ label, desc, audioUrl, fieldKey, onUpdated, csrfFetch }: {
  label: string; desc: string; audioUrl: string | null; fieldKey: string;
  onUpdated: (url: string) => void;
  csrfFetch: (path: string, options?: RequestInit) => Promise<Response>;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [genText, setGenText] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
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
  function stopRecord() { mediaRecRef.current?.stop(); setIsRecording(false); }

  async function uploadFile(blob: Blob, name: string) {
    setUploading(true);
    const fd = new FormData();
    fd.append("audio", blob, name);
    fd.append("field", fieldKey);
    try {
      const r = await fetch(`${API}/api/voice-calls/upload-audio`, { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onUpdated(d.url);
      setRecordedBlob(null); setRecordedUrl(null);
      toast({ title: "✅ Audio saved!" });
    } catch (e) {
      toast({ title: "Upload failed", description: String(e), variant: "destructive" });
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
        utt.rate = 0.9;
        const voices = window.speechSynthesis?.getVoices() || [];
        const v = voices.find(v => v.lang.startsWith("bn")) || voices.find(v => v.lang.startsWith("en")) || voices[0];
        if (v) utt.voice = v;
        window.speechSynthesis?.speak(utt);
        toast({ title: "🔊 Browser preview", description: "Upload a file to save audio permanently." });
      } else {
        onUpdated(d.url);
        toast({ title: "✅ Voice generated!" });
      }
    } catch (e) {
      toast({ title: "TTS failed", description: String(e), variant: "destructive" });
    } finally { setGenLoading(false); }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white text-sm font-semibold">{label}</p>
          <p className="text-white/40 text-xs mt-0.5">{desc}</p>
        </div>
        {audioUrl && (
          <button onClick={() => new Audio(audioUrl).play()}
            className="p-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 transition shrink-0 ml-2 border border-indigo-400/20">
            <Play className="w-3.5 h-3.5 text-indigo-400" />
          </button>
        )}
      </div>
      {audioUrl ? (
        <audio controls src={audioUrl} className="w-full h-9 rounded-lg" />
      ) : (
        <div className="border border-dashed border-white/15 rounded-xl py-4 text-center">
          <Volume2 className="w-5 h-5 text-white/15 mx-auto mb-1.5" />
          <p className="text-white/20 text-xs">No audio file</p>
        </div>
      )}
      <input ref={fileRef} type="file" accept="audio/*" className="hidden"
        onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], e.target.files[0].name)} />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 border-white/15 text-white/60 text-xs h-8"
          disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
          Upload File
        </Button>
        <Button size="sm" variant="outline"
          className={`border-white/15 text-xs px-3 h-8 ${isRecording ? "bg-red-500/20 border-red-400/40 text-red-300" : "text-white/60"}`}
          onClick={isRecording ? stopRecord : startRecord}>
          {isRecording ? <><MicOff className="w-3 h-3 mr-1" />Stop</> : <><Mic className="w-3 h-3 mr-1" />Record</>}
          {isRecording && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />}
        </Button>
      </div>
      {recordedUrl && (
        <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-400/20 rounded-xl p-2">
          <audio src={recordedUrl} controls className="flex-1 h-7" />
          <Button size="sm" className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs px-3 h-8 border border-teal-400/30"
            disabled={uploading} onClick={() => recordedBlob && uploadFile(recordedBlob, `rec-${Date.now()}.webm`)}>
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
            Save
          </Button>
        </div>
      )}
      <div className="flex gap-2">
        <Input placeholder="বাংলায় টেক্সট লিখুন — AI voice তৈরি হবে..."
          value={genText} onChange={e => setGenText(e.target.value)}
          className="bg-white/5 border-white/10 text-white text-xs h-8 flex-1" />
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs px-3 h-8"
          disabled={genLoading || !genText.trim()} onClick={handleTts}>
          {genLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        </Button>
      </div>
    </div>
  );
}

/* ─── Test Panel ─── */
function TestPanel({ csrfFetch }: { csrfFetch: (path: string, options?: RequestInit) => Promise<Response> }) {
  const { toast } = useToast();
  const [orderId, setOrderId] = useState("DEMO-" + Math.floor(Math.random() * 900 + 100));
  const [customerName, setCustomerName] = useState("করিম সাহেব");
  const [customerPhone, setCustomerPhone] = useState("+8801707384005");
  const [amount, setAmount] = useState("৳ 2,900");
  const [callToken, setCallToken] = useState("");
  const [callUrl, setCallUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function createTestCall() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/voice-calls/initiate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId, customerName, customerPhone, orderAmount: amount,
          products: DEMO_PRODUCTS,
          deliveryInfo: "৩-৫ কার্যদিবসের মধ্যে ডেলিভারি",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setCallToken(d.token);
      setCallUrl(`${FRONTEND}/call/${d.token}`);
      toast({ title: "✅ টেস্ট কল তৈরি হয়েছে!" });
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    } finally { setLoading(false); }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: "linear-gradient(135deg,rgba(0,212,200,0.10),rgba(79,70,229,0.08))", border: "1px solid rgba(0,212,200,0.2)" }}>
        <Globe className="w-4 h-4 flex-shrink-0 mt-0.5 text-teal-400" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-teal-300">পাবলিক AI Calling Demo পেজ</p>
          <p className="text-xs mt-0.5 mb-3 text-teal-400/60">Client দের শেয়ার করার জন্য demo URL</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-black/30 rounded-lg px-3 py-2 truncate text-white/60">{FRONTEND}/ai-voice</code>
            <button onClick={() => copyUrl(`${FRONTEND}/ai-voice`)}
              className="p-2 rounded-lg bg-teal-500/15 text-teal-400 border border-teal-400/20 hover:bg-teal-500/25 transition">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <a href={`${FRONTEND}/ai-voice`} target="_blank" rel="noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 transition whitespace-nowrap">
              Open ↗
            </a>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
        <h4 className="text-white/50 text-xs uppercase tracking-wider font-semibold">Demo Order Details</h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Order ID", value: orderId, set: setOrderId },
            { label: "Customer Name", value: customerName, set: setCustomerName },
            { label: "Phone Number", value: customerPhone, set: setCustomerPhone },
            { label: "Order Amount", value: amount, set: setAmount },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="text-xs text-white/35 mb-1.5 block">{label}</label>
              <Input value={value} onChange={e => set(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-sm h-9" />
            </div>
          ))}
        </div>
        <div className="rounded-xl p-3 space-y-1.5 bg-teal-500/5 border border-teal-400/10">
          <p className="text-white/25 text-[10px] uppercase tracking-wider mb-2">Demo Products</p>
          {DEMO_PRODUCTS.map((p, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-white/50">{p.quantity}× {p.name}</span>
              <span className="text-white/35">৳{(p.price * p.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="border-t border-white/5 pt-1.5 flex justify-between text-xs font-semibold">
            <span className="text-white/35">Total</span>
            <span className="text-teal-400">৳{DEMO_PRODUCTS.reduce((s, p) => s + p.price * p.quantity, 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <Button onClick={createTestCall} disabled={loading}
        className="w-full py-5 text-base font-bold bg-teal-500 hover:bg-teal-400 text-black">
        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Phone className="w-5 h-5 mr-2" />}
        টেস্ট কল তৈরি করুন
      </Button>

      {callToken && (
        <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-2xl p-4 space-y-3">
          <p className="text-emerald-300 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> কল তৈরি হয়েছে!
          </p>
          <div>
            <p className="text-white/30 text-xs mb-1.5">Call URL (কাস্টমারকে এই লিংক পাঠান)</p>
            <div className="flex items-center gap-2">
              <Input value={callUrl} readOnly className="bg-white/5 border-white/10 text-white/50 text-xs flex-1 h-9" />
              <button onClick={() => copyUrl(callUrl)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition border border-white/10">
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/60" />}
              </button>
              <a href={callUrl} target="_blank" rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-teal-500/20 text-teal-300 text-xs font-medium hover:bg-teal-500/30 transition whitespace-nowrap">
                Open
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5" /> E-Commerce Integration Code
        </h4>
        <pre className="text-xs text-green-300 bg-black/40 rounded-xl p-3 overflow-x-auto font-mono leading-relaxed whitespace-pre">
{`<!-- আপনার website এ এই code যোগ করুন -->
<script src="${API}/api/voice-calls/widget.js"></script>
<script>
SoftworksCall.configure({ frontendUrl: '${FRONTEND}' });

// Order place হলে call শুরু করুন:
SoftworksCall.show(orderToken, {
  onComplete: function(result) {
    if (result.action === 'confirmed') {
      // ✅ অর্ডার confirm হয়েছে
      window.location.href = '/order/success';
    } else if (result.action === 'cancelled') {
      // ❌ অর্ডার cancel হয়েছে
      window.location.href = '/order/cancelled';
    }
  }
});
</script>`}
        </pre>
        <button onClick={() => copyUrl(
          `<script src="${API}/api/voice-calls/widget.js"></script>\n<script>\nSoftworksCall.configure({ frontendUrl: '${FRONTEND}' });\nSoftworksCall.show(orderToken, { onComplete: function(r) { console.log(r); } });\n</script>`
        )} className="mt-2 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition">
          <Copy className="w-3 h-3" /> Code copy করুন
        </button>
      </div>
    </div>
  );
}

/* ─── Webhook Panel ─── */
function WebhookPanel({ csrfFetch }: { csrfFetch: (path: string, options?: RequestInit) => Promise<Response> }) {
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [retryEnabled, setRetryEnabled] = useState(true);
  const [retryMax, setRetryMax] = useState(3);
  const [webhookSaved, setWebhookSaved] = useState(false);

  async function testWebhook() {
    if (!webhookUrl.trim()) {
      toast({ title: "Webhook URL দিন", variant: "destructive" });
      return;
    }
    setTestLoading(true); setTestResult(null);
    try {
      const r = await fetch(`${API}/api/voice-calls/test-webhook`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl, webhookSecret }),
      });
      const d = await r.json();
      setTestResult({ ok: r.ok, message: d.message || (r.ok ? "Webhook সফলভাবে কাজ করছে!" : d.error || "Failed") });
    } catch (e) {
      setTestResult({ ok: false, message: String(e) });
    } finally { setTestLoading(false); }
  }

  async function saveWebhookSettings() {
    try {
      const r = await csrfFetch("/api/voice-calls/config/webhook", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultWebhookUrl: webhookUrl, webhookSecret, retryEnabled, retryMax }),
      });
      if (r.ok) {
        setWebhookSaved(true);
        setTimeout(() => setWebhookSaved(false), 2000);
        toast({ title: "✅ Webhook settings saved!" });
      } else {
        const d = await r.json();
        toast({ title: "Save failed", description: d.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-amber-500/8 border border-amber-400/20 rounded-2xl px-4 py-3 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-amber-300/80 text-xs leading-relaxed">
          Webhook configure করলে প্রতিটি call complete হলে আপনার server এ POST request যাবে — অর্ডার auto confirm/cancel করতে পারবেন।
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
        <h4 className="text-white font-semibold text-sm flex items-center gap-2">
          <Webhook className="w-4 h-4 text-teal-400" /> Webhook Configuration
        </h4>

        <div>
          <label className="text-white/40 text-xs mb-1.5 block">Default Webhook URL</label>
          <div className="flex gap-2">
            <Input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://yoursite.com/api/call-webhook"
              className="bg-white/5 border-white/10 text-white flex-1 h-9" />
            <Button size="sm" onClick={testWebhook} disabled={testLoading || !webhookUrl.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 h-9 px-4">
              {testLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            </Button>
          </div>
          {testResult && (
            <div className={`mt-2 px-3 py-2 rounded-xl text-xs flex items-center gap-2 ${testResult.ok ? "bg-green-500/10 border border-green-400/20 text-green-300" : "bg-red-500/10 border border-red-400/20 text-red-300"}`}>
              {testResult.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {testResult.message}
            </div>
          )}
        </div>

        <div>
          <label className="text-white/40 text-xs mb-1.5 block flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> Webhook Secret (Optional)
          </label>
          <Input value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)}
            placeholder="Secret key for HMAC signature verification"
            type="password"
            className="bg-white/5 border-white/10 text-white h-9" />
          <p className="text-white/25 text-[10px] mt-1">Header: X-Softworks-Signature দিয়ে verify করুন</p>
        </div>

        <div className="border-t border-white/8 pt-4 space-y-3">
          <h5 className="text-white/40 text-xs uppercase tracking-wider font-semibold flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Auto Retry Settings
          </h5>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Webhook Retry</p>
              <p className="text-white/25 text-xs">Webhook fail হলে auto retry করবে</p>
            </div>
            <button onClick={() => setRetryEnabled(!retryEnabled)}>
              {retryEnabled
                ? <ToggleRight className="w-8 h-8 text-teal-400" />
                : <ToggleLeft className="w-8 h-8 text-white/20" />}
            </button>
          </div>
          {retryEnabled && (
            <div>
              <label className="text-white/40 text-xs mb-1.5 block">Max Retry Count</label>
              <div className="flex gap-2">
                {[1, 2, 3, 5].map(n => (
                  <button key={n} onClick={() => setRetryMax(n)}
                    className={`w-10 h-9 rounded-lg text-sm font-medium transition-all ${retryMax === n ? "bg-teal-600 text-white" : "bg-white/5 text-white/40 border border-white/10 hover:text-white"}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/8 pt-4">
          <h5 className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-3">Webhook Payload Example</h5>
          <pre className="text-xs text-green-300/70 bg-black/40 rounded-xl p-3 overflow-x-auto font-mono leading-relaxed">
{`{
  "event": "call.completed",
  "token": "abc123...",
  "orderId": "ORD-001",
  "status": "completed",
  "action": "confirmed",
  "dtmfInput": "1",
  "customerPhone": "+8801...",
  "timestamp": "2024-01-01T12:00:00Z"
}`}
          </pre>
        </div>
      </div>

      <Button onClick={saveWebhookSettings} className="bg-indigo-600 hover:bg-indigo-700 w-full">
        {webhookSaved ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        {webhookSaved ? "Saved!" : "Save Webhook Settings"}
      </Button>
    </div>
  );
}

/* ─── Main Page ─── */
export function VoiceCallConfigPage() {
  const { toast } = useToast();
  const { csrfFetch } = useAdminAuth();
  const [config, setConfig] = useState<VoiceConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "audio" | "keys" | "webhook" | "test">("general");
  const [editingOption, setEditingOption] = useState<number | null>(null);
  const [ttsLoading, setTtsLoading] = useState<Record<number, boolean>>({});
  const [stats, setStats] = useState<{ total: number; confirmed: number; cancelled: number; conversionRate: number } | null>(null);

  useEffect(() => {
    csrfFetch("/api/voice-calls/config")
      .then(r => r.json()).then(setConfig)
      .catch(() => toast({ title: "Failed to load config", variant: "destructive" }));

    fetch(`${API}/api/voice-calls/stats`)
      .then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  async function saveConfig() {
    if (!config) return;
    setSaving(true);
    try {
      const r = await csrfFetch("/api/voice-calls/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: config.companyName,
          welcomeText: config.welcomeText,
          announcementText: config.announcementText,
          options: config.options,
          ttsVoice: config.ttsVoice,
          sessionExpiryMinutes: config.sessionExpiryMinutes,
          enabled: config.enabled,
        }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Save failed");
      }
      const updated = await r.json();
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast({ title: "✅ Configuration saved!" });
    } catch (e) {
      toast({ title: "Save failed", description: String(e), variant: "destructive" });
    } finally { setSaving(false); }
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
        utt.rate = 0.9;
        const voices = window.speechSynthesis?.getVoices() || [];
        const v = voices.find(v => v.lang.startsWith("bn")) || voices.find(v => v.lang.startsWith("en")) || voices[0];
        if (v) utt.voice = v;
        window.speechSynthesis?.speak(utt);
        toast({ title: "🔊 Browser preview playing" });
      } else {
        const opts = [...config.options];
        opts[idx] = { ...opts[idx], responseAudioUrl: d.url };
        setConfig({ ...config, options: opts });
        toast({ title: "✅ Voice generated!" });
      }
    } catch (e) {
      toast({ title: "TTS failed", description: String(e), variant: "destructive" });
    } finally { setTtsLoading(p => ({ ...p, [idx]: false })); }
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
    const newOpt = { ...DEFAULT_OPTION, key: nextKey };
    setConfig({ ...config, options: [...config.options, newOpt] });
    setEditingOption(config.options.length);
  }

  function removeOption(idx: number) {
    if (!config) return;
    setConfig({ ...config, options: config.options.filter((_, i) => i !== idx) });
    if (editingOption === idx) setEditingOption(null);
  }

  const tabs = [
    { key: "general" as const, label: "General", icon: Settings },
    { key: "audio" as const, label: "Audio & TTS", icon: Volume2 },
    { key: "keys" as const, label: "Key Options", icon: Phone },
    { key: "webhook" as const, label: "Webhook", icon: Webhook },
    { key: "test" as const, label: "Test & Embed", icon: Link2 },
  ];

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-400/25 flex items-center justify-center">
              <Phone className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Call Configuration</h1>
              <p className="text-muted-foreground text-sm">Voice call system settings ও configuration</p>
            </div>
          </div>
          {config && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${config.enabled ? "bg-green-500/15 border-green-400/30 text-green-300" : "bg-red-500/10 border-red-400/20 text-red-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${config.enabled ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
              {config.enabled ? "System Active" : "System Off"}
            </div>
          )}
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: "মোট কল", value: stats.total, color: "text-white" },
              { label: "Confirmed", value: stats.confirmed, color: "text-teal-400" },
              { label: "Cancelled", value: stats.cancelled, color: "text-red-400" },
              { label: "Conversion", value: `${stats.conversionRate}%`, color: "text-purple-400" },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-white/30 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 mb-5 bg-white/5 rounded-xl p-1 border border-white/10 overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${activeTab === t.key ? "bg-teal-600 text-white shadow-sm" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
              <t.icon className="w-3.5 h-3.5 flex-shrink-0" />
              {t.label}
            </button>
          ))}
        </div>

        {!config ? (
          <div className="flex items-center gap-3 text-white/40 p-12 justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
            <span>Loading configuration...</span>
          </div>
        ) : (
          <>
            {/* ── GENERAL TAB ── */}
            {activeTab === "general" && (
              <div className="space-y-5">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-sm">System Status</h3>
                      <p className="text-white/30 text-xs mt-0.5">Call system সম্পূর্ণ enable/disable করুন</p>
                    </div>
                    <button onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                      className="flex items-center gap-2 transition-all">
                      {config.enabled
                        ? <ToggleRight className="w-10 h-10 text-teal-400" />
                        : <ToggleLeft className="w-10 h-10 text-white/20" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/40 text-xs mb-1.5 block">Company / Brand Name</label>
                      <Input value={config.companyName || ""}
                        onChange={e => setConfig({ ...config, companyName: e.target.value })}
                        placeholder="SOFTWORKS IT FARM"
                        className="bg-white/5 border-white/10 text-white h-10" />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs mb-1.5 block flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Session Expiry (minutes)
                      </label>
                      <Input type="number" value={config.sessionExpiryMinutes} min={5} max={1440}
                        onChange={e => setConfig({ ...config, sessionExpiryMinutes: parseInt(e.target.value) || 30 })}
                        className="bg-white/5 border-white/10 text-white h-10" />
                    </div>
                  </div>

                  <div>
                    <label className="text-white/40 text-xs mb-1.5 block">
                      Welcome Text <span className="text-white/20">(কল connect হলে প্রথমে বলবে)</span>
                    </label>
                    <Textarea value={config.welcomeText || ""}
                      onChange={e => setConfig({ ...config, welcomeText: e.target.value })}
                      placeholder="আস্সালামু আলাইকুম! আমি সফটওয়ার্কস AI। আপনার অর্ডারের বিষয়ে কথা বলতে চাই।"
                      className="bg-white/5 border-white/10 text-white resize-none" rows={2} />
                  </div>

                  <div>
                    <label className="text-white/40 text-xs mb-1.5 block">
                      Announcement Text <span className="text-white/20">(key options ব্যাখ্যা)</span>
                    </label>
                    <Textarea value={config.announcementText || ""}
                      onChange={e => setConfig({ ...config, announcementText: e.target.value })}
                      placeholder="অর্ডার কনফার্ম করতে ১ চাপুন। বাতিল করতে ২ চাপুন। AI এজেন্টের সাথে কথা বলতে ৩ চাপুন।"
                      className="bg-white/5 border-white/10 text-white resize-none" rows={2} />
                  </div>

                  <div>
                    <label className="text-white/40 text-xs mb-2 block">TTS Voice Style</label>
                    <div className="flex gap-2 flex-wrap">
                      {TTS_VOICES.map(v => (
                        <button key={v} onClick={() => setConfig({ ...config, ttsVoice: v })}
                          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${config.ttsVoice === v ? "bg-purple-600 text-white shadow-md" : "bg-white/5 text-white/40 border border-white/10 hover:text-white"}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button onClick={saveConfig} disabled={saving}
                  className={`w-full h-11 text-sm font-semibold transition-all ${saved ? "bg-green-600 hover:bg-green-700" : "bg-indigo-600 hover:bg-indigo-700"}`}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : saved ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {saving ? "Saving..." : saved ? "Saved!" : "Save General Settings"}
                </Button>
              </div>
            )}

            {/* ── AUDIO TAB ── */}
            {activeTab === "audio" && (
              <div className="space-y-4">
                <div className="bg-indigo-500/10 border border-indigo-400/20 rounded-2xl px-4 py-3 flex items-start gap-3">
                  <Volume2 className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-indigo-300 text-sm font-medium">Browser TTS Active</p>
                    <p className="text-indigo-400/50 text-xs mt-0.5">Custom audio file upload করলে professional quality পাবেন। অথবা text দিয়ে AI voice তৈরি করুন।</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AudioRow label="Welcome Audio" desc="কল connect হলে প্রথমে বাজবে"
                    audioUrl={config.welcomeAudioUrl} fieldKey="welcome"
                    onUpdated={url => setConfig({ ...config, welcomeAudioUrl: url })}
                    csrfFetch={csrfFetch} />
                  <AudioRow label="Announcement Audio" desc="Welcome এর পরে key options বলবে"
                    audioUrl={config.announcementAudioUrl} fieldKey="announcement"
                    onUpdated={url => setConfig({ ...config, announcementAudioUrl: url })}
                    csrfFetch={csrfFetch} />
                </div>
              </div>
            )}

            {/* ── KEY OPTIONS TAB ── */}
            {activeTab === "keys" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">Keypad Options</p>
                    <p className="text-white/30 text-xs mt-0.5">Customer কোন key চাপলে কী হবে তা configure করুন</p>
                  </div>
                  <Button size="sm" onClick={addOption} className="bg-indigo-600 hover:bg-indigo-700 text-xs h-8">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Key
                  </Button>
                </div>

                {config.options.length === 0 && (
                  <div className="bg-white/3 border border-dashed border-white/10 rounded-2xl p-10 text-center">
                    <Phone className="w-8 h-8 text-white/10 mx-auto mb-3" />
                    <p className="text-white/25 text-sm">কোনো key option নেই</p>
                    <p className="text-white/15 text-xs mt-1">উপরে "Add Key" বোতাম চাপুন</p>
                    <Button size="sm" onClick={addOption} className="bg-indigo-600 hover:bg-indigo-700 text-xs mt-4">
                      <Plus className="w-3.5 h-3.5 mr-1" /> প্রথম Key যোগ করুন
                    </Button>
                  </div>
                )}

                {(config.options || []).map((opt, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold border ${COLOR_MAP[opt.color] || COLOR_MAP.blue}`}>
                          {opt.key || "?"}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{opt.label || "Unnamed"}</p>
                          <p className="text-white/25 text-xs">
                            {ACTION_PRESETS.find(p => p.value === opt.action)?.label || opt.action}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateOption(idx, { enabled: !opt.enabled })}
                          title={opt.enabled ? "Disable" : "Enable"}>
                          {opt.enabled
                            ? <ToggleRight className="w-7 h-7 text-teal-400" />
                            : <ToggleLeft className="w-7 h-7 text-white/20" />}
                        </button>
                        <button onClick={() => setEditingOption(editingOption === idx ? null : idx)}
                          className="p-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition">
                          {editingOption === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={() => removeOption(idx)}
                          className="p-1.5 rounded-lg text-white/25 hover:bg-red-500/20 hover:text-red-400 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {editingOption === idx && (
                      <div className="px-4 pb-4 space-y-4 border-t border-white/8 pt-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-white/35 text-xs mb-1.5 block">Key (0-9, *, #)</label>
                            <Input value={opt.key}
                              onChange={e => updateOption(idx, { key: e.target.value })}
                              className="bg-white/5 border-white/10 text-white h-9 text-center text-lg font-bold"
                              placeholder="1" maxLength={1} />
                          </div>
                          <div>
                            <label className="text-white/35 text-xs mb-1.5 block">Button Label</label>
                            <Input value={opt.label}
                              onChange={e => updateOption(idx, { label: e.target.value })}
                              className="bg-white/5 border-white/10 text-white h-9"
                              placeholder="Confirm Order" />
                          </div>
                          <div>
                            <label className="text-white/35 text-xs mb-1.5 block">Action Type</label>
                            <select value={opt.action}
                              onChange={e => {
                                const preset = ACTION_PRESETS.find(p => p.value === e.target.value);
                                updateOption(idx, {
                                  action: e.target.value,
                                  ...(preset && !opt.label ? { label: preset.defaultLabel, color: preset.color } : {}),
                                });
                              }}
                              className="w-full bg-[#1a1f2e] border border-white/10 text-white text-sm rounded-xl px-3 py-2 h-9 focus:outline-none focus:border-teal-400/50">
                              {ACTION_PRESETS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {opt.action === "transfer_to_agent" && (
                          <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-400/20 rounded-xl px-3 py-2">
                            <span className="text-lg">🤖</span>
                            <p className="text-purple-300 text-xs">এই key চাপলে AI এজেন্ট Bengali তে কথা বলবে এবং order confirm/cancel করবে।</p>
                          </div>
                        )}

                        <div>
                          <label className="text-white/35 text-xs mb-2 block">Button Color</label>
                          <div className="flex gap-2">
                            {COLOR_OPTS.map(c => (
                              <button key={c} onClick={() => updateOption(idx, { color: c })}
                                className={`w-7 h-7 rounded-full border-2 transition-all ${opt.color === c ? "scale-125 border-white" : "border-transparent opacity-50 hover:opacity-80"}
                                  ${c === "green" ? "bg-green-500" : c === "red" ? "bg-red-500" : c === "yellow" ? "bg-yellow-500" : c === "blue" ? "bg-blue-500" : "bg-purple-500"}`} />
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-white/35 text-xs mb-1.5 block">Response Message</label>
                          <Textarea value={opt.responseText}
                            onChange={e => updateOption(idx, { responseText: e.target.value })}
                            placeholder="আপনার অর্ডার কনফার্ম হয়েছে! ধন্যবাদ।"
                            className="bg-white/5 border-white/10 text-white resize-none text-sm" rows={2} />
                        </div>

                        <div>
                          <label className="text-white/35 text-xs mb-2 block">Response Audio</label>
                          <div className="flex items-center gap-2 flex-wrap">
                            {opt.responseAudioUrl && (
                              <audio controls src={opt.responseAudioUrl} className="h-8 flex-1 min-w-0" />
                            )}
                            <Button size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-xs gap-1.5 h-8"
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

                {config.options.length > 0 && (
                  <Button onClick={saveConfig} disabled={saving}
                    className={`w-full h-11 font-semibold transition-all ${saved ? "bg-green-600 hover:bg-green-700" : "bg-indigo-600 hover:bg-indigo-700"}`}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : saved ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    {saving ? "Saving..." : saved ? "Saved!" : "Save All Key Options"}
                  </Button>
                )}
              </div>
            )}

            {/* ── WEBHOOK TAB ── */}
            {activeTab === "webhook" && <WebhookPanel csrfFetch={csrfFetch} />}

            {/* ── TEST TAB ── */}
            {activeTab === "test" && <TestPanel csrfFetch={csrfFetch} />}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
