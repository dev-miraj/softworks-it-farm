import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  Shield, KeyRound, Activity, AlertTriangle, Ban, DollarSign,
  Package, TrendingUp, Clock, CheckCircle2, XCircle,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "";

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

const statCards = (s: Stats) => [
  { label: "মোট License", value: s.totalLicenses, icon: KeyRound, color: "text-foreground", bg: "bg-slate-500/10 border-slate-500/20" },
  { label: "সক্রিয়", value: s.active, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { label: "Trial", value: s.trial, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { label: "মেয়াদোত্তীর্ণ", value: s.expired, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  { label: "স্থগিত", value: s.suspended, icon: Ban, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { label: "Blacklisted", value: s.blacklisted, icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  { label: "Overdue", value: s.overdue, icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  { label: "সক্রিয় Activation", value: s.totalActivations, icon: Activity, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { label: "মোট আয়", value: `৳${s.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  { label: "পেমেন্ট", value: s.totalPayments, icon: DollarSign, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { label: "Products", value: s.totalProducts, icon: Package, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
];

const statusColor: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  trial: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  expired: "bg-red-500/10 text-red-400 border-red-500/20",
  suspended: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export function LicenseDashboardPage() {
  const { data: stats } = useStats();

  if (!stats) return <AdminLayout><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
            <Shield className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">License Dashboard</h1>
            <p className="text-sm text-muted-foreground">SOFTWORKS License System — Analytics Overview</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {statCards(stats).map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`rounded-xl border p-4 ${bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> License Type Breakdown
            </h3>
            <div className="space-y-3">
              {[
                { label: "Lifetime", value: stats.byType.lifetime, color: "bg-emerald-500" },
                { label: "Monthly", value: stats.byType.monthly, color: "bg-blue-500" },
                { label: "Yearly", value: stats.byType.yearly, color: "bg-violet-500" },
                { label: "Trial", value: stats.byType.trial, color: "bg-amber-500" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-20">{label}</span>
                  <div className="flex-1 bg-muted/30 rounded-full h-3 overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${stats.totalLicenses ? (value / stats.totalLicenses) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-bold text-foreground w-8 text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> সাম্প্রতিক License
            </h3>
            <div className="space-y-2">
              {stats.recentActivity.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20">
                  <div>
                    <div className="text-sm font-medium text-foreground">{l.product}</div>
                    <div className="text-xs text-muted-foreground font-mono">{l.key.slice(0, 20)}...</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{l.client}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[l.status] || "bg-muted text-muted-foreground border-border"}`}>
                      {l.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
