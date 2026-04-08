import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useListClients, useCreateClient, useDeleteClient } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Mail, Phone, Globe } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-400 border-green-400/20",
  inactive: "bg-red-500/10 text-red-400 border-red-400/20",
  prospect: "bg-blue-500/10 text-blue-400 border-blue-400/20",
};

const blankForm = { name: "", email: "", phone: "", company: "", country: "", status: "active" };

export function ClientsPage() {
  const { data: clients, isLoading, queryKey } = useListClients();
  const createClient = useCreateClient();
  const deleteClient = useDeleteClient();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankForm);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createClient.mutateAsync({ data: form });
    await qc.invalidateQueries({ queryKey });
    setOpen(false);
    setForm(blankForm);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this client?")) return;
    await deleteClient.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey });
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">Clients</h1>
          <p className="text-muted-foreground text-sm">Client database and relationships</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Add Client</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5"><Label>Name *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Company *</Label><Input required value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Email *</Label><Input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Country *</Label><Input required value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="USA" /></div>
                <div className="flex flex-col gap-1.5">
                  <Label>Status</Label>
                  <Select defaultValue="active" onValueChange={val => setForm({ ...form, status: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="prospect">Prospect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={createClient.isPending}>{createClient.isPending ? "Adding..." : "Add Client"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients?.map((client) => (
            <div key={client.id} className="gradient-border rounded-xl p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {client.name.charAt(0)}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs capitalize ${statusColors[client.status] ?? ""}`}>{client.status}</Badge>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(client.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <h3 className="font-bold text-foreground">{client.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{client.company}</p>
              <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{client.email}</span>
                {client.phone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{client.phone}</span>}
                <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" />{client.country}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                {client.totalProjects} project{client.totalProjects !== 1 ? "s" : ""}
              </div>
            </div>
          ))}
        </div>
      )}
      {!isLoading && (!clients || clients.length === 0) && (
        <div className="text-center py-20 text-muted-foreground">No clients yet.</div>
      )}
    </AdminLayout>
  );
}
