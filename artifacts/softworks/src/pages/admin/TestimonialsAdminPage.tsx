import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useListTestimonials, useCreateTestimonial, useDeleteTestimonial } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Star } from "lucide-react";

const blankForm = { clientName: "", company: "", role: "", content: "", rating: 5, avatarUrl: "", isActive: true };

export function TestimonialsAdminPage() {
  const { data: testimonials, isLoading, queryKey } = useListTestimonials();
  const createTestimonial = useCreateTestimonial();
  const deleteTestimonial = useDeleteTestimonial();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankForm);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTestimonial.mutateAsync({ data: form });
    await qc.invalidateQueries({ queryKey });
    setOpen(false);
    setForm(blankForm);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this testimonial?")) return;
    await deleteTestimonial.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey });
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">Testimonials</h1>
          <p className="text-muted-foreground text-sm">Manage client reviews</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Add Testimonial</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Testimonial</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5"><Label>Client Name *</Label><Input required value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Company *</Label><Input required value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Role</Label><Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="CEO" /></div>
                <div className="flex flex-col gap-1.5"><Label>Rating (1-5)</Label><Input type="number" min={1} max={5} value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} /></div>
                <div className="flex flex-col gap-1.5 col-span-2"><Label>Avatar URL</Label><Input value={form.avatarUrl} onChange={e => setForm({ ...form, avatarUrl: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5 col-span-2"><Label>Testimonial *</Label><Textarea required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="resize-none h-24" /></div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
                  <Label>Active</Label>
                </div>
              </div>
              <Button type="submit" disabled={createTestimonial.isPending}>{createTestimonial.isPending ? "Adding..." : "Add"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testimonials?.map((t) => (
            <div key={t.id} className="gradient-border rounded-xl p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {t.avatarUrl ? (
                    <img src={t.avatarUrl} alt={t.clientName} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{t.clientName.charAt(0)}</div>
                  )}
                  <div>
                    <div className="font-bold text-foreground text-sm">{t.clientName}</div>
                    <div className="text-xs text-muted-foreground">{t.role && `${t.role} · `}{t.company}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={t.isActive ? "text-green-400 border-green-400/20 text-xs" : "text-xs text-muted-foreground"}>{t.isActive ? "Active" : "Inactive"}</Badge>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">"{t.content}"</p>
            </div>
          ))}
        </div>
      )}
      {!isLoading && (!testimonials || testimonials.length === 0) && (
        <div className="text-center py-20 text-muted-foreground">No testimonials yet.</div>
      )}
    </AdminLayout>
  );
}
