import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Phone, Upload, Save, Settings, Volume2, Link2, CheckCircle2, Copy, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || (import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "");

interface VoiceConfig {
  id: number;
  companyName: string;
  welcomeAudioUrl: string | null;
  menuAudioUrl: string | null;
  menuText: string;
  confirmAudioUrl: string | null;
  confirmText: string;
  cancelAudioUrl: string | null;
  cancelText: string;
  sessionExpiryMinutes: number;
  enabled: boolean;
}

type AudioField = "welcome" | "menu" | "confirm" | "cancel";

const AUDIO_FIELDS: { key: AudioField; label: string; configKey: keyof VoiceConfig; desc: string }[] = [
  { key: "welcome", label: "Welcome Audio", configKey: "welcomeAudioUrl", desc: "Plays first when call connects" },
  { key: "menu", label: "Menu Audio", configKey: "menuAudioUrl", desc: "Optional: plays after welcome (else uses menu text)" },
  { key: "confirm", label: "Confirm Audio", configKey: "confirmAudioUrl", desc: "Plays when customer presses 1" },
  { key: "cancel", label: "Cancel Audio", configKey: "cancelAudioUrl", desc: "Plays when customer presses 2" },
];

function AudioUploadCard({
  label, desc, audioUrl, fieldKey, onUploaded,
}: {
  label: string; desc: string; audioUrl: string | null; fieldKey: AudioField; onUploaded: (url: string) => void;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("audio", file);
    fd.append("field", fieldKey);
    try {
      const r = await fetch(`${API}/api/voice-calls/upload-audio`, { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onUploaded(d.url);
      toast({ title: "Audio uploaded", description: `${label} has been updated.` });
    } catch (e) {
      toast({ title: "Upload failed", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white font-medium text-sm">{label}</p>
          <p className="text-white/40 text-xs mt-0.5">{desc}</p>
        </div>
        {audioUrl && (
          <button onClick={() => new Audio(audioUrl).play()} className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 transition">
            <Play className="w-3.5 h-3.5 text-indigo-400" />
          </button>
        )}
      </div>
      {audioUrl ? (
        <div className="mb-3">
          <audio controls src={audioUrl} className="w-full h-8 opacity-70" />
        </div>
      ) : (
        <div className="mb-3 py-3 border border-dashed border-white/20 rounded-lg text-center">
          <Volume2 className="w-5 h-5 text-white/20 mx-auto mb-1" />
          <p className="text-white/30 text-xs">No audio uploaded</p>
        </div>
      )}
      <input ref={fileRef} type="file" accept="audio/*" className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <Button size="sm" variant="outline" className="w-full border-white/20 text-white/70 hover:text-white"
        disabled={uploading} onClick={() => fileRef.current?.click()}>
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
        {audioUrl ? "Replace Audio" : "Upload Audio"}
      </Button>
    </div>
  );
}

function TestCallPanel({ config }: { config: VoiceConfig }) {
  const { toast } = useToast();
  const [orderId, setOrderId] = useState("TEST-001");
  const [customerName, setCustomerName] = useState("Test Customer");
  const [amount, setAmount] = useState("৳ 1,500");
  const [callUrl, setCallUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function createTestCall() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/voice-calls/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId, customerName, orderAmount: amount,
          orderDetails: "Test order from admin panel",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setCallUrl(d.callUrl);
      toast({ title: "Test call created!", description: "Click the link to open the call UI" });
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-white/50 text-sm">Create a test call session and preview how it looks for customers.</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-white/40 mb-1 block">Order ID</label>
          <Input value={orderId} onChange={e => setOrderId(e.target.value)}
            className="bg-white/5 border-white/10 text-white text-sm" />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Customer Name</label>
          <Input value={customerName} onChange={e => setCustomerName(e.target.value)}
            className="bg-white/5 border-white/10 text-white text-sm" />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Amount</label>
          <Input value={amount} onChange={e => setAmount(e.target.value)}
            className="bg-white/5 border-white/10 text-white text-sm" />
        </div>
      </div>
      <Button onClick={createTestCall} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
        Create Test Call
      </Button>
      {callUrl && (
        <div className="bg-indigo-500/10 border border-indigo-400/30 rounded-xl p-4 space-y-3">
          <p className="text-indigo-300 text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Call session created!
          </p>
          <div className="flex items-center gap-2">
            <Input value={callUrl} readOnly className="bg-white/5 border-white/10 text-white/60 text-xs flex-1" />
            <button onClick={() => { navigator.clipboard.writeText(callUrl); }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
              <Copy className="w-4 h-4 text-white/60" />
            </button>
            <a href={callUrl} target="_blank" rel="noreferrer">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs">Open Call</Button>
            </a>
          </div>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
        <h4 className="text-white/70 text-sm font-semibold mb-2 flex items-center gap-2">
          <Link2 className="w-4 h-4" /> E-Commerce Integration API
        </h4>
        <p className="text-white/40 text-xs mb-3">
          Send a POST request from your e-commerce site after order placement:
        </p>
        <pre className="text-xs text-green-300 bg-black/40 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap">
{`POST ${API}/api/voice-calls/initiate
Content-Type: application/json

{
  "orderId": "ORD-12345",
  "customerName": "John Doe",
  "customerPhone": "01700000000",
  "orderAmount": "৳ 2,500",
  "orderDetails": "2x Product A, 1x Product B",
  "ecommerceWebhookUrl": "https://your-shop.com/api/order-webhook",
  "ecommerceSiteUrl": "https://your-shop.com"
}

// Response:
{
  "token": "abc123...",
  "callUrl": "${API}/call/abc123...",
  "session": { ... }
}

// Show callUrl to customer or embed in confirmation page`}
        </pre>
      </div>
    </div>
  );
}

export function VoiceCallConfigPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<VoiceConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "audio" | "test">("settings");

  useEffect(() => {
    fetch(`${API}/api/voice-calls/config`)
      .then(r => r.json())
      .then(setConfig)
      .catch(() => toast({ title: "Failed to load config", variant: "destructive" }));
  }, []);

  async function saveConfig() {
    if (!config) return;
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/voice-calls/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: config.companyName,
          menuText: config.menuText,
          confirmText: config.confirmText,
          cancelText: config.cancelText,
          sessionExpiryMinutes: config.sessionExpiryMinutes,
          enabled: config.enabled,
        }),
      });
      const updated = await r.json();
      setConfig(updated);
      toast({ title: "Settings saved!" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { key: "settings" as const, label: "Settings", icon: Settings },
    { key: "audio" as const, label: "Audio Files", icon: Volume2 },
    { key: "test" as const, label: "Test & API", icon: Link2 },
  ];

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Phone className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Auto Call Configuration</h1>
            <p className="text-white/40 text-sm">Configure the browser-based order confirmation call system</p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit border border-white/10">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? "bg-indigo-600 text-white" : "text-white/50 hover:text-white"}`}>
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {!config ? (
          <div className="flex items-center gap-3 text-white/40 p-8">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading config...
          </div>
        ) : (
          <>
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">General Settings</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-white/50 text-sm">Enabled</span>
                      <div className={`relative w-10 h-5 rounded-full transition-colors ${config.enabled ? "bg-indigo-600" : "bg-white/10"}`}
                        onClick={() => setConfig({ ...config, enabled: !config.enabled })}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${config.enabled ? "left-5" : "left-0.5"}`} />
                      </div>
                    </label>
                  </div>
                  <div>
                    <label className="text-white/50 text-sm mb-1.5 block">Company Name (shown on call screen)</label>
                    <Input value={config.companyName || ""} onChange={e => setConfig({ ...config, companyName: e.target.value })}
                      className="bg-white/5 border-white/10 text-white" placeholder="Your Company Name" />
                  </div>
                  <div>
                    <label className="text-white/50 text-sm mb-1.5 block">Session Expiry (minutes)</label>
                    <Input type="number" value={config.sessionExpiryMinutes} min={5} max={1440}
                      onChange={e => setConfig({ ...config, sessionExpiryMinutes: parseInt(e.target.value) })}
                      className="bg-white/5 border-white/10 text-white w-32" />
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                  <h3 className="text-white font-semibold">Voice Messages (Text)</h3>
                  <p className="text-white/40 text-xs">These appear as text on the call screen. Upload audio files for voice playback.</p>
                  <div>
                    <label className="text-white/50 text-sm mb-1.5 block">Menu Message</label>
                    <Textarea value={config.menuText || ""} onChange={e => setConfig({ ...config, menuText: e.target.value })}
                      className="bg-white/5 border-white/10 text-white" rows={2}
                      placeholder="Press 1 to confirm. Press 2 to cancel." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/50 text-sm mb-1.5 block">Confirm Message (after pressing 1)</label>
                      <Textarea value={config.confirmText || ""} onChange={e => setConfig({ ...config, confirmText: e.target.value })}
                        className="bg-white/5 border-white/10 text-white" rows={2} />
                    </div>
                    <div>
                      <label className="text-white/50 text-sm mb-1.5 block">Cancel Message (after pressing 2)</label>
                      <Textarea value={config.cancelText || ""} onChange={e => setConfig({ ...config, cancelText: e.target.value })}
                        className="bg-white/5 border-white/10 text-white" rows={2} />
                    </div>
                  </div>
                </div>

                <Button onClick={saveConfig} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Settings
                </Button>
              </div>
            )}

            {activeTab === "audio" && (
              <div className="space-y-4">
                <p className="text-white/50 text-sm">Upload MP3 or WAV audio files. These play automatically on the call screen.</p>
                <div className="grid grid-cols-2 gap-4">
                  {AUDIO_FIELDS.map(f => (
                    <AudioUploadCard
                      key={f.key}
                      label={f.label}
                      desc={f.desc}
                      audioUrl={config[f.configKey] as string | null}
                      fieldKey={f.key}
                      onUploaded={url => setConfig({ ...config, [f.configKey]: url })}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === "test" && <TestCallPanel config={config} />}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
