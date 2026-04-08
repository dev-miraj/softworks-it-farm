import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PaymentMethodLogo } from "@/components/ui/PaymentMethodLogo";
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Smartphone,
  Building2,
  RefreshCw,
  Search,
  Check,
  X,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "";

type PaymentMethod = {
  id: number;
  name: string;
  type: string;
  category: string;
  accountName: string | null;
  accountNumber: string | null;
  bankName: string | null;
  branchName: string | null;
  routingNumber: string | null;
  instructions: string | null;
  emoji: string | null;
  isActive: boolean;
  createdAt: string;
};

const blank = {
  name: "",
  type: "Send Money",
  category: "mfs",
  accountName: "",
  accountNumber: "",
  bankName: "",
  branchName: "",
  routingNumber: "",
  instructions: "",
  emoji: "💳",
  isActive: true,
};

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  mfs:  { label: "MFS",  icon: <Smartphone className="w-4 h-4" />, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  bank: { label: "Bank", icon: <Building2 className="w-4 h-4" />,  color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  card: { label: "Card", icon: <CreditCard className="w-4 h-4" />, color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
};

function usePaymentMethods() {
  return useQuery<PaymentMethod[]>({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const r = await fetch(`${API}/api/payment-methods`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });
}

export function PaymentMethodsPage() {
  const { data: methods, isLoading } = usePaymentMethods();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [editForm, setEditForm] = useState({ ...blank });
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("__all__");
  const [seeding, setSeeding] = useState(false);

  const onSuccess = (msg: string) => {
    qc.invalidateQueries({ queryKey: ["payment-methods"] });
    toast({ title: msg });
  };

  const createMut = useMutation({
    mutationFn: async (data: typeof blank) => {
      const r = await fetch(`${API}/api/payment-methods`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => { onSuccess("Payment method added"); setCreateOpen(false); setForm({ ...blank }); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof blank }) => {
      const r = await fetch(`${API}/api/payment-methods/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => { onSuccess("Method updated"); setEditOpen(false); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API}/api/payment-methods/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(await r.text());
    },
    onSuccess: () => { onSuccess("Method deleted"); setDeleteId(null); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const toggleMut = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API}/api/payment-methods/${id}/toggle`, { method: "POST" });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-methods"] }),
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const r = await fetch(`${API}/api/payment-methods/seed`);
      const d = await r.json();
      qc.invalidateQueries({ queryKey: ["payment-methods"] });
      toast({ title: d.message, description: `${d.count} methods loaded` });
    } finally {
      setSeeding(false);
    }
  };

  const filtered = (methods ?? []).filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || (m.accountNumber ?? "").toLowerCase().includes(q);
    const matchCat = catFilter === "__all__" || m.category === catFilter;
    return matchSearch && matchCat;
  });

  const grouped = {
    mfs: filtered.filter(m => m.category === "mfs"),
    bank: filtered.filter(m => m.category === "bank"),
    card: filtered.filter(m => m.category === "card"),
  };

  const openEdit = (m: PaymentMethod) => {
    setEditTarget(m);
    setEditForm({
      name: m.name, type: m.type, category: m.category,
      accountName: m.accountName ?? "", accountNumber: m.accountNumber ?? "",
      bankName: m.bankName ?? "", branchName: m.branchName ?? "",
      routingNumber: m.routingNumber ?? "", instructions: m.instructions ?? "",
      emoji: m.emoji ?? "💳", isActive: m.isActive,
    });
    setEditOpen(true);
  };

  const stats = {
    total: methods?.length ?? 0,
    active: methods?.filter(m => m.isActive).length ?? 0,
    mfs: methods?.filter(m => m.category === "mfs").length ?? 0,
    bank: methods?.filter(m => m.category === "bank").length ?? 0,
    card: methods?.filter(m => m.category === "card").length ?? 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <CreditCard className="w-4 h-4 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Payment Methods</h1>
            </div>
            <p className="text-sm text-muted-foreground">Manage all Bangladesh payment methods — MFS, Bank, Card</p>
          </div>
          <div className="flex gap-2">
            {stats.total === 0 && (
              <Button variant="outline" className="gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10" onClick={handleSeed} disabled={seeding}>
                {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Load BD Methods
              </Button>
            )}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                  <Plus className="w-4 h-4" /> Add Method
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Payment Method</DialogTitle>
                </DialogHeader>
                <MethodForm form={form} setForm={setForm} onSubmit={async (e) => { e.preventDefault(); await createMut.mutateAsync(form); }} loading={createMut.isPending} submitLabel="Add Method" />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Active", value: stats.active, color: "text-emerald-400" },
            { label: "MFS", value: stats.mfs, color: "text-emerald-400" },
            { label: "Banks", value: stats.bank, color: "text-blue-400" },
            { label: "Cards", value: stats.card, color: "text-violet-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className={`text-2xl font-bold ${color}`}>{isLoading ? <Skeleton className="h-7 w-6" /> : value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search methods…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Categories</SelectItem>
              <SelectItem value="mfs">MFS (Mobile)</SelectItem>
              <SelectItem value="bank">Banks</SelectItem>
              <SelectItem value="card">Cards</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Groups */}
        {isLoading
          ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          : (Object.entries(grouped) as [string, PaymentMethod[]][]).map(([cat, items]) => (
            items.length > 0 && (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${categoryConfig[cat]?.color}`}>
                    {categoryConfig[cat]?.icon}
                    {categoryConfig[cat]?.label}
                  </div>
                  <span className="text-xs text-muted-foreground">{items.length} methods</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((m) => (
                    <div key={m.id} className={`rounded-xl border p-4 bg-card transition-all hover:border-border/80 ${!m.isActive ? "opacity-50" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="shrink-0 rounded-xl overflow-hidden shadow-md">
                            <PaymentMethodLogo name={m.name} category={m.category} size={40} />
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-foreground leading-tight">{m.name}</div>
                            <div className="text-xs text-muted-foreground">{m.type}</div>
                          </div>
                        </div>
                        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${m.isActive ? "bg-emerald-400" : "bg-muted-foreground/30"}`} />
                      </div>
                      {(m.accountNumber || m.accountName) && (
                        <div className="mt-3 rounded-lg bg-muted/30 p-2 text-xs space-y-0.5">
                          {m.accountName && <div><span className="text-muted-foreground">Name: </span><span className="text-foreground font-medium">{m.accountName}</span></div>}
                          {m.accountNumber && <div><span className="text-muted-foreground">Number: </span><span className="font-mono text-foreground font-medium">{m.accountNumber}</span></div>}
                          {m.bankName && <div><span className="text-muted-foreground">Bank: </span><span className="text-foreground">{m.bankName}</span></div>}
                          {m.branchName && <div><span className="text-muted-foreground">Branch: </span><span className="text-foreground">{m.branchName}</span></div>}
                        </div>
                      )}
                      {m.instructions && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{m.instructions}</p>}
                      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleMut.mutate(m.id)} title={m.isActive ? "Disable" : "Enable"}>
                          {m.isActive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-400 hover:bg-blue-500/10" onClick={() => openEdit(m)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-500/10" onClick={() => setDeleteId(m.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))
        }

        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-16 text-muted-foreground">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>{methods?.length === 0 ? 'No payment methods yet. Click "Load BD Methods" to pre-load all Bangladesh methods.' : "No methods match your search."}</p>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Payment Method</DialogTitle>
            </DialogHeader>
            <MethodForm form={editForm} setForm={setEditForm} onSubmit={async (e) => { e.preventDefault(); if (editTarget) await updateMut.mutateAsync({ id: editTarget.id, data: editForm }); }} loading={updateMut.isPending} submitLabel="Save Changes" />
          </DialogContent>
        </Dialog>

        {/* Delete */}
        <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Payment Method?</AlertDialogTitle>
              <AlertDialogDescription>This method will be removed. Licenses using it will keep their assignment.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteId && deleteMut.mutate(deleteId)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

function MethodForm({ form, setForm, onSubmit, loading, submitLabel }: any) {
  const f = (key: string, val: any) => setForm((p: any) => ({ ...p, [key]: val }));

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Method Name <span className="text-red-400">*</span></Label>
          <div className="flex items-center gap-3">
            <div className="shrink-0 rounded-xl overflow-hidden shadow">
              <PaymentMethodLogo name={form.name || "?"} category={form.category} size={44} />
            </div>
            <Input placeholder="e.g., bKash Personal" value={form.name} onChange={e => f("name", e.target.value)} required className="flex-1" />
          </div>
          <p className="text-xs text-muted-foreground">Logo auto-detects from the name as you type</p>
        </div>
        <div className="space-y-1.5">
          <Label>Category <span className="text-red-400">*</span></Label>
          <Select value={form.category} onValueChange={v => f("category", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mfs">MFS (Mobile Banking)</SelectItem>
              <SelectItem value="bank">Bank Transfer</SelectItem>
              <SelectItem value="card">Card Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Input placeholder="e.g., Send Money, Bank Transfer" value={form.type} onChange={e => f("type", e.target.value)} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Account Details</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Account Name</Label>
            <Input placeholder="Account holder name" value={form.accountName} onChange={e => f("accountName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Account Number / Mobile</Label>
            <Input placeholder="01XXXXXXXXX" value={form.accountNumber} onChange={e => f("accountNumber", e.target.value)} />
          </div>
          {form.category === "bank" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Bank Name</Label>
                <Input placeholder="Bank name" value={form.bankName} onChange={e => f("bankName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Branch Name</Label>
                <Input placeholder="Branch" value={form.branchName} onChange={e => f("branchName", e.target.value)} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">Routing Number</Label>
                <Input placeholder="Routing number" value={form.routingNumber} onChange={e => f("routingNumber", e.target.value)} />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Payment Instructions</Label>
        <Textarea placeholder="Instructions for the client to make payment…" value={form.instructions} onChange={e => f("instructions", e.target.value)} rows={3} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" disabled={loading}>
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
