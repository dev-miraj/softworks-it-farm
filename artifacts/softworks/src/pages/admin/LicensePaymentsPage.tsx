import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Plus, Check, RefreshCw, Search } from "lucide-react";

import { API } from "@/lib/apiUrl";

type Payment = {
  id: number; licenseId: number; licenseKey: string; clientEmail: string | null;
  amount: string; currency: string | null; method: string; transactionId: string | null;
  status: string; notes: string | null; createdAt: string;
};

const statusColors: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  refunded: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export function LicensePaymentsPage() {
  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["license-payments"],
    queryFn: async () => { const r = await fetch(`${API}/api/license-payments`); return r.json(); },
  });
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ licenseId: "", licenseKey: "", clientEmail: "", amount: "", currency: "BDT", method: "bKash", transactionId: "", status: "completed", notes: "" });

  const createMut = useMutation({
    mutationFn: async (data: typeof form) => {
      const r = await fetch(`${API}/api/license-payments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, licenseId: +data.licenseId }),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["license-payments"] });
      qc.invalidateQueries({ queryKey: ["license-stats"] });
      toast({ title: "Payment recorded" }); setCreateOpen(false);
    },
  });

  const filtered = (payments ?? []).filter(p => {
    const q = search.toLowerCase();
    return !q || p.licenseKey.toLowerCase().includes(q) || (p.clientEmail || "").toLowerCase().includes(q) || p.method.toLowerCase().includes(q);
  });

  const totalRevenue = (payments ?? []).filter(p => p.status === "completed").reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">License Payments</h1>
              <p className="text-sm text-muted-foreground">মোট আয়: ৳{totalRevenue.toLocaleString()} · {(payments ?? []).length} টি পেমেন্ট</p>
            </div>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white gap-2"><Plus className="w-4 h-4" /> Record Payment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
              <form onSubmit={async (e) => { e.preventDefault(); await createMut.mutateAsync(form); }} className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">License ID *</Label><Input type="number" value={form.licenseId} onChange={e => setForm(p => ({ ...p, licenseId: e.target.value }))} required /></div>
                  <div className="space-y-1"><Label className="text-xs">License Key *</Label><Input value={form.licenseKey} onChange={e => setForm(p => ({ ...p, licenseKey: e.target.value }))} required /></div>
                  <div className="space-y-1"><Label className="text-xs">Amount (৳) *</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required /></div>
                  <div className="space-y-1"><Label className="text-xs">Method</Label><Input value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-xs">Transaction ID</Label><Input value={form.transactionId} onChange={e => setForm(p => ({ ...p, transactionId: e.target.value }))} /></div>
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white gap-2" disabled={createMut.isPending}>
                  {createMut.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Record
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="License key, email, বা method…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="text-left p-3 text-muted-foreground font-medium">License Key</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Client</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Method</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Transaction</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/10">
                    <td className="p-3 font-mono text-xs">{p.licenseKey.slice(0, 20)}…</td>
                    <td className="p-3 text-xs">{p.clientEmail || "—"}</td>
                    <td className="p-3 font-bold text-foreground">৳{Number(p.amount).toLocaleString()}</td>
                    <td className="p-3 text-xs">{p.method}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{p.transactionId || "—"}</td>
                    <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[p.status] || ""}`}>{p.status}</span></td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("bn-BD")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground"><DollarSign className="w-8 h-8 mx-auto mb-2 opacity-20" /><p>কোনো পেমেন্ট নেই</p></div>}
        </div>
      </div>
    </AdminLayout>
  );
}
