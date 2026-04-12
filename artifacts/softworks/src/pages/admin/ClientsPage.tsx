import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListClients, useCreateClient, useUpdateClient, useDeleteClient } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Mail, Phone, Globe, Search, Pencil } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-400 border-green-400/20",
  inactive: "bg-red-500/10 text-red-400 border-red-400/20",
  prospect: "bg-blue-500/10 text-blue-400 border-blue-400/20",
};

const blankForm = { name: "", email: "", phone: "", company: "", country: "", status: "active" };

function ClientForm({ initial, onSubmit, loading, submitLabel }: {
  initial: typeof blankForm; onSubmit: (f: typeof blankForm) => void; loading: boolean; submitLabel: string;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof blankForm, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="flex flex-col gap-4 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5"><Label>Name *</Label><Input required value={form.name} onChange={e => set("name", e.target.value)} /></div>
        <div className="flex flex-col gap-1.5"><Label>Company *</Label><Input required value={form.company} onChange={e => set("company", e.target.value)} /></div>
        <div className="flex flex-col gap-1.5"><Label>Email *</Label><Input required type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
        <div className="flex flex-col gap-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
        <div className="flex flex-col gap-1.5"><Label>Country *</Label><Input required value={form.country} onChange={e => set("country", e.target.value)} placeholder="Bangladesh" /></div>
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={loading}>{loading ? "Saving..." : submitLabel}</Button>
    </form>
  );
}

export function ClientsPage() {
  const { data: clients, queryKey } = useListClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<(typeof clients extends undefined ? never : NonNullable<typeof clients>[0]) | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = useMemo(() => {
    if (!clients) return [];
    const q = search.toLowerCase();
    return clients.filter(c => {
      const ms = !search || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      const mst = filterStatus === "all" || c.status === filterStatus;
      return ms && mst;
    });
  }, [clients, search, filterStatus]);

  const handleCreate = async (form: typeof blankForm) => {
    await createClient.mutateAsync({ data: form });
    await qc.invalidateQueries({ queryKey });
    setAddOpen(false);
  };

  const handleEdit = async (form: typeof blankForm) => {
    if (!editTarget) return;
    await updateClient.mutateAsync({ id: editTarget.id, data: form });
    await qc.invalidateQueries({ queryKey });
    setEditTarget(null);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete client "${name}"?`)) return;
    await deleteClient.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey });
  };

  return (
    <AdminLayout>
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">Clients</h1>
          <p className="text-muted-foreground text-sm">Client database and relationships ({clients?.length ?? 0} total)</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Add Client</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
            <ClientForm initial={blankForm} onSubmit={handleCreate} loading={createClient.isPending} submitLabel="Add Client" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search clients..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {["all", "active", "inactive", "prospect"].map(s => (
          <Badge
            key={s}
            variant="outline"
            className={`capitalize text-xs cursor-pointer ${filterStatus === s ? (statusColors[s] ?? "bg-primary/10 text-primary border-primary/30") : ""}`}
            onClick={() => setFilterStatus(s)}
          >
            {s === "all" ? `All (${clients?.length ?? 0})` : `${s} (${(clients ?? []).filter(c => c.status === s).length})`}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((client) => (
          <div key={client.id} className="gradient-border rounded-xl p-5 group relative">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {client.name.charAt(0)}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge variant="outline" className={`text-xs capitalize ${statusColors[client.status] ?? ""}`}>{client.status}</Badge>
                <button
                  onClick={() => setEditTarget({ ...client })}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(client.id, client.name)}
                  className="p-1.5 rounded text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <Badge variant="outline" className={`text-xs capitalize absolute top-4 right-4 opacity-100 group-hover:opacity-0 transition-opacity ${statusColors[client.status] ?? ""}`}>{client.status}</Badge>
            </div>
            <h3 className="font-bold text-foreground">{client.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{client.company}</p>
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{client.email}</span>
              {client.phone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{client.phone}</span>}
              <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" />{client.country}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
              {client.totalProjects} project{client.totalProjects !== 1 ? "s" : ""}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          {search || filterStatus !== "all" ? "No clients match your filters." : "No clients yet."}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Client</DialogTitle></DialogHeader>
          {editTarget && (
            <ClientForm
              initial={{ name: editTarget.name, email: editTarget.email, phone: editTarget.phone ?? "", company: editTarget.company, country: editTarget.country, status: editTarget.status }}
              onSubmit={handleEdit}
              loading={updateClient.isPending}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
