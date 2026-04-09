import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useListServices, useCreateService, useDeleteService } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";

const blankForm = { title: "", description: "", icon: "🚀", category: "", features: "", isActive: true };

export function ServicesAdminPage() {
  const { data: services, queryKey } = useListServices();
  const createService = useCreateService();
  const deleteService = useDeleteService();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankForm);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createService.mutateAsync({
      data: { ...form, features: form.features.split("\n").map(f => f.trim()).filter(Boolean) }
    });
    await qc.invalidateQueries({ queryKey });
    setOpen(false);
    setForm(blankForm);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this service?")) return;
    await deleteService.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey });
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">Services</h1>
          <p className="text-muted-foreground text-sm">Manage services shown on the public website</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Add Service</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add New Service</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5"><Label>Title *</Label><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Icon (emoji)</Label><Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Category *</Label><Input required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Web Development" /></div>
                <div className="flex flex-col gap-1.5 items-start">
                  <Label>Active</Label>
                  <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5"><Label>Description *</Label><Textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="resize-none h-20" /></div>
              <div className="flex flex-col gap-1.5"><Label>Features (one per line)</Label><Textarea value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} className="resize-none h-28" /></div>
              <Button type="submit" disabled={createService.isPending}>{createService.isPending ? "Adding..." : "Add Service"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services?.map((service) => (
            <div key={service.id} className="gradient-border rounded-xl p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{service.icon}</div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={service.isActive ? "text-green-400 border-green-400/20 bg-green-400/10" : "text-muted-foreground"}>{service.isActive ? "Active" : "Inactive"}</Badge>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(service.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <h3 className="font-bold text-foreground mb-1">{service.title}</h3>
              <Badge variant="secondary" className="text-xs mb-2">{service.category}</Badge>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
              <div className="text-xs text-muted-foreground">{service.features.length} features</div>
            </div>
          ))}
        </div>
      {(!services || services.length === 0) && (
        <div className="text-center py-20 text-muted-foreground">No services yet.</div>
      )}
    </AdminLayout>
  );
}
