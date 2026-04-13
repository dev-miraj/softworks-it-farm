import { useState, useEffect, useRef, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  Phone, RefreshCw, Trash2, CheckCircle2, XCircle, Clock, AlertCircle,
  ExternalLink, Copy, Download, PhoneOff, PhoneIncoming,
  Search, Mic, MicOff, Upload, Loader2, Send, ChevronRight,
  ToggleLeft, ToggleRight, Calendar, Info, Edit2, Webhook, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { API } from "@/lib/apiUrl";

interface CallSession {
  id: number; token: string; orderId: string;
  customerName: string | null; customerPhone: string | null;
  orderAmount: string | null; orderDetails: string | null;
  status: string; dtmfInput: string | null; actionTaken: string | null;
  webhookSent: boolean; webhookResponse: string | null;
  ecommerceWebhookUrl: string | null; ecommerceSiteUrl: string | null;
  products: Array<{ name: string; price: number; quantity: number; deliveryDays?: number }> | null;
  createdAt: string; expiresAt: string; updatedAt: string;
}

interface Stats {
  total: number; confirmed: number; cancelled: number;
  pending: number; conversionRate: number; todayCount: number;
}

function StatusBadge({ status, action, expiresAt }: { status: string; action: string | null; expiresAt: string }) {
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
  const isExpired = new Date() > new Date(expiresAt);
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
        setBlob(b); setAudioUrl(URL.createObjectURL(b));
        stream.getTracks().forEach(t => t.stop());
      };
      rec.start(); mediaRecRef.current = rec; setIsRecording(true);
    } catch { toast({ title: "Microphone access denied", variant: "destructive" }); }
  }

  function stop() { mediaRecRef.current?.stop(); setIsRecording(false); }

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

function SessionDetailModal({ session, onClose, onStatusChange, onRefresh }: {
  session: CallSession;
  onClose: () => void;
  onStatusChange: (id: number, action: string) => Promise<void>;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [resending, setResending] = useState(false);
  const [overriding, setOverriding] = useState<string | null>(null);
  const callUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/call/${session.token}`;

  async function resendWebhook() {
    setResending(true);
    try {
      const r = await fetch(`${API}/api/voice-calls/${session.id}/resend-webhook`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast({ title: "Webhook sent!", description: `Result: ${d.result}` });
      onRefresh();
    } catch (e) {
      toast({ title: "Failed to resend webhook", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setResending(false); }
  }

  async function manualOverride(action: string) {
    setOverriding(action);
    try {
      await onStatusChange(session.id, action);
      toast({ title: `Marked as ${action}` });
      onRefresh();
    } catch (e) {
      toast({ title: "Failed to update status", variant: "destructive" });
    } finally { setOverriding(null); }
  }

  const isExpired = new Date() > new Date(session.expiresAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-lg backdrop-blur-xl bg-[#0f1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <h3 className="text-white font-semibold text-sm">Session #{session.id}</h3>
            <p className="text-white/40 text-xs mt-0.5">Order #{session.orderId}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={session.status} action={session.actionTaken} expiresAt={session.expiresAt} />
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all text-lg leading-none">×</button>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-3">
            {session.customerName && (
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Customer</p>
                <p className="text-white text-sm font-medium">{session.customerName}</p>
              </div>
            )}
            {session.customerPhone && (
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Phone</p>
                <p className="text-white text-sm font-mono">{session.customerPhone}</p>
              </div>
            )}
            {session.orderAmount && (
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Amount</p>
                <p className="text-white text-sm font-semibold">{session.orderAmount}</p>
              </div>
            )}
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Key Pressed</p>
              <p className="text-white text-sm font-mono">{session.dtmfInput ? `"${session.dtmfInput}"` : "—"}</p>
            </div>
          </div>

          {/* Products */}
          {session.products && session.products.length > 0 && (
            <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">Products</p>
              {session.products.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-white/70">{p.quantity}× {p.name}</span>
                  <span className="text-white/50">৳{(p.price * p.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Call Link */}
          <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: "rgba(0,212,200,0.05)", border: "1px solid rgba(0,212,200,0.15)" }}>
            <p className="text-white/40 text-xs truncate flex-1">{callUrl}</p>
            <button
              onClick={() => { navigator.clipboard.writeText(callUrl); }}
              className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-all flex-shrink-0">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <a href={callUrl} target="_blank" rel="noreferrer"
              className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-all flex-shrink-0">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Webhook Status */}
          {session.ecommerceWebhookUrl && (
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/30 text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Webhook className="w-3 h-3" /> Webhook
                </p>
                <span className={`text-[10px] font-medium ${session.webhookSent ? "text-emerald-400" : "text-yellow-400"}`}>
                  {session.webhookSent ? "Sent ✓" : "Not sent"}
                </span>
              </div>
              <p className="text-white/25 text-xs truncate mb-2">{session.ecommerceWebhookUrl}</p>
              {session.webhookResponse && (
                <p className="text-white/30 text-xs bg-white/5 rounded px-2 py-1 mb-2 font-mono">
                  {session.webhookResponse}
                </p>
              )}
              {session.status === "completed" && (
                <button onClick={resendWebhook} disabled={resending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-400/25 hover:bg-indigo-500/25 transition-all disabled:opacity-50">
                  {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Resend Webhook
                </button>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-white/25 mb-0.5">Created</p>
              <p className="text-white/50">{new Date(session.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/25 mb-0.5">Expires</p>
              <p className={isExpired ? "text-red-400/60" : "text-white/50"}>{new Date(session.expiresAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Manual Status Override */}
          {session.status !== "completed" && (
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-white/30 text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1">
                <Edit2 className="w-3 h-3" /> Manual Override
              </p>
              <div className="flex gap-2">
                <button onClick={() => manualOverride("confirmed")} disabled={!!overriding}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 hover:bg-emerald-500/25 transition-all disabled:opacity-50">
                  {overriding === "confirmed" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Mark Confirmed
                </button>
                <button onClick={() => manualOverride("cancelled")} disabled={!!overriding}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-red-500/15 text-red-300 border border-red-400/25 hover:bg-red-500/25 transition-all disabled:opacity-50">
                  {overriding === "cancelled" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Mark Cancelled
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/8">
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm text-white/40 hover:text-white/60 hover:bg-white/5 transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

type DateFilter = "today" | "week" | "all";

const FRONTEND = typeof window !== "undefined" ? window.location.origin : "";

export function VoiceCallsPage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "confirmed" | "cancelled" | "pending">("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CallSession | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, confirmed: 0, cancelled: 0, pending: 0, conversionRate: 0, todayCount: 0 });
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [newCall, setNewCall] = useState({
    orderId: "", customerName: "", customerPhone: "",
    orderAmount: "", orderDetails: "", ecommerceSiteUrl: "", ecommerceWebhookUrl: "",
  });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [sessionsRes, statsRes] = await Promise.all([
        fetch(`${API}/api/voice-calls/`),
        fetch(`${API}/api/voice-calls/stats`),
      ]);
      const d: CallSession[] = await sessionsRes.json();
      const s: Stats = await statsRes.json();
      setSessions(d);
      setStats(s);
    } catch {
      if (!silent) toast({ title: "Failed to load calls", variant: "destructive" });
    } finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(() => load(true), 30000);
    } else {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    }
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [autoRefresh, load]);

  async function deleteSession(id: number) {
    if (!confirm("Delete this call session?")) return;
    try {
      await fetch(`${API}/api/voice-calls/${id}`, { method: "DELETE" });
      setSessions(s => s.filter(x => x.id !== id));
      toast({ title: "Deleted" });
    } catch { toast({ title: "Delete failed", variant: "destructive" }); }
  }

  async function deleteSelected() {
    if (!confirm(`Delete ${selectedIds.size} selected sessions?`)) return;
    const ids = Array.from(selectedIds);
    try {
      await fetch(`${API}/api/voice-calls/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      setSessions(s => s.filter(x => !selectedIds.has(x.id)));
      setSelectedIds(new Set());
      toast({ title: `Deleted ${ids.length} sessions` });
    } catch { toast({ title: "Bulk delete failed", variant: "destructive" }); }
  }

  async function updateStatus(id: number, actionTaken: string) {
    const r = await fetch(`${API}/api/voice-calls/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionTaken }),
    });
    if (!r.ok) throw new Error("Failed");
    setSessions(prev => prev.map(s =>
      s.id === id ? { ...s, actionTaken, status: "completed", dtmfInput: actionTaken === "confirmed" ? "1" : "2" } : s
    ));
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
      toast({ title: "Call session created!", description: `Token: ${d.token.slice(0, 12)}...` });
      setShowCreate(false);
      setNewCall({ orderId: "", customerName: "", customerPhone: "", orderAmount: "", orderDetails: "", ecommerceSiteUrl: "", ecommerceWebhookUrl: "" });
      load();
    } catch (e) {
      toast({ title: "Failed to create", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setCreating(false); }
  }

  function exportCSV() {
    const rows = [
      ["ID", "Order ID", "Customer", "Phone", "Amount", "Status", "Action", "Key", "Webhook Sent", "Created"],
      ...filtered.map(s => [
        s.id, s.orderId, s.customerName || "", s.customerPhone || "",
        s.orderAmount || "", s.status, s.actionTaken || "", s.dtmfInput || "",
        s.webhookSent ? "Yes" : "No", new Date(s.createdAt).toLocaleString(),
      ]),
    ];
    const csv = rows.map(r => r.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `voice-calls-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${FRONTEND}/call/${token}`);
    toast({ title: "Link copied!" });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const filtered = sessions
    .filter(s => {
      if (filter === "confirmed") return s.actionTaken === "confirmed";
      if (filter === "cancelled") return s.actionTaken === "cancelled";
      if (filter === "pending") return s.status === "pending";
      return true;
    })
    .filter(s => {
      if (dateFilter === "today") return new Date(s.createdAt) >= todayStart;
      if (dateFilter === "week") return new Date(s.createdAt) >= weekStart;
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
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(s => s.id)));
  };

  const filterCounts = {
    all: sessions.length,
    confirmed: sessions.filter(s => s.actionTaken === "confirmed").length,
    cancelled: sessions.filter(s => s.actionTaken === "cancelled").length,
    pending: sessions.filter(s => s.status === "pending").length,
  };

  return (
    <AdminLayout>
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onStatusChange={updateStatus}
          onRefresh={() => { load(true); setSelectedSession(null); }}
        />
      )}

      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <PhoneIncoming className="w-6 h-6 text-teal-400" />
              Voice Call Sessions
            </h1>
            <p className="text-white/40 text-sm mt-1">Auto-calling system for order confirmations</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${autoRefresh ? "bg-teal-500/15 text-teal-300 border-teal-400/25" : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"}`}
              title="Auto-refresh every 30s">
              {autoRefresh ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {autoRefresh ? "Auto ●" : "Auto"}
            </button>
            <Button size="sm" variant="ghost" onClick={() => load()} className="text-white/50 hover:text-white">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button size="sm" variant="ghost" onClick={exportCSV} className="text-white/50 hover:text-white gap-1.5">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => setShowCreate(!showCreate)}
              className="bg-teal-500 hover:bg-teal-400 text-black font-semibold gap-1.5">
              <Phone className="w-4 h-4" /> New Call
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Sessions" value={stats.total} sub={`${stats.todayCount} today`} icon={Phone} color="bg-indigo-500/15 text-indigo-300" />
          <StatCard label="Confirmed" value={stats.confirmed} sub={`${stats.conversionRate}% rate`} icon={CheckCircle2} color="bg-emerald-500/15 text-emerald-300" />
          <StatCard label="Cancelled" value={stats.cancelled} icon={XCircle} color="bg-red-500/15 text-red-300" />
          <StatCard label="Pending" value={stats.pending} sub={`${100 - stats.conversionRate}% unresolved`} icon={TrendingUp} color="bg-yellow-500/15 text-yellow-300" />
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
          <VoiceRecorder onUploaded={(url) => toast({ title: "Audio uploaded!", description: url })} />
        </div>

        {/* Filters */}
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
          {/* Status filter */}
          <div className="flex gap-2">
            {(["all", "confirmed", "cancelled", "pending"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? "bg-teal-500/20 text-teal-300 border border-teal-400/30" : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"}`}>
                {f} <span className="opacity-50">({filterCounts[f]})</span>
              </button>
            ))}
          </div>
          {/* Date filter */}
          <div className="flex gap-1.5 items-center">
            <Calendar className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            {(["today", "week", "all"] as const).map(d => (
              <button key={d} onClick={() => setDateFilter(d)}
                className={`px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${dateFilter === d ? "bg-white/15 text-white border border-white/20" : "text-white/30 hover:text-white/50"}`}>
                {d === "today" ? "Today" : d === "week" ? "7 Days" : "All"}
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
              <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-4 px-5 py-3 text-white/25 text-xs uppercase tracking-wider">
                <input type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === filtered.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded accent-teal-500 cursor-pointer" />
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
                    className={`grid grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-4 px-5 py-4 items-center hover:bg-white/3 transition-colors cursor-pointer ${selectedIds.has(s.id) ? "bg-teal-500/5" : ""}`}
                    onClick={e => {
                      if ((e.target as HTMLElement).closest("button, a, input")) return;
                      setSelectedSession(s);
                    }}>
                    <input type="checkbox"
                      checked={selectedIds.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      onClick={e => e.stopPropagation()}
                      className="w-4 h-4 rounded accent-teal-500 cursor-pointer" />
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">#{s.orderId}</p>
                      {s.customerName && <p className="text-white/40 text-xs truncate">{s.customerName}</p>}
                      {s.customerPhone && <p className="text-white/30 text-xs font-mono">{s.customerPhone}</p>}
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">{s.orderAmount || "—"}</p>
                      {s.webhookSent && (
                        <span className="text-[10px] text-emerald-400/60 flex items-center gap-0.5">
                          <Webhook className="w-2.5 h-2.5" /> sent
                        </span>
                      )}
                    </div>
                    <div>
                      <StatusBadge status={s.status} action={s.actionTaken} expiresAt={s.expiresAt} />
                      {isExp && s.status === "pending" && (
                        <span className="ml-1 text-[10px] text-white/20">expired</span>
                      )}
                    </div>
                    <div className="text-white/30 text-xs whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={e => { e.stopPropagation(); setSelectedSession(s); }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-teal-300 transition-all" title="View details">
                        <Info className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); copyLink(s.token); }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all" title="Copy call link">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a href={callUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-teal-300 transition-all" title="Open call">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={e => { e.stopPropagation(); deleteSession(s.id); }}
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

        <div className="flex items-center justify-between">
          <p className="text-white/20 text-xs">
            {filtered.length} of {sessions.length} sessions
            {autoRefresh && <span className="ml-2 text-teal-400/50">● auto-refreshing every 30s</span>}
          </p>
          <p className="text-white/15 text-xs">Click any row to view full details</p>
        </div>
      </div>
    </AdminLayout>
  );
}
