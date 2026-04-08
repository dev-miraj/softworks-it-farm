import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { PaymentMethodLogo } from "@/components/ui/PaymentMethodLogo";
import {
  KeyRound, Plus, Search, Copy, Check, ShieldCheck, ShieldOff, Ban, Pencil, Trash2,
  Globe, Server, Cpu, Calendar, RefreshCw, Activity, AlertTriangle, CheckCircle2,
  Clock, XCircle, Filter, DollarSign, CreditCard, CircleDollarSign, BadgeAlert,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "";

type License = {
  id: number; licenseKey: string; productName: string; clientName: string; clientEmail: string;
  domain: string | null; ipAddress: string | null; hardwareId: string | null;
  expiryDate: string | null; status: string; licenseType: string; maxDomains: number;
  notes: string | null; activatedAt: string | null; lastValidated: string | null;
  isBlacklisted: boolean;
  feeAmount: string | null; billingCycle: string | null; paymentStatus: string;
  paymentMethodId: number | null; paymentMethodName: string | null;
  nextPaymentDue: string | null; lastPaymentDate: string | null;
  gracePeriodEnd: string | null; autoBlockEnabled: boolean;
  createdAt: string;
};

type PaymentMethod = { id: number; name: string; category: string; emoji: string | null; accountNumber: string | null; isActive: boolean; };

const blankForm = {
  licenseKey: "", productName: "", clientName: "", clientEmail: "",
  domain: "", ipAddress: "", hardwareId: "", expiryDate: "",
  status: "active", licenseType: "lifetime", maxDomains: 1, notes: "",
  feeAmount: "0", billingCycle: "lifetime",
  paymentStatus: "free", paymentMethodId: "", paymentMethodName: "",
  nextPaymentDue: "", autoBlockEnabled: true,
};

const statusConfig: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  active:    { label: "Active",    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: <CheckCircle2 className="w-3 h-3" /> },
  trial:     { label: "Trial",     cls: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",          icon: <Clock className="w-3 h-3" /> },
  expired:   { label: "Expired",   cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",       icon: <AlertTriangle className="w-3 h-3" /> },
  suspended: { label: "Suspended", cls: "bg-red-500/10 text-red-400 border-red-500/20",             icon: <ShieldOff className="w-3 h-3" /> },
};

const payStatusConfig: Record<string, { label: string; cls: string }> = {
  free:    { label: "Free",    cls: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  paid:    { label: "Paid",    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  pending: { label: "Pending", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  overdue: { label: "Overdue", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const typeColors: Record<string, string> = {
  trial: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  monthly: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  yearly: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  lifetime: "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20",
};

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }}
      className="ml-1 p-0.5 text-muted-foreground hover:text-primary transition-colors">
      {ok ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function useLicenses() {
  return useQuery<License[]>({ queryKey: ["licenses"], queryFn: async () => { const r = await fetch(`${API}/api/licenses`); if (!r.ok) throw new Error(); return r.json(); } });
}
function usePaymentMethods() {
  return useQuery<PaymentMethod[]>({ queryKey: ["payment-methods"], queryFn: async () => { const r = await fetch(`${API}/api/payment-methods`); if (!r.ok) return []; return r.json(); } });
}

export function LicensesPage() {
  const { data: licenses, isLoading } = useLicenses();
  const { data: payMethods } = usePaymentMethods();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [typeFilter, setTypeFilter] = useState("__all__");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<License | null>(null);
  const [form, setForm] = useState({ ...blankForm });
  const [editForm, setEditForm] = useState({ ...blankForm });

  const ok = (msg: string) => { qc.invalidateQueries({ queryKey: ["licenses"] }); toast({ title: msg }); };
  const err = () => toast({ title: "Error", variant: "destructive" });

  const createMut = useMutation({
    mutationFn: async (data: typeof blankForm) => {
      const pm = payMethods?.find(p => String(p.id) === String(data.paymentMethodId));
      const body = {
        ...data,
        maxDomains: Number(data.maxDomains),
        feeAmount: data.feeAmount || "0",
        paymentMethodId: data.paymentMethodId ? Number(data.paymentMethodId) : null,
        paymentMethodName: pm?.name || data.paymentMethodName || null,
        autoBlockEnabled: Boolean(data.autoBlockEnabled),
      };
      const r = await fetch(`${API}/api/licenses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => { ok("License created"); setCreateOpen(false); setForm({ ...blankForm }); },
    onError: err,
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof blankForm }) => {
      const pm = payMethods?.find(p => String(p.id) === String(data.paymentMethodId));
      const body = {
        ...data,
        maxDomains: Number(data.maxDomains),
        feeAmount: data.feeAmount || "0",
        paymentMethodId: data.paymentMethodId ? Number(data.paymentMethodId) : null,
        paymentMethodName: pm?.name || data.paymentMethodName || null,
        autoBlockEnabled: Boolean(data.autoBlockEnabled),
      };
      const r = await fetch(`${API}/api/licenses/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => { ok("License updated"); setEditOpen(false); },
    onError: err,
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => { const r = await fetch(`${API}/api/licenses/${id}`, { method: "DELETE" }); if (!r.ok) throw new Error(); },
    onSuccess: () => { ok("Deleted"); setDeleteId(null); },
    onError: err,
  });

  const actionMut = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: string }) => {
      const r = await fetch(`${API}/api/licenses/${id}/${action}`, { method: "POST" });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: (_: any, { action }: any) => {
      qc.invalidateQueries({ queryKey: ["licenses"] });
      const msgs: Record<string, string> = { activate: "Activated", suspend: "Suspended", blacklist: "Blacklisted", "mark-paid": "Marked as Paid ✓", "mark-overdue": "Marked as Overdue — 3-day grace started" };
      toast({ title: msgs[action] || "Done" });
    },
    onError: err,
  });

  const filtered = (licenses ?? []).filter(l => {
    const q = search.toLowerCase();
    const ms = !q || l.licenseKey.toLowerCase().includes(q) || l.clientName.toLowerCase().includes(q) || l.productName.toLowerCase().includes(q) || (l.domain ?? "").toLowerCase().includes(q);
    const mst = statusFilter === "__all__" || l.status === statusFilter;
    const mt = typeFilter === "__all__" || l.licenseType === typeFilter;
    return ms && mst && mt;
  });

  const stats = {
    total: licenses?.length ?? 0,
    active: licenses?.filter(l => l.status === "active").length ?? 0,
    trial: licenses?.filter(l => l.status === "trial").length ?? 0,
    expired: licenses?.filter(l => l.status === "expired").length ?? 0,
    suspended: licenses?.filter(l => l.status === "suspended").length ?? 0,
    overdue: licenses?.filter(l => l.paymentStatus === "overdue").length ?? 0,
  };

  const openEdit = (l: License) => {
    setEditTarget(l);
    setEditForm({
      licenseKey: l.licenseKey, productName: l.productName, clientName: l.clientName,
      clientEmail: l.clientEmail, domain: l.domain ?? "", ipAddress: l.ipAddress ?? "",
      hardwareId: l.hardwareId ?? "", expiryDate: l.expiryDate ?? "",
      status: l.status, licenseType: l.licenseType, maxDomains: l.maxDomains,
      notes: l.notes ?? "", feeAmount: l.feeAmount ?? "0", billingCycle: l.billingCycle ?? "lifetime",
      paymentStatus: l.paymentStatus, paymentMethodId: l.paymentMethodId ? String(l.paymentMethodId) : "",
      paymentMethodName: l.paymentMethodName ?? "", nextPaymentDue: l.nextPaymentDue ?? "",
      autoBlockEnabled: l.autoBlockEnabled,
    });
    setEditOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-violet-400" />
              </div>
              <h1 className="text-2xl font-bold">License Manager</h1>
            </div>
            <p className="text-sm text-muted-foreground">Generate, monitor & control software licenses with auto-payment enforcement</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                <Plus className="w-4 h-4" /> New License
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5 text-violet-400" /> Create New License</DialogTitle>
              </DialogHeader>
              <LicenseForm form={form} setForm={setForm} payMethods={payMethods ?? []} onSubmit={async e => { e.preventDefault(); await createMut.mutateAsync(form); }} loading={createMut.isPending} submitLabel="Generate License" />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total", value: stats.total, icon: KeyRound, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
            { label: "Active", value: stats.active, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
            { label: "Trial", value: stats.trial, icon: Clock, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
            { label: "Expired", value: stats.expired, icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
            { label: "Suspended", value: stats.suspended, icon: ShieldOff, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
            { label: "Overdue Pay", value: stats.overdue, icon: BadgeAlert, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`rounded-xl border p-4 ${bg}`}>
              <div className="flex items-center gap-2 mb-2"><Icon className={`w-4 h-4 ${color}`} /><span className="text-xs text-muted-foreground">{label}</span></div>
              <div className={`text-2xl font-bold ${color}`}>{isLoading ? <Skeleton className="h-7 w-8" /> : value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search key, client, product, domain…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" /><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Types</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="lifetime">Lifetime</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">License Key / Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Binding</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fee & Payment</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {Array.from({ length: 6 }).map((__, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>)}
                    </tr>
                  ))
                  : filtered.length === 0
                    ? <tr><td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                        <KeyRound className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p>{search ? "No matches found" : "No licenses yet. Create your first one!"}</p>
                      </td></tr>
                    : filtered.map(l => {
                      const sc = statusConfig[l.status] ?? statusConfig.suspended;
                      const pc = payStatusConfig[l.paymentStatus] ?? payStatusConfig.free;
                      const isExpired = l.expiryDate && new Date(l.expiryDate) < new Date();
                      const isOverdue = l.paymentStatus === "overdue";
                      const isPending = l.paymentStatus === "pending";
                      const isDueSoon = isPending && l.nextPaymentDue && new Date(l.nextPaymentDue) < new Date(Date.now() + 7 * 864e5);
                      const graceEnd = l.gracePeriodEnd ? new Date(l.gracePeriodEnd) : null;
                      const graceLeft = graceEnd ? Math.ceil((graceEnd.getTime() - Date.now()) / 864e5) : null;

                      return (
                        <tr key={l.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${l.isBlacklisted || l.status === "suspended" ? "opacity-60" : ""} ${isOverdue ? "bg-red-500/3" : ""}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <code className="font-mono text-xs text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20 whitespace-nowrap">{l.licenseKey}</code>
                              <CopyBtn text={l.licenseKey} />
                            </div>
                            <div className="text-xs font-medium text-foreground mt-1">{l.productName}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Badge className={`text-[10px] border capitalize px-1.5 py-0 ${typeColors[l.licenseType] ?? typeColors.lifetime}`}>{l.licenseType}</Badge>
                              {l.isBlacklisted && <Badge className="text-[10px] border bg-rose-500/10 text-rose-400 border-rose-500/20 px-1.5 py-0"><Ban className="w-2.5 h-2.5 inline mr-0.5" />Blacklisted</Badge>}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-medium text-sm text-foreground">{l.clientName}</div>
                            <div className="text-xs text-muted-foreground">{l.clientEmail}</div>
                            {l.expiryDate && (
                              <div className={`flex items-center gap-1 text-xs mt-1 ${isExpired ? "text-red-400" : "text-muted-foreground"}`}>
                                <Calendar className="w-3 h-3" />{new Date(l.expiryDate).toLocaleDateString()}{isExpired && " (Exp)"}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                              {l.domain && <div className="flex items-center gap-1"><Globe className="w-3 h-3 text-cyan-400" />{l.domain}</div>}
                              {l.ipAddress && <div className="flex items-center gap-1"><Server className="w-3 h-3 text-blue-400" />{l.ipAddress}</div>}
                              {l.hardwareId && <div className="flex items-center gap-1"><Cpu className="w-3 h-3 text-fuchsia-400" /><span className="truncate max-w-[100px]">{l.hardwareId}</span></div>}
                              {!l.domain && !l.ipAddress && !l.hardwareId && <span className="text-muted-foreground/40 italic">Unbound</span>}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <CircleDollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-semibold text-foreground text-sm">
                                {l.feeAmount && Number(l.feeAmount) > 0 ? `৳${Number(l.feeAmount).toLocaleString()}` : "Free"}
                              </span>
                              {l.billingCycle && l.billingCycle !== "lifetime" && (
                                <span className="text-xs text-muted-foreground">/{l.billingCycle === "monthly" ? "mo" : "yr"}</span>
                              )}
                            </div>
                            {l.paymentMethodName && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                <div className="rounded overflow-hidden shrink-0">
                                  <PaymentMethodLogo name={l.paymentMethodName} size={16} />
                                </div>
                                {l.paymentMethodName}
                              </div>
                            )}
                            <Badge className={`text-[10px] border mt-1 ${pc.cls}`}>{pc.label}</Badge>
                            {l.nextPaymentDue && (
                              <div className={`text-xs mt-0.5 ${isDueSoon ? "text-amber-400" : "text-muted-foreground"}`}>
                                Due: {new Date(l.nextPaymentDue).toLocaleDateString()}
                              </div>
                            )}
                            {isOverdue && graceLeft !== null && graceLeft > 0 && (
                              <div className="flex items-center gap-1 text-xs text-red-400 mt-0.5 font-medium">
                                <AlertTriangle className="w-3 h-3" />Block in {graceLeft}d
                              </div>
                            )}
                            {l.autoBlockEnabled && <div className="text-[10px] text-muted-foreground/50 mt-0.5">Auto-block ON</div>}
                          </td>

                          <td className="px-4 py-3">
                            <Badge className={`text-xs border flex items-center gap-1 w-fit ${sc.cls}`}>{sc.icon} {sc.label}</Badge>
                            {l.lastValidated && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground/60 mt-1">
                                <Activity className="w-3 h-3" />{new Date(l.lastValidated).toLocaleDateString()}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1">
                                {l.status !== "active" && !l.isBlacklisted && (
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-400 hover:bg-emerald-500/10" title="Activate" onClick={() => actionMut.mutate({ id: l.id, action: "activate" })}>
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                {l.status === "active" && (
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-amber-400 hover:bg-amber-500/10" title="Suspend" onClick={() => actionMut.mutate({ id: l.id, action: "suspend" })}>
                                    <ShieldOff className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                {!l.isBlacklisted && (
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-400 hover:bg-rose-500/10" title="Blacklist" onClick={() => actionMut.mutate({ id: l.id, action: "blacklist" })}>
                                    <Ban className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-400 hover:bg-blue-500/10" title="Edit" onClick={() => openEdit(l)}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-500/10" title="Delete" onClick={() => setDeleteId(l.id)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                              {/* Payment actions */}
                              {l.paymentStatus !== "free" && (
                                <div className="flex items-center gap-1">
                                  {l.paymentStatus !== "paid" && (
                                    <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20" onClick={() => actionMut.mutate({ id: l.id, action: "mark-paid" })}>
                                      <Check className="w-3 h-3 mr-0.5" /> Mark Paid
                                    </Button>
                                  )}
                                  {l.paymentStatus !== "overdue" && l.paymentStatus !== "free" && (
                                    <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-red-400 hover:bg-red-500/10 border border-red-500/20" onClick={() => actionMut.mutate({ id: l.id, action: "mark-overdue" })}>
                                      <AlertTriangle className="w-3 h-3 mr-0.5" /> Overdue
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </div>

        {/* License Validator */}
        <ValidateLicensePanel />

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Pencil className="w-5 h-5 text-blue-400" /> Edit License</DialogTitle>
            </DialogHeader>
            <LicenseForm form={editForm} setForm={setEditForm} payMethods={payMethods ?? []} onSubmit={async e => { e.preventDefault(); if (editTarget) await updateMut.mutateAsync({ id: editTarget.id, data: editForm }); }} loading={updateMut.isPending} submitLabel="Save Changes" isEdit />
          </DialogContent>
        </Dialog>

        {/* Delete */}
        <AlertDialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete License?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently remove the license and revoke access.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={async () => { if (deleteId) await deleteMut.mutateAsync(deleteId); }}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

function LicenseForm({ form, setForm, payMethods, onSubmit, loading, submitLabel, isEdit = false }: {
  form: any; setForm: (f: any) => void; payMethods: PaymentMethod[];
  onSubmit: (e: React.FormEvent) => void; loading: boolean; submitLabel: string; isEdit?: boolean;
}) {
  const f = (key: string, val: any) => setForm((p: any) => ({ ...p, [key]: val }));
  const hasFee = Number(form.feeAmount) > 0;
  const activeMethods = payMethods.filter(p => p.isActive);

  return (
    <form onSubmit={onSubmit} className="space-y-5 mt-2">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Product Name <span className="text-red-400">*</span></Label>
          <Input placeholder="e.g., SOFTWORKS CRM v2" value={form.productName} onChange={e => f("productName", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>License Type <span className="text-red-400">*</span></Label>
          <Select value={form.licenseType} onValueChange={v => f("licenseType", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="trial">Trial (7 days)</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="lifetime">Lifetime</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Client Name <span className="text-red-400">*</span></Label>
          <Input placeholder="Full name" value={form.clientName} onChange={e => f("clientName", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Client Email <span className="text-red-400">*</span></Label>
          <Input type="email" placeholder="client@example.com" value={form.clientEmail} onChange={e => f("clientEmail", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => f("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Expiry Date</Label>
          <Input type="date" value={form.expiryDate} onChange={e => f("expiryDate", e.target.value)} />
          <p className="text-xs text-muted-foreground">Leave blank for lifetime</p>
        </div>
      </div>

      {/* Fee & Payment Section */}
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-4">
        <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wide flex items-center gap-2">
          <CircleDollarSign className="w-4 h-4" /> Fee & Payment Configuration
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">License Fee (BDT ৳)</Label>
            <Input type="number" min="0" placeholder="0" value={form.feeAmount} onChange={e => { f("feeAmount", e.target.value); if (Number(e.target.value) === 0) f("paymentStatus", "free"); else f("paymentStatus", "pending"); }} />
            <p className="text-xs text-muted-foreground">Set 0 for free license</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Billing Cycle</Label>
            <Select value={form.billingCycle} onValueChange={v => f("billingCycle", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lifetime">One-time (Lifetime)</SelectItem>
                <SelectItem value="monthly">Monthly Recurring</SelectItem>
                <SelectItem value="yearly">Yearly Recurring</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasFee && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><CreditCard className="w-3 h-3" /> Payment Method</Label>
              <Select value={form.paymentMethodId ? String(form.paymentMethodId) : "__none__"} onValueChange={v => f("paymentMethodId", v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select payment method…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">-- Select Method --</SelectItem>
                  {["mfs", "bank", "card"].map(cat => {
                    const methods = activeMethods.filter(m => m.category === cat);
                    if (!methods.length) return null;
                    return (
                      <div key={cat}>
                        <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          {cat === "mfs" ? "MFS (Mobile Banking)" : cat === "bank" ? "Banks" : "Cards"}
                        </div>
                        {methods.map(m => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.name}{m.accountNumber ? ` — ${m.accountNumber}` : ""}
                          </SelectItem>
                        ))}
                      </div>
                    );
                  })}
                  {activeMethods.length === 0 && <SelectItem value="__empty__" disabled>No payment methods configured. Add them in Payment Methods settings.</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Payment Status</Label>
                <Select value={form.paymentStatus} onValueChange={v => f("paymentStatus", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Next Payment Due</Label>
                <Input type="date" value={form.nextPaymentDue} onChange={e => f("nextPaymentDue", e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <Switch checked={form.autoBlockEnabled} onCheckedChange={v => f("autoBlockEnabled", v)} />
              <div>
                <div className="text-sm font-medium text-red-400">Auto-Block on Overdue</div>
                <div className="text-xs text-muted-foreground">If enabled, site/domain will be automatically blocked 3 days after payment is overdue</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Security Binding */}
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-violet-400" /> Security Binding
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs"><Globe className="w-3.5 h-3.5 text-cyan-400" /> Allowed Domain</Label>
            <Input placeholder="example.com" value={form.domain} onChange={e => f("domain", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs"><Server className="w-3.5 h-3.5 text-blue-400" /> Allowed IP</Label>
              <Input placeholder="192.168.1.1" value={form.ipAddress} onChange={e => f("ipAddress", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs"><Cpu className="w-3.5 h-3.5 text-fuchsia-400" /> Hardware ID</Label>
              <Input placeholder="hw-xxxxxxxx" value={form.hardwareId} onChange={e => f("hardwareId", e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {isEdit && (
        <div className="space-y-1.5">
          <Label>License Key</Label>
          <Input value={form.licenseKey} onChange={e => f("licenseKey", e.target.value)} className="font-mono" />
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea placeholder="Internal notes…" value={form.notes} onChange={e => f("notes", e.target.value)} rows={2} />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white gap-2" disabled={loading}>
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function ValidateLicensePanel() {
  const [key, setKey] = useState("");
  const [domain, setDomain] = useState("");
  const [ip, setIp] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const validate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch(`${API}/api/validate-license`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ licenseKey: key, domain: domain || undefined, ipAddress: ip || undefined }) });
      setResult(await r.json());
    } finally { setLoading(false); }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-cyan-400" />
        <h2 className="text-base font-semibold">License Validator</h2>
        <span className="text-xs text-muted-foreground ml-1">— Simulate real-time validation check</span>
      </div>
      <form onSubmit={validate} className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="License key…" value={key} onChange={e => setKey(e.target.value)} className="font-mono flex-1" required />
        <Input placeholder="Domain (optional)" value={domain} onChange={e => setDomain(e.target.value)} className="w-44" />
        <Input placeholder="IP (optional)" value={ip} onChange={e => setIp(e.target.value)} className="w-36" />
        <Button type="submit" variant="outline" className="gap-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10" disabled={loading}>
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Validate
        </Button>
      </form>

      {result && (
        <div className="mt-4 space-y-2">
          <div className={`rounded-lg border p-4 flex items-start gap-3 ${result.valid ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}>
            {result.valid ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
            <div>
              <div className={`font-semibold ${result.valid ? "text-emerald-400" : "text-red-400"}`}>{result.valid ? "✓ License VALID" : "✗ License INVALID"}</div>
              {result.reason && <div className="text-sm text-muted-foreground mt-1">{result.reason}</div>}
              {result.license && (
                <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                  <div><span className="text-foreground font-medium">Product:</span> {result.license.productName}</div>
                  <div><span className="text-foreground font-medium">Client:</span> {result.license.clientName}</div>
                  <div><span className="text-foreground font-medium">Type:</span> {result.license.licenseType}</div>
                  {result.license.feeAmount > 0 && <div><span className="text-foreground font-medium">Fee:</span> ৳{Number(result.license.feeAmount).toLocaleString()} / {result.license.billingCycle}</div>}
                  {result.license.nextPaymentDue && <div><span className="text-foreground font-medium">Next Payment:</span> {new Date(result.license.nextPaymentDue).toLocaleDateString()}</div>}
                </div>
              )}
            </div>
          </div>

          {result.paymentWarning && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-amber-400">Payment Warning</div>
                <div className="text-xs text-muted-foreground mt-0.5">{result.warningMessage}</div>
                {result.daysUntilBlock !== undefined && (
                  <div className="mt-1 text-xs font-medium text-amber-400">🔴 Auto-block in {result.daysUntilBlock} day(s)</div>
                )}
                {result.paymentMethod && <div className="text-xs text-muted-foreground mt-0.5">Pay via: <span className="text-foreground font-medium">{result.paymentMethod}</span></div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
