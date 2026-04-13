import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  Phone, RefreshCw, Trash2, CheckCircle2, XCircle, Clock, AlertCircle,
  ExternalLink, Copy, Download, BarChart2, PhoneOff, PhoneIncoming,
  Search, Filter, ChevronDown, Mic, MicOff, Play, Square, Upload, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { API } from "@/lib/apiUrl";

interface CallSession {
  id: number; token: string; orderId: string;
  customerName: string | null; customerPhone: string | null;
  orderAmount: string | null; status: string;
  dtmfInput: string | null; actionTaken: string | null;
  webhookSent: boolean; createdAt: string; expiresAt: string;
}

interface Stats {
  total: number; confirmed: number; cancelled: number; pending: number;
  conversionRate: number;
}

function StatusBadge({ status, action }: { status: string; action: string | null }) {
  if (action === "confirmed") return (
    <span className="flex items-center gap-1 text-[11px] bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 px-2.5 py-1 rounded-full font-medium">
      <CheckCircle2 className="w-3 h-3" /> Confirmed
    </span>
  );
  if (action === "cancelled") return (
    <span className="flex items-center gap-1 text-[11px] bg-red-500/15 text-red-300 border border-red-400/25 px-2.5 py-1 rounded-full font-medium">
      <XCircle className="w-3 h-3" /> Cancelled
    </span>
  );
  if (status === "completed") return (
    <span className="flex items-center gap-1 text-[11px] bg-yellow-500/15 text-yellow-300 border border-yellow-400/25 px-2.5 py-1 rounded-full font-medium">
      <AlertCircle className="w-3 h-3" /> Completed
    </span>
  );
  const isExpired = new Date() > new Date("");
  if (isExpired) return (
    <span className="flex items-center gap-1 text-[11px] bg-white/5 text-white/30 border border-white/10 px-2.5 py-1 rounded-full font-medium">
      <PhoneOff className="w-3 h-3" /> Expired
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[11px] bg-blue-500/15 text-blue-300 border border-blue-400/25 px-2.5 py-1 rounded-full font-medium">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: number | string; sub?: string;
  color: string; icon: React.FC<any>;
}) {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-white/50 text-xs">{label}</p>
      {sub && <p className="text-white/30 text-[11px] mt-0.5">{sub}</p>}
    </div>
  );
}

function VoiceRecorder({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const { toast } = useToast();

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      chunksRef.current = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const b = new Blob(chunksRef.current, { type: "audio/webm" });
        setBlob(b);
        setAudioUrl(URL.createObjectURL(b));
        stream.getTracks().forEach(t => t.stop());
      };
      rec.start();
      mediaRecRef.current = rec;
      setIsRecording(true);
    } catch {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  }

  function stop() {
    mediaRecRef.current?.stop();
    setIsRecording(false);
  }

  async function upload() {
    if (!blob) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("audio", blob, `recording-${Date.now()}.webm`);
    fd.append("field", "welcome");
    try {
      const r = await fetch(`${API}/api/voice-calls/upload-audio`, { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onUploaded(d.url);
      toast({ title: "Recording uploaded!" });
      setBlob(null); setAudioUrl(null);
    } catch (e) {
      toast({ title: "Upload failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setUploading(false); }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={isRecording ? stop : start}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isRecording ? "bg-red-500/20 text-red-300 border border-red-400/30" : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"}`}>
        {isRecording ? <><MicOff className="w-3.5 h-3.5" /> Stop <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /></> : <><Mic className="w-3.5 h-3.5" /> Record</>}
      </button>
      {audioUrl && (
        <>
          <audio src={audioUrl} controls className="h-8 rounded" />
          <button onClick={upload} disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-teal-500/20 text-teal-300 border border-teal-400/30 hover:bg-teal-500/30 transition-all disabled:opacity-50">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Upload
          </button>
        </>
      )}
    </div>
  );
}

const FRONTEND = typeof window !== "undefined" ? window.location.origin : "";

export function VoiceCallsPage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "confirmed" | "cancelled" | "pending">("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [stats, setStats] = useState<Stats>({ total: 0, confirmed: 0, cancelled: 0, pending: 0, conversionRate: 0 });

  const [newCall, setNewCall] = useState({
    orderId: "", customerName: "", customerPhone: "",
    orderAmount: "", orderDetails: "", ecommerceSiteUrl: "", ecommerceWebhookUrl: "",
  });
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/voice-calls/`);
      const d: CallSession[] = await r.json();
      setSessions(d);
      const confirmed = d.filter(s => s.actionTaken === "confirmed").length;
      const cancelled = d.filter(s => s.actionTaken === "cancelled").length;
      const pending = d.filter(s => s.status === "pending").length;
      setStats({
        total: d.length, confirmed, cancelled, pending,
        conversionRate: d.length > 0 ? Math.round((confirmed / d.length) * 100) : 0,
      });
    } catch {
      toast({ title: "Failed to load calls", variant: "destructive" });
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function deleteSession(id: number) {
    if (!confirm("Delete this call session?")) return;
    try {
      await fetch(`${API}/api/voice-calls/${id}`, { method: "DELETE" });
      setSessions(s => s.filter(x => x.id !== id));
      toast({ title: "Deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  async function deleteSelected() {
    if (!confirm(`Delete ${selectedIds.size} selected sessions?`)) return;
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map(id => fetch(`${API}/api/voice-calls/${id}`, { method: "DELETE" })));
    setSessions(s => s.filter(x => !selectedIds.has(x.id)));
    setSelectedIds(new Set());
    toast({ title: `Deleted ${ids.length} sessions` });
  }

  async function createSession() {
    if (!newCall.orderId.trim()) { toast({ title: "Order ID required", variant: "destructive" }); return; }
    setCreating(true);
    try {
      const r = await fetch(`${API}/api/voice-calls/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCall),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast({ title: "Call session created!", description: `Token: ${d.token}` });
      setShowCreate(false);
      setNewCall({ orderId: "", customerName: "", customerPhone: "", orderAmount: "", orderDetails: "", ecommerceSiteUrl: "", ecommerceWebhookUrl: "" });
      load();
    } catch (e) {
      toast({ title: "Failed to create", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setCreating(false); }
  }

  function exportCSV() {
    const rows = [
      ["ID", "Order ID", "Customer", "Phone", "Amount", "Status", "Action", "Created"],
      ...filtered.map(s => [s.id, s.orderId, s.customerName || "", s.customerPhone || "", s.orderAmount || "", s.status, s.actionTaken || "", new Date(s.createdAt).toLocaleString()]),
    ];
    const csv = rows.map(r => r.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "voice-calls.csv"; a.click();
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${FRONTEND}/call/${token}`);
    toast({ title: "Link copied!" });
  }

  const filtered = sessions
    .filter(s => {
      if (filter === "confirmed") return s.actionTaken === "confirmed";
      if (filter === "cancelled") return s.actionTaken === "cancelled";
      if (filter === "pending") return s.status === "pending";
      return true;
    })
    .filter(s => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return s.orderId.toLowerCase().includes(q)
        || (s.customerName || "").toLowerCase().includes(q)
        || (s.customerPhone || "").toLowerCase().includes(q);
    });

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <PhoneIncoming className="w-6 h-6 text-teal-400" />
              Voice Call Sessions
            </h1>
            <p className="text-white/40 text-sm mt-1">Auto-calling system for order confirmations</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={load} className="text-white/50 hover:text-white">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button size="sm" variant="ghost" onClick={exportCSV} className="text-white/50 hover:text-white gap-1.5">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button size="sm" onClick={() => setShowCreate(!showCreate)}
              className="bg-teal-500 hover:bg-teal-400 text-black font-semibold gap-1.5">
              <Phone className="w-4 h-4" /> New Call
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Sessions" value={stats.total} icon={Phone} color="bg-indigo-500/15 text-indigo-300" />
          <StatCard label="Confirmed" value={stats.confirmed} sub={`${stats.conversionRate}% rate`} icon={CheckCircle2} color="bg-emerald-500/15 text-emerald-300" />
          <StatCard label="Cancelled" value={stats.cancelled} icon={XCircle} color="bg-red-500/15 text-red-300" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} color="bg-yellow-500/15 text-yellow-300" />
        </div>

        {/* Create new session panel */}
        {showCreate && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Phone className="w-4 h-4 text-teal-400" /> Create Call Session
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { key: "orderId", label: "Order ID *", placeholder: "ORD-001" },
                { key: "customerName", label: "Customer Name", placeholder: "John Doe" },
                { key: "customerPhone", label: "Phone Number", placeholder: "+8801XXXXXXXXX" },
                { key: "orderAmount", label: "Order Amount", placeholder: "৳1,200" },
                { key: "ecommerceSiteUrl", label: "Store URL", placeholder: "https://yourstore.com" },
                { key: "ecommerceWebhookUrl", label: "Webhook URL", placeholder: "https://yourstore.com/webhook" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-white/50 text-xs mb-1.5 block">{label}</label>
                  <Input
                    placeholder={placeholder}
                    value={(newCall as any)[key]}
                    onChange={e => setNewCall(prev => ({ ...prev, [key]: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1.5 block">Order Details</label>
              <Input
                placeholder="Product details, delivery info..."
                value={newCall.orderDetails}
                onChange={e => setNewCall(prev => ({ ...prev, orderDetails: e.target.value }))}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button onClick={createSession} disabled={creating} size="sm"
                className="bg-teal-500 hover:bg-teal-400 text-black font-semibold">
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Phone className="w-4 h-4 mr-1" />}
                Create Session
              </Button>
              <Button onClick={() => setShowCreate(false)} size="sm" variant="ghost" className="text-white/40">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Voice Recorder quick access */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Mic className="w-4 h-4 text-teal-400" />
            <span>Quick voice recorder</span>
          </div>
          <VoiceRecorder onUploaded={(url) => {
            toast({ title: "Audio uploaded!", description: url });
          }} />
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Search by order, name, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/20"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "confirmed", "cancelled", "pending"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? "bg-teal-500/20 text-teal-300 border border-teal-400/30" : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-400/20 rounded-xl px-4 py-3">
            <span className="text-red-300 text-sm">{selectedIds.size} selected</span>
            <Button size="sm" variant="ghost" onClick={deleteSelected}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}
              className="text-white/30 hover:text-white/50">
              Clear
            </Button>
          </div>
        )}

        {/* Sessions table */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-white/30" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <PhoneOff className="w-12 h-12 text-white/10" />
              <p className="text-white/30 text-sm">No call sessions found</p>
              <Button size="sm" onClick={() => setShowCreate(true)} className="bg-teal-500/20 text-teal-300 hover:bg-teal-500/30">
                Create First Session
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {/* Header */}
              <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-4 px-5 py-3 text-white/30 text-xs uppercase tracking-wider">
                <div className="w-4" />
                <div>Order / Customer</div>
                <div>Amount</div>
                <div>Status</div>
                <div>Created</div>
                <div>Actions</div>
              </div>
              {filtered.map(s => {
                const callUrl = `${FRONTEND}/call/${s.token}`;
                const isExp = new Date() > new Date(s.expiresAt);
                return (
                  <div key={s.id}
                    className={`grid grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-4 px-5 py-4 items-center hover:bg-white/3 transition-colors ${selectedIds.has(s.id) ? "bg-teal-500/5" : ""}`}>
                    <input type="checkbox"
                      checked={selectedIds.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      className="w-4 h-4 rounded accent-teal-500 cursor-pointer" />
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">#{s.orderId}</p>
                      {s.customerName && <p className="text-white/40 text-xs truncate">{s.customerName}</p>}
                      {s.customerPhone && <p className="text-white/30 text-xs font-mono">{s.customerPhone}</p>}
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">{s.orderAmount || "—"}</p>
                    </div>
                    <div>
                      <StatusBadge status={s.status} action={s.actionTaken} />
                      {isExp && s.status === "pending" && (
                        <span className="ml-1 text-[10px] text-white/20">expired</span>
                      )}
                    </div>
                    <div className="text-white/30 text-xs whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => copyLink(s.token)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all" title="Copy call link">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a href={callUrl} target="_blank" rel="noreferrer"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-teal-300 transition-all" title="Open call">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => deleteSession(s.id)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/20 hover:text-red-300 transition-all" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-white/20 text-xs text-center">
          {filtered.length} of {sessions.length} sessions · Auto-refreshes on load
        </p>
      </div>
    </AdminLayout>
  );
}
