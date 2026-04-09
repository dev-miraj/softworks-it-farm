import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListSaasProducts, useCreateSaasProduct, useDeleteSaasProduct } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ExternalLink } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "text-green-400 bg-green-400/10 border-green-400/20",
  beta: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  coming_soon: "text-muted-foreground bg-muted border-border",
};

const blankForm = { name: "", description: "", features: "", category: "", iconUrl: "", demoUrl: "", pricingMonthly: "", pricingYearly: "", status: "active", isActive: true };

export function SaasAdminPage() {
  const { data: products, queryKey } = useListSaasProducts();
  const createProduct = useCreateSaasProduct();
  const deleteProduct = useDeleteSaasProduct();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankForm);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProduct.mutateAsync({
      data: {
        ...form,
        features: form.features.split("\n").map(f => f.trim()).filter(Boolean),
        pricingMonthly: form.pricingMonthly ? Number(form.pricingMonthly) : undefined,
        pricingYearly: form.pricingYearly ? Number(form.pricingYearly) : undefined,
      }
    });
    await qc.invalidateQueries({ queryKey });
    setOpen(false);
    setForm(blankForm);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    await deleteProduct.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey });
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">SaaS Products</h1>
          <p className="text-muted-foreground text-sm">Manage your product offerings</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add SaaS Product</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5"><Label>Product Name *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Category *</Label><Input required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Icon (emoji/URL)</Label><Input value={form.iconUrl} onChange={e => setForm({ ...form, iconUrl: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Demo URL</Label><Input value={form.demoUrl} onChange={e => setForm({ ...form, demoUrl: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Monthly Price ($)</Label><Input type="number" value={form.pricingMonthly} onChange={e => setForm({ ...form, pricingMonthly: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Yearly Price ($)</Label><Input type="number" value={form.pricingYearly} onChange={e => setForm({ ...form, pricingYearly: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5">
                  <Label>Status</Label>
                  <Select defaultValue="active" onValueChange={val => setForm({ ...form, status: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="beta">Beta</SelectItem>
                      <SelectItem value="coming_soon">Coming Soon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 mt-5">
                  <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
                  <Label>Active</Label>
                </div>
              </div>
              <div className="flex flex-col gap-1.5"><Label>Description *</Label><Textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="resize-none h-20" /></div>
              <div className="flex flex-col gap-1.5"><Label>Features (one per line)</Label><Textarea value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} className="resize-none h-24" /></div>
              <Button type="submit" disabled={createProduct.isPending}>{createProduct.isPending ? "Adding..." : "Add Product"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products?.map((product) => (
            <div key={product.id} className="gradient-border rounded-xl p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{product.iconUrl || "📦"}</span>
                  <div>
                    <h3 className="font-bold text-foreground">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs capitalize ${statusColors[product.status] ?? ""}`}>{product.status.replace("_", " ")}</Badge>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm">
                  {product.pricingMonthly && <span className="font-mono text-primary">${Number(product.pricingMonthly)}/mo</span>}
                  {product.pricingYearly && <span className="font-mono text-secondary">${Number(product.pricingYearly)}/yr</span>}
                </div>
                {product.demoUrl && (
                  <a href={product.demoUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      {(!products || products.length === 0) && (
        <div className="text-center py-20 text-muted-foreground">No SaaS products yet.</div>
      )}
    </AdminLayout>
  );
}
