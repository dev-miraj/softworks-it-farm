import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Phone, RefreshCw, Trash2, CheckCircle2, XCircle, Clock, AlertCircle, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || (import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "");

interface CallSession {
  id: number;
  token: string;
  orderId: string;
  customerName: string | null;
  customerPhone: string | null;
  orderAmount: string | null;
  status: string;
  dtmfInput: string | null;
  actionTaken: string | null;
  webhookSent: boolean;
  webhookResponse: string | null;
  createdAt: string;
  expiresAt: string;
}

function StatusBadge({ status, action }: { status: string; action: string | null }) {
  if (action === "confirmed") return (
    <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-300 border border-green-400/30 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Confirmed
    </span>
  );
  if (action === "cancelled") return (
    <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-300 border border-red-400/30 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" /> Cancelled
    </span>
  );
  if (status === "completed") return (
    <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 px-2 py-0.5 rounded-full">
      <AlertCircle className="w-3 h-3" /> Completed
    </span>
  );
  const expired = new Date() > new Date("" /* expiresAt placeholder */);
  return (
    <span className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

export function VoiceCallsPage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "confirmed" | "cancelled" | "pending">("all");

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/voice-calls/`);
      const d = await r.json();
      setSessions(d);
    } catch {
      toast({ title: "Failed to load calls", variant: "destructive" });
    } finally {
      setLoading(false);
    }
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

  function copyCallUrl(token: string) {
    const url = `${window.location.origin}/call/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Call URL copied!" });
  }

  function openCall(token: string) {
    window.open(`/call/${token}`, "_blank");
  }

  const filtered = sessions.filter(s => {
    if (filter === "all") return true;
    if (filter === "confirmed") return s.actionTaken === "confirmed";
    if (filter === "cancelled") return s.actionTaken === "cancelled";
    if (filter === "pending") return s.status !== "completed";
    return true;
  });

  const stats = {
    total: sessions.length,
    confirmed: sessions.filter(s => s.actionTaken === "confirmed").length,
    cancelled: sessions.filter(s => s.actionTaken === "cancelled").length,
    pending: sessions.filter(s => s.status !== "completed").length,
  };

  const fmtDate = (d: string) => new Date(d).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" });

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Call Sessions</h1>
              <p className="text-white/40 text-sm">Order confirmation call history</p>
            </div>
          </div>
          <Button onClick={load} variant="outline" size="sm" className="border-white/20 text-white/70">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Calls", value: stats.total, color: "indigo" },
            { label: "Confirmed", value: stats.confirmed, color: "green" },
            { label: "Cancelled", value: stats.cancelled, color: "red" },
            { label: "Pending", value: stats.pending, color: "yellow" },
          ].map(s => (
            <div key={s.label} className={`bg-${s.color}-500/10 border border-${s.color}-400/20 rounded-xl p-4`}>
              <p className={`text-${s.color}-300 text-2xl font-bold`}>{s.value}</p>
              <p className="text-white/40 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          {(["all", "confirmed", "cancelled", "pending"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filter === f ? "bg-indigo-600 text-white" : "bg-white/5 text-white/50 hover:text-white"}`}>
              {f}
            </button>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                <th className="text-left p-4">Order ID</th>
                <th className="text-left p-4">Customer</th>
                <th className="text-left p-4">Amount</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Webhook</th>
                <th className="text-left p-4">Created</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-white/30">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-white/30">
                  <Phone className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No call sessions yet
                </td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/3 transition">
                  <td className="p-4">
                    <p className="text-white font-mono text-sm">#{s.orderId}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-white text-sm">{s.customerName || "—"}</p>
                    {s.customerPhone && <p className="text-white/40 text-xs">{s.customerPhone}</p>}
                  </td>
                  <td className="p-4">
                    <p className="text-white/70 text-sm">{s.orderAmount || "—"}</p>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={s.status} action={s.actionTaken} />
                    {s.dtmfInput && (
                      <p className="text-white/30 text-xs mt-1">Key: {s.dtmfInput}</p>
                    )}
                  </td>
                  <td className="p-4">
                    {s.webhookSent ? (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Sent
                      </span>
                    ) : (
                      <span className="text-xs text-white/30">Not sent</span>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="text-white/50 text-xs">{fmtDate(s.createdAt)}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => copyCallUrl(s.token)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition" title="Copy call URL">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {s.status !== "completed" && (
                        <button onClick={() => openCall(s.token)}
                          className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-indigo-400/60 hover:text-indigo-300 transition" title="Open call">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => deleteSession(s.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-300 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
