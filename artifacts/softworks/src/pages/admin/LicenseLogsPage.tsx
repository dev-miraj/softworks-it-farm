import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ScrollText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

import { API } from "@/lib/apiUrl";

type LogEntry = {
  id: number; licenseId: number | null; licenseKey: string | null;
  action: string; details: string | null; ipAddress: string | null;
  userAgent: string | null; domain: string | null; status: string | null; createdAt: string;
};

const actionColors: Record<string, string> = {
  created: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  activated: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  deactivated: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  suspended: "bg-red-500/10 text-red-400 border-red-500/20",
  blacklisted: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  unblacklisted: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  updated: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  deleted: "bg-red-500/10 text-red-400 border-red-500/20",
  "kill-switch": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "payment-received": "bg-green-500/10 text-green-400 border-green-500/20",
  "marked-overdue": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "reset-activations": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "validate-failed": "bg-red-500/10 text-red-400 border-red-500/20",
  "activate-failed": "bg-red-500/10 text-red-400 border-red-500/20",
};

export function LicenseLogsPage() {
  const { data: logs } = useQuery<LogEntry[]>({
    queryKey: ["license-logs"],
    queryFn: async () => { const r = await fetch(`${API}/api/license-logs`); return r.json(); },
    refetchInterval: 10_000,
  });
  const [search, setSearch] = useState("");

  const filtered = (logs ?? []).filter(l => {
    const q = search.toLowerCase();
    return !q || (l.licenseKey || "").toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || (l.details || "").toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <ScrollText className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <p className="text-sm text-muted-foreground">License system activity log — real-time auto-refresh</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Key, action, বা details দিয়ে খুঁজুন…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="space-y-2">
          {filtered.map(l => (
            <div key={l.id} className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${actionColors[l.action] || "bg-muted text-muted-foreground border-border"}`}>
                  {l.action}
                </span>
                <div className="min-w-0 flex-1">
                  {l.licenseKey && <span className="font-mono text-xs text-foreground">{l.licenseKey.slice(0, 22)}…</span>}
                  {l.details && <p className="text-xs text-muted-foreground truncate mt-0.5">{l.details}</p>}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                {l.domain && <span>🌐 {l.domain}</span>}
                {l.ipAddress && <span>📡 {l.ipAddress}</span>}
                <span className={l.status === "failed" ? "text-red-400" : "text-emerald-400"}>{l.status}</span>
                <span>{new Date(l.createdAt).toLocaleString("bn-BD")}</span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>কোনো log নেই</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
