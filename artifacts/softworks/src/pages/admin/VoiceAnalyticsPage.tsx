import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { API } from "@/lib/apiUrl";
import {
  Phone, CheckCircle2, XCircle, Clock, TrendingUp, Activity,
  Loader2, RefreshCw, BarChart2, Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Analytics {
  total: number;
  confirmed: number;
  cancelled: number;
  pending: number;
  active: number;
  conversionRate: number;
  avgDuration: number;
  todayCount: number;
  todayConfirmed: number;
  keyDistribution: Record<string, number>;
  last7Days: { date: string; total: number; confirmed: number; cancelled: number }[];
}

function StatCard({ label, value, sub, icon: Icon, color, big }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; big?: boolean;
}) {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className={`font-bold text-foreground ${big ? "text-4xl" : "text-3xl"}`}>{value}</div>
      <div className="text-muted-foreground text-sm mt-0.5">{label}</div>
      {sub && <div className="text-muted-foreground/60 text-xs mt-1">{sub}</div>}
    </div>
  );
}

function fmtDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function MiniBarChart({ data }: { data: Analytics["last7Days"] }) {
  const maxTotal = Math.max(...data.map(d => d.total), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => {
        const totalH = Math.round((d.total / maxTotal) * 100);
        const confirmedH = d.total > 0 ? Math.round((d.confirmed / d.total) * totalH) : 0;
        const cancelledH = d.total > 0 ? Math.round((d.cancelled / d.total) * totalH) : 0;
        const pendingH = Math.max(0, totalH - confirmedH - cancelledH);
        const dateLabel = new Date(d.date).toLocaleDateString("en", { month: "short", day: "numeric" });
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className="flex flex-col-reverse justify-start items-stretch w-full rounded-t-sm overflow-hidden" style={{ height: "110px" }}>
              <div style={{ height: `${confirmedH}%`, minHeight: confirmedH > 0 ? 2 : 0, background: "rgba(0,212,200,0.7)" }} />
              <div style={{ height: `${cancelledH}%`, minHeight: cancelledH > 0 ? 2 : 0, background: "rgba(239,68,68,0.6)" }} />
              <div style={{ height: `${pendingH}%`, minHeight: pendingH > 0 ? 2 : 0, background: "rgba(255,255,255,0.1)" }} />
            </div>
            <span className="text-white/30 text-[9px] whitespace-nowrap">{dateLabel}</span>
            <span className="text-white/50 text-[10px] font-medium">{d.total}</span>
          </div>
        );
      })}
    </div>
  );
}

export function VoiceAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/voice-calls/analytics`, {
        credentials: "include",
      });
      if (r.ok) setData(await r.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-teal-400" />
              Call Analytics
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Real-time insights into AI calling performance</p>
          </div>
          <Button size="sm" variant="ghost" onClick={load} className="text-white/50 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-white/30" />
          </div>
        ) : !data ? (
          <div className="text-center py-20 text-white/30">Failed to load analytics</div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Calls" value={data.total} sub={`${data.todayCount} today`}
                icon={Phone} color="bg-indigo-500/15 text-indigo-300" />
              <StatCard label="Confirmed" value={data.confirmed}
                sub={`${data.conversionRate}% conversion`}
                icon={CheckCircle2} color="bg-teal-500/15 text-teal-300" />
              <StatCard label="Cancelled" value={data.cancelled}
                icon={XCircle} color="bg-red-500/15 text-red-300" />
              <StatCard label="Avg Duration" value={data.avgDuration > 0 ? fmtDuration(data.avgDuration) : "—"}
                sub="per call"
                icon={Clock} color="bg-yellow-500/15 text-yellow-300" />
            </div>

            {/* Today + live */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="backdrop-blur-xl bg-teal-500/5 border border-teal-400/20 rounded-2xl p-5">
                <p className="text-teal-400 text-xs font-semibold uppercase tracking-wider mb-2">Today</p>
                <div className="text-4xl font-bold text-white">{data.todayCount}</div>
                <p className="text-white/40 text-sm mt-1">total calls initiated</p>
                <div className="mt-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span className="text-teal-300 font-semibold">{data.todayConfirmed}</span>
                  <span className="text-white/40 text-sm">confirmed today</span>
                </div>
              </div>
              <div className="backdrop-blur-xl bg-violet-500/5 border border-violet-400/20 rounded-2xl p-5">
                <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-2">Active Now</p>
                <div className="flex items-center gap-3">
                  <div className="text-4xl font-bold text-white">{data.active}</div>
                  {data.active > 0 && (
                    <div className="w-3 h-3 rounded-full bg-violet-400 animate-pulse" />
                  )}
                </div>
                <p className="text-white/40 text-sm mt-1">live calls in progress</p>
              </div>
              <div className="backdrop-blur-xl bg-yellow-500/5 border border-yellow-400/20 rounded-2xl p-5">
                <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-2">Pending</p>
                <div className="text-4xl font-bold text-white">{data.pending}</div>
                <p className="text-white/40 text-sm mt-1">awaiting customer response</p>
              </div>
            </div>

            {/* 7-day chart + key distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* 7-day trend */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-semibold text-sm mb-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                  Last 7 Days
                </h3>
                <p className="text-white/30 text-xs mb-4">Call volume by day</p>
                <MiniBarChart data={data.last7Days} />
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(0,212,200,0.7)" }} />
                    <span className="text-white/40 text-xs">Confirmed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(239,68,68,0.6)" }} />
                    <span className="text-white/40 text-xs">Cancelled</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-white/10" />
                    <span className="text-white/40 text-xs">Pending</span>
                  </div>
                </div>
              </div>

              {/* Key press distribution */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-semibold text-sm mb-1 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  Key Press Distribution
                </h3>
                <p className="text-white/30 text-xs mb-4">How customers respond</p>
                {Object.keys(data.keyDistribution).length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <Mic className="w-10 h-10 text-white/10" />
                    <p className="text-white/25 text-sm">No key press data yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(data.keyDistribution)
                      .sort(([, a], [, b]) => b - a)
                      .map(([key, count]) => {
                        const total = Object.values(data.keyDistribution).reduce((s, v) => s + v, 0);
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold text-sm font-mono">
                                  {key}
                                </div>
                                <span className="text-white/60 text-sm">Key {key}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-semibold text-sm">{count}</span>
                                <span className="text-white/30 text-xs">({pct}%)</span>
                              </div>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-indigo-500 transition-all"
                                style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Conversion funnel */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-yellow-400" />
                Conversion Funnel
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Sessions Created", value: data.total, pct: 100, color: "from-indigo-500 to-indigo-400" },
                  { label: "Calls Answered", value: data.total - data.pending, pct: data.total > 0 ? Math.round(((data.total - data.pending) / data.total) * 100) : 0, color: "from-teal-500 to-teal-400" },
                  { label: "Orders Confirmed", value: data.confirmed, pct: data.total > 0 ? Math.round((data.confirmed / data.total) * 100) : 0, color: "from-emerald-500 to-emerald-400" },
                ].map(row => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-white/60 text-sm">{row.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{row.value}</span>
                        <span className="text-white/30 text-xs w-10 text-right">{row.pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${row.color} transition-all`}
                        style={{ width: `${row.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </>
        )}
      </div>
    </AdminLayout>
  );
}
