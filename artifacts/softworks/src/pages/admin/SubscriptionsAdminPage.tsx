import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  CreditCard, Crown, Zap, Shield, Users, Calendar,
  CheckCircle2, AlertTriangle, RefreshCw, Search,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL ?? "";

interface Subscription {
  id: number;
  username: string;
  plan: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  stripeCustomerId?: string;
  sslTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

const PLAN_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  free:       { label: "Free",       icon: Shield,  color: "text-slate-400",   bg: "bg-slate-400/10" },
  pro:        { label: "Pro",        icon: Zap,     color: "text-blue-400",    bg: "bg-blue-400/10" },
  enterprise: { label: "Enterprise", icon: Crown,   color: "text-amber-400",   bg: "bg-amber-400/10" },
};

function PlanBadge({ plan }: { plan: string }) {
  const cfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon className="h-3 w-3" />{cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === "active" ? "text-emerald-400 bg-emerald-400/10"
    : status === "trial" ? "text-blue-400 bg-blue-400/10"
    : status === "expired" ? "text-red-400 bg-red-400/10"
    : "text-slate-400 bg-slate-400/10";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{status}</span>;
}

function days(end: string | null) {
  if (!end) return null;
  const d = Math.ceil((new Date(end).getTime() - Date.now()) / 86400_000);
  return d;
}

export function SubscriptionsAdminPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editModal, setEditModal] = useState<{ open: boolean; sub?: Subscription }>({ open: false });
  const [formPlan, setFormPlan] = useState("pro");
  const [formDays, setFormDays] = useState(30);
  const [formUsername, setFormUsername] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const r = await fetch(`${API}/api/subscriptions`, { credentials: "include" });
      return r.json() as Promise<{ success: boolean; data: Subscription[] }>;
    },
  });

  const upgrade = useMutation({
    mutationFn: async (body: { username: string; plan: string; periodDays: number }) => {
      const r = await fetch(`${API}/api/subscriptions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      setEditModal({ open: false });
      toast({ title: "Subscription updated" });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const subs = (data?.data ?? []).filter((s) =>
    !search || s.username.toLowerCase().includes(search.toLowerCase())
  );

  const totalByPlan = (data?.data ?? []).reduce<Record<string, number>>((acc, s) => {
    acc[s.plan] = (acc[s.plan] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <AdminLayout>
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground mb-4">
              {editModal.sub ? `Edit: ${editModal.sub.username}` : "Assign Subscription"}
            </h2>
            <div className="space-y-4">
              {!editModal.sub && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Username</label>
                  <input
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground"
                    placeholder="admin"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(PLAN_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setFormPlan(key)}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border transition ${
                          formPlan === key
                            ? `${cfg.bg} ${cfg.color} border-current`
                            : "bg-white/5 border-white/10 text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-semibold">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Duration (days)</label>
                <div className="flex gap-2">
                  {[30, 90, 180, 365].map((d) => (
                    <button
                      key={d}
                      onClick={() => setFormDays(d)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                        formDays === d
                          ? "bg-blue-500/20 border-blue-500 text-blue-400"
                          : "bg-white/5 border-white/10 text-muted-foreground"
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditModal({ open: false })}
                className="flex-1 rounded-lg py-2.5 text-sm border border-white/10 text-muted-foreground hover:border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={() => upgrade.mutate({
                  username: editModal.sub?.username ?? formUsername,
                  plan: formPlan,
                  periodDays: formDays,
                })}
                disabled={upgrade.isPending}
                className="flex-1 rounded-lg py-2.5 text-sm bg-blue-500 text-white font-semibold hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                {upgrade.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-blue-400" /> Subscriptions
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage user plans and billing</p>
          </div>
          <button
            onClick={() => { setEditModal({ open: true }); setFormPlan("pro"); setFormDays(30); setFormUsername(""); }}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition"
          >
            <Users className="h-4 w-4" /> Assign Plan
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(PLAN_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={key} className={`rounded-xl border border-white/10 ${cfg.bg} p-4 flex items-center gap-3`}>
                <Icon className={`h-5 w-5 ${cfg.color} flex-shrink-0`} />
                <div>
                  <p className={`text-xl font-bold ${cfg.color}`}>{totalByPlan[key] ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{cfg.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/10 bg-white/5">
          <div className="p-4 border-b border-white/10 flex items-center gap-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : subs.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">No subscriptions found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-white/10">
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Plan</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Status</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Expires</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subs.map((s) => {
                  const remaining = days(s.currentPeriodEnd);
                  return (
                    <tr key={s.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{s.username}</p>
                        {s.sslTransactionId && <p className="text-xs text-muted-foreground font-mono">{s.sslTransactionId}</p>}
                      </td>
                      <td className="px-4 py-3"><PlanBadge plan={s.plan} /></td>
                      <td className="px-4 py-3 hidden md:table-cell"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {s.currentPeriodEnd ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(s.currentPeriodEnd).toLocaleDateString()}
                              {remaining !== null && (
                                <span className={remaining < 7 ? "text-red-400 ml-1" : "text-muted-foreground ml-1"}>
                                  ({remaining}d left)
                                </span>
                              )}
                            </span>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setEditModal({ open: true, sub: s });
                            setFormPlan(s.plan);
                            setFormDays(30);
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 transition"
                        >
                          Edit Plan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
