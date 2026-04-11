import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Activity, Globe, Monitor, Wifi, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "";

type Activation = {
  id: number; licenseId: number; licenseKey: string; domain: string | null;
  ipAddress: string | null; hardwareId: string | null; userAgent: string | null;
  fingerprint: string | null; country: string | null; city: string | null;
  isActive: boolean; deactivatedAt: string | null; lastSeen: string; createdAt: string;
};

export function LicenseActivationsPage() {
  const { data: activations } = useQuery<Activation[]>({
    queryKey: ["license-activations"],
    queryFn: async () => { const r = await fetch(`${API}/api/license-activations`); return r.json(); },
  });
  const [search, setSearch] = useState("");

  const filtered = (activations ?? []).filter(a => {
    const q = search.toLowerCase();
    return !q || a.licenseKey.toLowerCase().includes(q) || (a.domain || "").toLowerCase().includes(q) || (a.ipAddress || "").includes(q);
  });

  const activeCount = (activations ?? []).filter(a => a.isActive).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">License Activations</h1>
            <p className="text-sm text-muted-foreground">
              {activeCount} সক্রিয় / {(activations ?? []).length} মোট activation
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Input placeholder="License key, domain, বা IP দিয়ে খুঁজুন…" value={search} onChange={e => setSearch(e.target.value)} className="pl-3" />
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="text-left p-3 text-muted-foreground font-medium">License Key</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Domain</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">IP Address</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Hardware</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Last Seen</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Activated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/10">
                    <td className="p-3 font-mono text-xs text-foreground">{a.licenseKey.slice(0, 22)}…</td>
                    <td className="p-3">
                      {a.domain ? (
                        <span className="flex items-center gap-1 text-xs"><Globe className="w-3 h-3 text-blue-400" />{a.domain}</span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="p-3">
                      {a.ipAddress ? (
                        <span className="flex items-center gap-1 text-xs"><Wifi className="w-3 h-3 text-green-400" />{a.ipAddress}</span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="p-3">
                      {a.hardwareId ? (
                        <span className="flex items-center gap-1 text-xs font-mono"><Monitor className="w-3 h-3 text-amber-400" />{a.hardwareId.slice(0, 12)}…</span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${a.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                        {a.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground"><Clock className="w-3 h-3 inline mr-1" />{new Date(a.lastSeen).toLocaleDateString("bn-BD")}</td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString("bn-BD")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p>কোনো activation নেই</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
