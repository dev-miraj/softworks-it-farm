import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListNewsletter, useDeleteNewsletterSubscriber } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, Download, Mail, Users, CheckCircle } from "lucide-react";

export function NewsletterPage() {
  const { data: subscribers, queryKey } = useListNewsletter();
  const deleteSubscriber = useDeleteNewsletterSubscriber();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = useMemo(() => {
    if (!subscribers) return [];
    const q = search.toLowerCase();
    return subscribers.filter(s => {
      const ms = !search || s.email.toLowerCase().includes(q) || (s.name ?? "").toLowerCase().includes(q);
      const mst = filterStatus === "all" || (filterStatus === "active" ? s.isActive : !s.isActive);
      return ms && mst;
    });
  }, [subscribers, search, filterStatus]);

  const handleDelete = async (id: number, email: string) => {
    if (!confirm(`Remove subscriber "${email}"?`)) return;
    await deleteSubscriber.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey });
  };

  const exportCSV = () => {
    const rows = [["Email", "Name", "Status", "Source", "Subscribed At"]];
    (subscribers ?? []).forEach(s => rows.push([s.email, s.name ?? "", s.isActive ? "Active" : "Inactive", s.source, s.createdAt]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: "newsletter-subscribers.csv" });
    a.click();
  };

  const activeCount = (subscribers ?? []).filter(s => s.isActive).length;
  const sources = [...new Set((subscribers ?? []).map(s => s.source))];

  return (
    <AdminLayout>
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">Newsletter</h1>
          <p className="text-muted-foreground text-sm">Email subscribers management ({subscribers?.length ?? 0} total)</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2"><Download className="w-4 h-4" />Export CSV</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Subscribers", val: subscribers?.length ?? 0, icon: Users, color: "text-primary" },
          { label: "Active", val: activeCount, icon: CheckCircle, color: "text-green-400" },
          { label: "Unsubscribed", val: (subscribers?.length ?? 0) - activeCount, icon: Mail, color: "text-muted-foreground" },
          { label: "Sources", val: sources.length, icon: Mail, color: "text-blue-400" },
        ].map(s => (
          <div key={s.label} className="gradient-border rounded-xl p-4">
            <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sources breakdown */}
      {sources.length > 0 && (
        <div className="gradient-border rounded-xl p-4 mb-5">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Subscription Sources</h3>
          <div className="flex flex-wrap gap-2">
            {sources.map(src => (
              <Badge key={src} variant="outline" className="capitalize">
                {src}: {(subscribers ?? []).filter(s => s.source === src).length}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search subscribers..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {["all", "active", "inactive"].map(s => (
          <Badge key={s} variant="outline" className={`capitalize text-xs cursor-pointer ${filterStatus === s ? "bg-primary/10 text-primary border-primary/30" : ""}`} onClick={() => setFilterStatus(s)}>
            {s === "all" ? `All (${subscribers?.length ?? 0})` : s === "active" ? `Active (${activeCount})` : `Inactive (${(subscribers?.length ?? 0) - activeCount})`}
          </Badge>
        ))}
      </div>

      {/* Table */}
      <div className="gradient-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/50 bg-muted/20">
              <tr>
                {["Email", "Name", "Source", "Status", "Subscribed", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map(sub => (
                <tr key={sub.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {sub.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{sub.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{sub.name || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs capitalize">{sub.source}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-xs ${sub.isActive ? "text-green-400 border-green-400/20 bg-green-500/10" : "text-muted-foreground"}`}>
                      {sub.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(sub.id, sub.email)} className="p-1.5 rounded text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              {search || filterStatus !== "all" ? "No subscribers match your filters." : "No subscribers yet."}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
