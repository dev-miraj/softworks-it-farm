import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  Server, Cpu, MemoryStick, Wifi, WifiOff, Activity,
  CircleCheck, CircleX, RotateCcw, Clock, Layers, Mail,
  AlertTriangle, CheckCircle2, Radio,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "";

function StatCard({ icon: Icon, label, value, sub, color = "text-blue-400", bg = "bg-blue-400/10" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  color?: string; bg?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex items-start gap-4">
      <div className={`rounded-lg p-3 ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ state }: { state: string }) {
  const map: Record<string, string> = {
    CLOSED: "bg-emerald-400/20 text-emerald-400",
    OPEN:   "bg-red-400/20 text-red-400",
    HALF_OPEN: "bg-yellow-400/20 text-yellow-400",
    ready:  "bg-emerald-400/20 text-emerald-400",
    error:  "bg-red-400/20 text-red-400",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[state] ?? "bg-slate-400/20 text-slate-400"}`}>
      {state}
    </span>
  );
}

export function SystemStatusPage() {
  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ["system-status"],
    queryFn: async () => {
      const r = await fetch(`${API}/api/admin/system-status`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json() as Promise<{ success: boolean; data: any }>;
    },
    refetchInterval: 10_000,
  });

  const { data: ready } = useQuery({
    queryKey: ["readiness"],
    queryFn: async () => {
      const r = await fetch(`${API}/api/ready`);
      return r.json() as Promise<any>;
    },
    refetchInterval: 15_000,
  });

  const { data: metrics } = useQuery({
    queryKey: ["metrics-json"],
    queryFn: async () => {
      const r = await fetch(`${API}/api/metrics/json`, { credentials: "include" });
      return r.json() as Promise<{ success: boolean; data: any }>;
    },
    refetchInterval: 10_000,
  });

  const { data: payments } = useQuery({
    queryKey: ["payment-status"],
    queryFn: async () => {
      const r = await fetch(`${API}/api/payments/status`, { credentials: "include" });
      return r.json() as Promise<{ success: boolean; data: any }>;
    },
  });

  const d = status?.data;
  const m = metrics?.data;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Server className="h-6 w-6 text-blue-400" /> System Status
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Live server health, queue, and infrastructure monitoring</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition border border-blue-500/30"
          >
            <RotateCcw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-5 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <>
            {/* Readiness + Server Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={ready?.status === "ready" ? CircleCheck : CircleX}
                label="DB Status"
                value={ready?.db ?? "—"}
                sub={`Status: ${ready?.status ?? "—"}`}
                color={ready?.status === "ready" ? "text-emerald-400" : "text-red-400"}
                bg={ready?.status === "ready" ? "bg-emerald-400/10" : "bg-red-400/10"}
              />
              <StatCard
                icon={Clock}
                label="Uptime"
                value={`${Math.floor((d?.server?.uptime ?? 0) / 60)}m`}
                sub={`${d?.server?.uptime ?? 0}s total`}
                color="text-teal-400"
                bg="bg-teal-400/10"
              />
              <StatCard
                icon={MemoryStick}
                label="Heap Memory"
                value={ready?.memory?.heap ?? d?.server?.memory?.heap ?? "—"}
                sub={`RSS: ${ready?.memory?.rss ?? d?.server?.memory?.rss ?? "—"}`}
                color="text-violet-400"
                bg="bg-violet-400/10"
              />
              <StatCard
                icon={Cpu}
                label="Node Version"
                value={d?.server?.nodeVersion ?? "—"}
                sub={`PID: ${d?.server?.pid ?? "—"}`}
                color="text-amber-400"
                bg="bg-amber-400/10"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Queue Stats */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-400" /> Job Queue
                </h3>
                {d?.queue ? (
                  <div className="space-y-3">
                    {Object.entries(d.queue as Record<string, number>).filter(([k]) => k !== "total").map(([key, val]) => {
                      const color = key === "done" ? "text-emerald-400" : key === "failed" ? "text-red-400" : key === "processing" ? "text-blue-400" : key === "retrying" ? "text-yellow-400" : "text-slate-400";
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground capitalize">{key}</span>
                          <span className={`text-sm font-bold ${color}`}>{val as number}</span>
                        </div>
                      );
                    })}
                    <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Total</span>
                      <span className="text-sm font-bold text-foreground">{(d.queue as any).total}</span>
                    </div>
                  </div>
                ) : <p className="text-xs text-muted-foreground">Loading...</p>}
              </div>

              {/* Circuit Breaker */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-rose-400" /> Circuit Breakers
                </h3>
                {d?.circuitBreakers ? (
                  <div className="space-y-3">
                    {Object.entries(d.circuitBreakers as Record<string, any>).map(([name, info]) => (
                      <div key={name} className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-foreground capitalize">{name}</p>
                          <p className="text-xs text-muted-foreground">failures: {info?.failures ?? 0}</p>
                        </div>
                        <StatusBadge state={info?.state ?? "CLOSED"} />
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">No circuit breakers active</p>}
              </div>

              {/* SSE Connections */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Radio className="h-4 w-4 text-teal-400" /> Live Connections (SSE)
                </h3>
                {m?.sse ? (
                  <>
                    <p className="text-3xl font-bold text-teal-400 mb-1">{m.sse.connected}</p>
                    <p className="text-xs text-muted-foreground mb-3">clients connected</p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {(m.sse.clients as any[]).map((c: any) => (
                        <div key={c.id} className="flex items-center justify-between text-xs rounded-md px-2 py-1 bg-white/5">
                          <span className="text-foreground font-medium">{c.username ?? "anonymous"}</span>
                          <span className="text-muted-foreground">{new Date(c.connectedAt).toLocaleTimeString()}</span>
                        </div>
                      ))}
                      {!m.sse.clients.length && <p className="text-xs text-muted-foreground">No active connections</p>}
                    </div>
                  </>
                ) : <p className="text-xs text-muted-foreground">Loading...</p>}
              </div>
            </div>

            {/* Payment Gateways */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Mail className="h-4 w-4 text-amber-400" /> Payment Gateways
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    name: "SSLCommerz",
                    enabled: payments?.data?.sslcommerz?.enabled,
                    sub: payments?.data?.sslcommerz?.sandbox ? "Sandbox mode" : "Live mode",
                    color: "text-green-400",
                  },
                  {
                    name: "Stripe",
                    enabled: payments?.data?.stripe?.enabled,
                    sub: "Global payments (USD)",
                    color: "text-violet-400",
                  },
                ].map((gw) => (
                  <div key={gw.name} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div>
                      <p className="text-sm font-medium text-foreground">{gw.name}</p>
                      <p className="text-xs text-muted-foreground">{gw.sub}</p>
                    </div>
                    {gw.enabled ? (
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-semibold">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs">Not configured</span>
                      </div>
                    )}
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
