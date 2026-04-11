import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Pencil, Trash2, Check, RefreshCw, Search } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "";

type Product = {
  id: number; name: string; slug: string; description: string | null; category: string;
  version: string | null; pricingMonthly: string | null; pricingYearly: string | null;
  pricingLifetime: string | null; trialDays: number | null; maxDomains: number | null;
  maxActivations: number | null; features: string[] | null; isActive: boolean; createdAt: string;
};

const blank = {
  name: "", slug: "", description: "", category: "web", version: "1.0.0",
  pricingMonthly: "0", pricingYearly: "0", pricingLifetime: "0",
  trialDays: 7, maxDomains: 1, maxActivations: 3, features: [] as string[], isActive: true,
};

function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["license-products"],
    queryFn: async () => { const r = await fetch(`${API}/api/license-products`); return r.json(); },
  });
}

export function LicenseProductsPage() {
  const { data: products } = useProducts();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [editForm, setEditForm] = useState({ ...blank });
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [editFeatureInput, setEditFeatureInput] = useState("");

  const createMut = useMutation({
    mutationFn: async (data: typeof blank) => {
      const r = await fetch(`${API}/api/license-products`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["license-products"] }); toast({ title: "Product created" }); setCreateOpen(false); setForm({ ...blank }); },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof blank }) => {
      const r = await fetch(`${API}/api/license-products/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["license-products"] }); toast({ title: "Product updated" }); setEditOpen(false); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => { await fetch(`${API}/api/license-products/${id}`, { method: "DELETE" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["license-products"] }); toast({ title: "Product deleted" }); setDeleteId(null); },
  });

  const filtered = (products ?? []).filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setEditForm({
      name: p.name, slug: p.slug, description: p.description || "", category: p.category,
      version: p.version || "1.0.0", pricingMonthly: p.pricingMonthly || "0",
      pricingYearly: p.pricingYearly || "0", pricingLifetime: p.pricingLifetime || "0",
      trialDays: p.trialDays ?? 7, maxDomains: p.maxDomains ?? 1,
      maxActivations: p.maxActivations ?? 3, features: p.features || [], isActive: p.isActive,
    });
    setEditOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
              <Package className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">License Products</h1>
              <p className="text-sm text-muted-foreground">Software products available for licensing</p>
            </div>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2"><Plus className="w-4 h-4" /> Add Product</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>New Product</DialogTitle></DialogHeader>
              <ProductForm form={form} setForm={setForm} featureInput={featureInput} setFeatureInput={setFeatureInput}
                onSubmit={async (e) => { e.preventDefault(); await createMut.mutateAsync(form); }} loading={createMut.isPending} label="Create" />
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className={`rounded-xl border bg-card p-5 space-y-3 ${!p.isActive ? "opacity-50" : ""}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-foreground">{p.name}</h3>
                  <span className="text-xs font-mono text-muted-foreground">{p.slug}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">{p.category}</span>
              </div>
              {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/20 p-2"><div className="text-xs text-muted-foreground">Monthly</div><div className="text-sm font-bold text-foreground">৳{p.pricingMonthly}</div></div>
                <div className="rounded-lg bg-muted/20 p-2"><div className="text-xs text-muted-foreground">Yearly</div><div className="text-sm font-bold text-foreground">৳{p.pricingYearly}</div></div>
                <div className="rounded-lg bg-muted/20 p-2"><div className="text-xs text-muted-foreground">Lifetime</div><div className="text-sm font-bold text-foreground">৳{p.pricingLifetime}</div></div>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Trial: {p.trialDays}d</span>
                <span>Domains: {p.maxDomains}</span>
                <span>Activations: {p.maxActivations}</span>
              </div>
              {p.features && p.features.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.features.map((f, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground">{f}</span>)}
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t border-border/50">
                <Button size="sm" variant="outline" className="gap-1 text-blue-400 border-blue-500/20" onClick={() => openEdit(p)}><Pencil className="w-3 h-3" /> Edit</Button>
                <Button size="sm" variant="outline" className="gap-1 text-red-400 border-red-500/20" onClick={() => setDeleteId(p.id)}><Trash2 className="w-3 h-3" /> Delete</Button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && <div className="text-center py-16 text-muted-foreground"><Package className="w-10 h-10 mx-auto mb-3 opacity-20" /><p>No products yet</p></div>}

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
            <ProductForm form={editForm} setForm={setEditForm} featureInput={editFeatureInput} setFeatureInput={setEditFeatureInput}
              onSubmit={async (e) => { e.preventDefault(); if (editId) await updateMut.mutateAsync({ id: editId, data: editForm }); }} loading={updateMut.isPending} label="Save" />
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete Product?</AlertDialogTitle><AlertDialogDescription>This product will be permanently deleted.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteId && deleteMut.mutate(deleteId)}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

function ProductForm({ form, setForm, featureInput, setFeatureInput, onSubmit, loading, label }: any) {
  const f = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const addFeature = () => { if (featureInput.trim()) { f("features", [...form.features, featureInput.trim()]); setFeatureInput(""); } };

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={e => { f("name", e.target.value); f("slug", e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")); }} required /></div>
        <div className="space-y-1.5"><Label>Slug</Label><Input value={form.slug} onChange={e => f("slug", e.target.value)} className="font-mono text-sm" /></div>
        <div className="space-y-1.5 col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={e => f("description", e.target.value)} rows={2} /></div>
        <div className="space-y-1.5"><Label>Category</Label><Input value={form.category} onChange={e => f("category", e.target.value)} placeholder="web, desktop, mobile" /></div>
        <div className="space-y-1.5"><Label>Version</Label><Input value={form.version} onChange={e => f("version", e.target.value)} /></div>
      </div>
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <div className="text-xs font-semibold text-muted-foreground uppercase">Pricing (৳ BDT)</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1"><Label className="text-xs">Monthly</Label><Input type="number" value={form.pricingMonthly} onChange={e => f("pricingMonthly", e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Yearly</Label><Input type="number" value={form.pricingYearly} onChange={e => f("pricingYearly", e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Lifetime</Label><Input type="number" value={form.pricingLifetime} onChange={e => f("pricingLifetime", e.target.value)} /></div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1"><Label className="text-xs">Trial Days</Label><Input type="number" value={form.trialDays} onChange={e => f("trialDays", +e.target.value)} /></div>
        <div className="space-y-1"><Label className="text-xs">Max Domains</Label><Input type="number" value={form.maxDomains} onChange={e => f("maxDomains", +e.target.value)} /></div>
        <div className="space-y-1"><Label className="text-xs">Max Activations</Label><Input type="number" value={form.maxActivations} onChange={e => f("maxActivations", +e.target.value)} /></div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Features</Label>
        <div className="flex gap-2">
          <Input value={featureInput} onChange={e => setFeatureInput(e.target.value)} placeholder="Add feature" onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }} />
          <Button type="button" size="sm" onClick={addFeature} variant="outline">Add</Button>
        </div>
        <div className="flex flex-wrap gap-1">{form.features.map((feat: string, i: number) => (
          <span key={i} className="text-xs px-2 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center gap-1">
            {feat} <button type="button" className="hover:text-red-400" onClick={() => f("features", form.features.filter((_: any, j: number) => j !== i))}>×</button>
          </span>
        ))}</div>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white gap-2" disabled={loading}>
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {label}
        </Button>
      </div>
    </form>
  );
}
