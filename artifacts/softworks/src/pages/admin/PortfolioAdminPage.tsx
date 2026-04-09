import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useListPortfolio, useCreatePortfolioItem, useDeletePortfolioItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ExternalLink } from "lucide-react";

const blankForm = { title: "", description: "", category: "", technologies: "", imageUrl: "", projectUrl: "", clientName: "", isFeatured: false };

export function PortfolioAdminPage() {
  const { data: portfolio, queryKey } = useListPortfolio();
  const createItem = useCreatePortfolioItem();
  const deleteItem = useDeletePortfolioItem();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankForm);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createItem.mutateAsync({
      data: { ...form, technologies: form.technologies.split(",").map(t => t.trim()).filter(Boolean) }
    });
    await qc.invalidateQueries({ queryKey });
    setOpen(false);
    setForm(blankForm);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this item?")) return;
    await deleteItem.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey });
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">Portfolio</h1>
          <p className="text-muted-foreground text-sm">Manage case studies and projects</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Add Item</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Portfolio Item</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5"><Label>Title *</Label><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Category *</Label><Input required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Client Name *</Label><Input required value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} /></div>
                <div className="flex items-center gap-2 mt-5">
                  <Switch checked={form.isFeatured} onCheckedChange={v => setForm({ ...form, isFeatured: v })} />
                  <Label>Featured</Label>
                </div>
                <div className="flex flex-col gap-1.5 col-span-2"><Label>Description *</Label><Textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="resize-none h-20" /></div>
                <div className="flex flex-col gap-1.5 col-span-2"><Label>Image URL *</Label><Input required value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5 col-span-2"><Label>Project URL</Label><Input value={form.projectUrl} onChange={e => setForm({ ...form, projectUrl: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5 col-span-2"><Label>Technologies (comma-separated)</Label><Input value={form.technologies} onChange={e => setForm({ ...form, technologies: e.target.value })} placeholder="React, Node.js" /></div>
              </div>
              <Button type="submit" disabled={createItem.isPending}>{createItem.isPending ? "Adding..." : "Add Item"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portfolio?.map((item) => (
            <div key={item.id} className="gradient-border rounded-xl overflow-hidden group">
              <div className="relative h-32 overflow-hidden bg-muted">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/600x300/1a1f3a/6366f1?text=Project"; }} />
                {item.isFeatured && <Badge className="absolute top-2 left-2 text-xs bg-primary">Featured</Badge>}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-foreground">{item.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                      <span className="text-xs text-muted-foreground">{item.clientName}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.technologies.slice(0, 3).map(t => <Badge key={t} variant="outline" className="text-xs py-0">{t}</Badge>)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {item.projectUrl && (
                      <a href={item.projectUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"><ExternalLink className="w-3.5 h-3.5" /></Button>
                      </a>
                    )}
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      {(!portfolio || portfolio.length === 0) && (
        <div className="text-center py-20 text-muted-foreground">No portfolio items yet.</div>
      )}
    </AdminLayout>
  );
}
