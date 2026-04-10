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
  Globe,
  RefreshCw,
  Search,
  Check,
  Landmark,
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
  mfs:           { label: "MFS / মোবাইল ব্যাংকিং", icon: <Smartphone className="w-4 h-4" />,  color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
  bank:          { label: "ব্যাংক ট্রান্সফার",       icon: <Building2 className="w-4 h-4" />,   color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  gateway:       { label: "পেমেন্ট গেটওয়ে",         icon: <Globe className="w-4 h-4" />,        color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  card:          { label: "কার্ড পেমেন্ট",           icon: <CreditCard className="w-4 h-4" />,   color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  international: { label: "আন্তর্জাতিক",             icon: <Landmark className="w-4 h-4" />,     color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
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
  const { data: methods } = usePaymentMethods();
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
  const [reseeding, setReseeding] = useState(false);

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
      toast({ title: d.message, description: `${d.count} টি payment method লোড হয়েছে` });
    } finally {
      setSeeding(false);
    }
  };

  const handleReseed = async () => {
    setReseeding(true);
    try {
      const r = await fetch(`${API}/api/payment-methods/reseed`, { method: "POST" });
      const d = await r.json();
      qc.invalidateQueries({ queryKey: ["payment-methods"] });
      toast({ title: "✅ " + d.message, description: `${d.count} টি Bangladesh payment method যোগ হয়েছে` });
    } finally {
      setReseeding(false);
    }
  };

  const filtered = (methods ?? []).filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || (m.accountNumber ?? "").includes(q);
    const matchCat = catFilter === "__all__" || m.category === catFilter;
    return matchSearch && matchCat;
  });

  const categories = ["mfs", "bank", "gateway", "card", "international"] as const;
  const grouped = Object.fromEntries(
    categories.map((cat) => [cat, filtered.filter((m) => m.category === cat)])
  ) as Record<string, PaymentMethod[]>;

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
    gateway: methods?.filter(m => m.category === "gateway").length ?? 0,
    card: methods?.filter(m => m.category === "card").length ?? 0,
    international: methods?.filter(m => m.category === "international").length ?? 0,
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
            <p className="text-sm text-muted-foreground">
              Bangladesh-এর সকল payment method — MFS, ব্যাংক, গেটওয়ে, কার্ড, আন্তর্জাতিক
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.total === 0 && (
              <Button variant="outline" className="gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10" onClick={handleSeed} disabled={seeding}>
                {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                BD Methods লোড করুন
              </Button>
            )}
            <Button variant="outline" className="gap-2 border-rose-500/30 text-rose-400 hover:bg-rose-500/10" onClick={handleReseed} disabled={reseeding}>
              {reseeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              সব Reseed করুন
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                  <Plus className="w-4 h-4" /> নতুন যোগ করুন
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>নতুন Payment Method</DialogTitle>
                </DialogHeader>
                <MethodForm form={form} setForm={setForm} onSubmit={async (e) => { e.preventDefault(); await createMut.mutateAsync(form); }} loading={createMut.isPending} submitLabel="যোগ করুন" />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
          {[
            { label: "মোট", value: stats.total, color: "text-foreground" },
            { label: "সক্রিয়", value: stats.active, color: "text-emerald-400" },
            { label: "MFS", value: stats.mfs, color: "text-pink-400" },
            { label: "ব্যাংক", value: stats.bank, color: "text-blue-400" },
            { label: "গেটওয়ে", value: stats.gateway, color: "text-cyan-400" },
            { label: "কার্ড", value: stats.card, color: "text-violet-400" },
            { label: "আন্তর্জাতিক", value: stats.international, color: "text-amber-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className={`text-xl font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="নাম বা নম্বর দিয়ে খুঁজুন…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">সব ক্যাটাগরি</SelectItem>
              <SelectItem value="mfs">MFS (মোবাইল ব্যাংকিং)</SelectItem>
              <SelectItem value="bank">ব্যাংক ট্রান্সফার</SelectItem>
              <SelectItem value="gateway">পেমেন্ট গেটওয়ে</SelectItem>
              <SelectItem value="card">কার্ড পেমেন্ট</SelectItem>
              <SelectItem value="international">আন্তর্জাতিক</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Groups */}
        {categories.map((cat) => {
          const items = grouped[cat] ?? [];
          if (items.length === 0) return null;
          const cfg = categoryConfig[cat];
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.color}`}>
                  {cfg.icon}
                  {cfg.label}
                </div>
                <span className="text-xs text-muted-foreground">{items.length} টি method</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
                        {m.accountName && <div><span className="text-muted-foreground">নাম: </span><span className="text-foreground font-medium">{m.accountName}</span></div>}
                        {m.accountNumber && <div><span className="text-muted-foreground">নম্বর: </span><span className="font-mono text-foreground font-medium">{m.accountNumber}</span></div>}
                        {m.bankName && <div><span className="text-muted-foreground">ব্যাংক: </span><span className="text-foreground">{m.bankName}</span></div>}
                        {m.branchName && <div><span className="text-muted-foreground">শাখা: </span><span className="text-foreground">{m.branchName}</span></div>}
                      </div>
                    )}
                    {m.instructions && <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">{m.instructions}</p>}
                    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleMut.mutate(m.id)} title={m.isActive ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}>
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
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">
              {methods?.length === 0
                ? '"BD Methods লোড করুন" বা "Reseed করুন" বাটনে ক্লিক করুন।'
                : "কোনো method পাওয়া যায়নি।"}
            </p>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Payment Method সম্পাদনা</DialogTitle>
            </DialogHeader>
            <MethodForm form={editForm} setForm={setEditForm} onSubmit={async (e) => { e.preventDefault(); if (editTarget) await updateMut.mutateAsync({ id: editTarget.id, data: editForm }); }} loading={updateMut.isPending} submitLabel="সংরক্ষণ করুন" />
          </DialogContent>
        </Dialog>

        {/* Delete */}
        <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Payment Method মুছবেন?</AlertDialogTitle>
              <AlertDialogDescription>এই method টি মুছে ফেলা হবে। আগের license assignment বজায় থাকবে।</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>বাতিল</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteId && deleteMut.mutate(deleteId)}>মুছুন</AlertDialogAction>
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
          <Label>Method নাম <span className="text-red-400">*</span></Label>
          <div className="flex items-center gap-3">
            <div className="shrink-0 rounded-xl overflow-hidden shadow">
              <PaymentMethodLogo name={form.name || "?"} category={form.category} size={44} />
            </div>
            <Input placeholder="e.g., bKash Personal" value={form.name} onChange={e => f("name", e.target.value)} required className="flex-1" />
          </div>
          <p className="text-xs text-muted-foreground">নাম টাইপ করলে Logo স্বয়ংক্রিয়ভাবে সেট হবে</p>
        </div>
        <div className="space-y-1.5">
          <Label>ক্যাটাগরি <span className="text-red-400">*</span></Label>
          <Select value={form.category} onValueChange={v => f("category", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mfs">MFS (মোবাইল ব্যাংকিং)</SelectItem>
              <SelectItem value="bank">ব্যাংক ট্রান্সফার</SelectItem>
              <SelectItem value="gateway">পেমেন্ট গেটওয়ে</SelectItem>
              <SelectItem value="card">কার্ড পেমেন্ট</SelectItem>
              <SelectItem value="international">আন্তর্জাতিক</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Input placeholder="e.g., Send Money, Bank Transfer" value={form.type} onChange={e => f("type", e.target.value)} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">একাউন্ট তথ্য</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">একাউন্ট নাম</Label>
            <Input placeholder="একাউন্ট হোল্ডারের নাম" value={form.accountName} onChange={e => f("accountName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">একাউন্ট / মোবাইল নম্বর</Label>
            <Input placeholder="01XXXXXXXXX" value={form.accountNumber} onChange={e => f("accountNumber", e.target.value)} />
          </div>
          {form.category === "bank" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">ব্যাংকের নাম</Label>
                <Input placeholder="ব্যাংকের নাম" value={form.bankName} onChange={e => f("bankName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">শাখার নাম</Label>
                <Input placeholder="শাখার নাম" value={form.branchName} onChange={e => f("branchName", e.target.value)} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">Routing নম্বর</Label>
                <Input placeholder="Routing number" value={form.routingNumber} onChange={e => f("routingNumber", e.target.value)} />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>পেমেন্ট নির্দেশনা</Label>
        <Textarea placeholder="ক্লায়েন্টকে payment করার নির্দেশনা…" value={form.instructions} onChange={e => f("instructions", e.target.value)} rows={3} />
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
