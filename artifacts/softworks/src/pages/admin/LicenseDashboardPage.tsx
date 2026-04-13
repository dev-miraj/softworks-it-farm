import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  Shield, KeyRound, Activity, AlertTriangle, Ban, DollarSign,
  Package, TrendingUp, Clock, CheckCircle2, XCircle, Zap,
  Globe, Server, Cpu, ArrowUpRight, Sparkles,
} from "lucide-react";

import { API } from "@/lib/apiUrl";

type Stats = {
  totalLicenses: number; active: number; trial: number; expired: number;
  suspended: number; blacklisted: number; overdue: number; totalActivations: number;
  totalRevenue: number; totalPayments: number; totalProducts: number;
  byType: { lifetime: number; monthly: number; yearly: number; trial: number };
  recentActivity: { id: number; key: string; product: string; status: string; client: string }[];
};

function useStats() {
  return useQuery<Stats>({
    queryKey: ["license-stats"],
    queryFn: async () => { const r = await fetch(`${API}/api/license-stats`); return r.json(); },
  });
}

const statusColor: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  trial: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  expired: "bg-red-500/10 text-red-400 border-red-500/20",
  suspended: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const statusIcon: Record<string, React.ReactNode> = {
  active: <CheckCircle2 className="w-3 h-3" />,
  trial: <Clock className="w-3 h-3" />,
  expired: <XCircle className="w-3 h-3" />,
  suspended: <Ban className="w-3 h-3" />,
};

export function LicenseDashboardPage() {
  const { data: stats } = useStats();

  if (!stats) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    </AdminLayout>
  );

  const totalTypeCount = stats.byType.lifetime + stats.byType.monthly + stats.byType.yearly + stats.byType.trial;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center border border-violet-500/30 relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-600/10 to-cyan-600/10 animate-pulse" />
              <Shield className="w-6 h-6 text-violet-400 relative z-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                License Dashboard
                <Sparkles className="w-5 h-5 text-violet-400" />
              </h1>
              <p className="text-sm text-muted-foreground">SOFTWORKS License System — Real-time Analytics</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">System Active</span>
          </div>
        </div>

        {/* Primary Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { label: "মোট License", value: stats.totalLicenses, icon: KeyRound, color: "text-foreground", gradient: "from-slate-500/10 to-slate-600/5", border: "border-slate-500/20" },
            { label: "সক্রিয়", value: stats.active, icon: CheckCircle2, color: "text-emerald-400", gradient: "from-emerald-500/10 to-emerald-600/5", border: "border-emerald-500/20" },
            { label: "Trial", value: stats.trial, icon: Clock, color: "text-amber-400", gradient: "from-amber-500/10 to-amber-600/5", border: "border-amber-500/20" },
            { label: "মেয়াদোত্তীর্ণ", value: stats.expired, icon: XCircle, color: "text-red-400", gradient: "from-red-500/10 to-red-600/5", border: "border-red-500/20" },
          ].map(({ label, value, icon: Icon, color, gradient, border }) => (
            <div key={label} className={`rounded-xl border ${border} bg-gradient-to-br ${gradient} p-4 relative overflow-hidden group hover:scale-[1.02] transition-transform`}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/[0.02] rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform" />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <Icon className={`w-5 h-5 ${color}`} />
                <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className={`text-3xl font-bold ${color} relative z-10`}>{value}</div>
              <div className="text-xs text-muted-foreground mt-1 relative z-10">{label}</div>
            </div>
          ))}
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "স্থগিত", value: stats.suspended, icon: Ban, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
            { label: "Blacklisted", value: stats.blacklisted, icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
            { label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
            { label: "Activations", value: stats.totalActivations, icon: Activity, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
            { label: "মোট আয়", value: `৳${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
            { label: "পেমেন্ট", value: stats.totalPayments, icon: DollarSign, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
            { label: "Products", value: stats.totalProducts, icon: Package, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`rounded-xl border p-3 ${bg}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className="text-[10px] text-muted-foreground truncate">{label}</span>
              </div>
              <div className={`text-xl font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* License Type Breakdown */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="font-semibold text-foreground mb-5 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              License Type Breakdown
            </h3>
            <div className="space-y-4">
              {[
                { label: "Lifetime", labelBn: "আজীবন", value: stats.byType.lifetime, color: "bg-emerald-500", textColor: "text-emerald-400" },
                { label: "Monthly", labelBn: "মাসিক", value: stats.byType.monthly, color: "bg-blue-500", textColor: "text-blue-400" },
                { label: "Yearly", labelBn: "বার্ষিক", value: stats.byType.yearly, color: "bg-violet-500", textColor: "text-violet-400" },
                { label: "Trial", labelBn: "ট্রায়াল", value: stats.byType.trial, color: "bg-amber-500", textColor: "text-amber-400" },
              ].map(({ label, labelBn, value, color, textColor }) => {
                const pct = totalTypeCount ? Math.round((value / totalTypeCount) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                        <span className="text-sm text-foreground font-medium">{label}</span>
                        <span className="text-xs text-muted-foreground">({labelBn})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${textColor}`}>{value}</span>
                        <span className="text-xs text-muted-foreground">({pct}%)</span>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-full h-2.5 overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mini donut visual */}
            <div className="mt-6 pt-5 border-t border-white/5">
              <div className="flex items-center justify-center gap-6">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                    {(() => {
                      const segments = [
                        { value: stats.byType.lifetime, color: "#10b981" },
                        { value: stats.byType.monthly, color: "#3b82f6" },
                        { value: stats.byType.yearly, color: "#8b5cf6" },
                        { value: stats.byType.trial, color: "#f59e0b" },
                      ];
                      const circumference = 2 * Math.PI * 40;
                      let offset = 0;
                      return segments.map((seg, i) => {
                        const pct = totalTypeCount ? (seg.value / totalTypeCount) : 0;
                        const dash = pct * circumference;
                        const el = (
                          <circle key={i} cx="50" cy="50" r="40" fill="none" stroke={seg.color}
                            strokeWidth="12" strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={-offset} className="transition-all duration-700"
                          />
                        );
                        offset += dash;
                        return el;
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{totalTypeCount}</div>
                      <div className="text-[9px] text-muted-foreground">মোট</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Lifetime", color: "bg-emerald-500", value: stats.byType.lifetime },
                    { label: "Monthly", color: "bg-blue-500", value: stats.byType.monthly },
                    { label: "Yearly", color: "bg-violet-500", value: stats.byType.yearly },
                    { label: "Trial", color: "bg-amber-500", value: stats.byType.trial },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${s.color}`} />
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="text-foreground font-medium">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="font-semibold text-foreground mb-5 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                <Activity className="w-4 h-4 text-violet-400" />
              </div>
              সাম্প্রতিক License
            </h3>
            <div className="space-y-2">
              {stats.recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">কোনো license নেই</div>
              ) : (
                stats.recentActivity.map((l) => (
                  <div key={l.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shrink-0">
                        <KeyRound className="w-4 h-4 text-violet-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{l.product}</div>
                        <div className="text-xs text-muted-foreground font-mono truncate">{l.key.slice(0, 18)}...</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs text-muted-foreground hidden sm:block">{l.client}</span>
                      <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${statusColor[l.status] || "bg-muted text-muted-foreground border-border"}`}>
                        {statusIcon[l.status]}
                        {l.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.05] to-purple-500/[0.02] p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-[40px]" />
            <div className="relative z-10">
              <Globe className="w-6 h-6 text-violet-400 mb-3" />
              <h4 className="text-sm font-bold text-foreground mb-1">Domain Binding</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">প্রতিটি license নির্দিষ্ট domain-এ lock থাকে। Unauthorized domain-এ কাজ করবে না।</p>
            </div>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.05] to-blue-500/[0.02] p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-[40px]" />
            <div className="relative z-10">
              <Cpu className="w-6 h-6 text-cyan-400 mb-3" />
              <h4 className="text-sm font-bold text-foreground mb-1">Hardware Lock</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Device fingerprinting দিয়ে hardware-level protection। Clone করলেও কাজ করবে না।</p>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.05] to-green-500/[0.02] p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-[40px]" />
            <div className="relative z-10">
              <Zap className="w-6 h-6 text-emerald-400 mb-3" />
              <h4 className="text-sm font-bold text-foreground mb-1">Real-time Control</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Kill switch, blacklist, activation reset — সব real-time-এ কাজ করে। কোনো delay নেই।</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
