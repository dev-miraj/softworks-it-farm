import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListInvoices, useCreateInvoice, useUpdateInvoice, useDeleteInvoice } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Search, Download, FileText, DollarSign } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-muted/50 text-muted-foreground border-muted",
  sent: "bg-blue-500/10 text-blue-400 border-blue-400/20",
  paid: "bg-green-500/10 text-green-400 border-green-400/20",
  overdue: "bg-red-500/10 text-red-400 border-red-400/20",
  cancelled: "bg-orange-500/10 text-orange-400 border-orange-400/20",
};

function generateInvoiceNum() {
  const d = new Date();
  return `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

const blankForm = {
  invoiceNumber: "", clientName: "", clientEmail: "", projectName: "",
  amount: "", tax: "0", total: "", status: "draft", currency: "USD",
  issueDate: new Date().toISOString().split("T")[0], dueDate: "", notes: "",
};

function InvoiceForm({ initial, onSubmit, loading, submitLabel }: {
  initial: typeof blankForm; onSubmit: (f: typeof blankForm) => void; loading: boolean; submitLabel: string;
}) {
  const [form, setForm] = useState({ ...initial, invoiceNumber: initial.invoiceNumber || generateInvoiceNum() });
  const set = (k: keyof typeof blankForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const computedTotal = () => {
    const amt = parseFloat(form.amount) || 0;
    const tax = parseFloat(form.tax) || 0;
    return (amt + tax).toFixed(2);
  };

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, total: computedTotal() }); }} className="flex flex-col gap-4 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5 col-span-2">
          <Label>Invoice Number *</Label>
          <Input required value={form.invoiceNumber} onChange={e => set("invoiceNumber", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Client Name *</Label>
          <Input required value={form.clientName} onChange={e => set("clientName", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Client Email *</Label>
          <Input required type="email" value={form.clientEmail} onChange={e => set("clientEmail", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5 col-span-2">
          <Label>Project Name *</Label>
          <Input required value={form.projectName} onChange={e => set("projectName", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Amount ($) *</Label>
          <Input required type="number" step="0.01" value={form.amount} onChange={e => set("amount", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Tax ($)</Label>
          <Input type="number" step="0.01" value={form.tax} onChange={e => set("tax", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Total: ${computedTotal()}</Label>
          <div className="h-9 flex items-center px-3 rounded-md border border-border bg-muted/30 text-sm text-foreground font-bold">${computedTotal()}</div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Currency</Label>
          <Select value={form.currency} onValueChange={v => set("currency", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["USD", "EUR", "GBP", "BDT", "INR"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["draft", "sent", "paid", "overdue", "cancelled"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Issue Date *</Label>
          <Input required type="date" value={form.issueDate} onChange={e => set("issueDate", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Due Date</Label>
          <Input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5 col-span-2">
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} className="resize-none h-20" placeholder="Payment terms, additional info..." />
        </div>
      </div>
      <Button type="submit" disabled={loading}>{loading ? "Saving..." : submitLabel}</Button>
    </form>
  );
}

export function InvoicesPage() {
  const { data: invoices, queryKey } = useListInvoices();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<NonNullable<typeof invoices>[0] | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = useMemo(() => {
    if (!invoices) return [];
    const q = search.toLowerCase();
    return invoices.filter(inv => {
      const ms = !search || inv.clientName.toLowerCase().includes(q) || inv.invoiceNumber.toLowerCase().includes(q) || inv.projectName.toLowerCase().includes(q);
      const mst = filterStatus === "all" || inv.status === filterStatus;
      return ms && mst;
    });
  }, [invoices, search, filterStatus]);

  const totals = useMemo(() => {
    const all = invoices ?? [];
    return {
      totalRevenue: all.filter(i => i.status === "paid").reduce((s, i) => s + parseFloat(i.total), 0),
      pending: all.filter(i => i.status === "sent").reduce((s, i) => s + parseFloat(i.total), 0),
      overdue: all.filter(i => i.status === "overdue").length,
    };
  }, [invoices]);

  const handleCreate = async (form: typeof blankForm) => {
    await createInvoice.mutateAsync({ data: form });
    await qc.invalidateQueries({ queryKey });
    setAddOpen(false);
  };

  const handleEdit = async (form: typeof blankForm) => {
    if (!editTarget) return;
    await updateInvoice.mutateAsync({ id: editTarget.id, data: form });
    await qc.invalidateQueries({ queryKey });
    setEditTarget(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this invoice?")) return;
    await deleteInvoice.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey });
  };

  const exportCSV = () => {
    const rows = [["Invoice #", "Client", "Email", "Project", "Amount", "Tax", "Total", "Status", "Issue Date", "Due Date"]];
    (invoices ?? []).forEach(i => rows.push([i.invoiceNumber, i.clientName, i.clientEmail, i.projectName, i.amount, i.tax, i.total, i.status, i.issueDate, i.dueDate ?? ""]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: "invoices.csv" });
    a.click();
  };

  return (
    <AdminLayout>
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">Invoices</h1>
          <p className="text-muted-foreground text-sm">Billing management ({invoices?.length ?? 0} total)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} className="gap-2"><Download className="w-4 h-4" />Export CSV</Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />New Invoice</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
              <InvoiceForm initial={blankForm} onSubmit={handleCreate} loading={createInvoice.isPending} submitLabel="Create Invoice" />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Invoices", val: invoices?.length ?? 0, icon: FileText },
          { label: "Revenue (Paid)", val: `$${totals.totalRevenue.toLocaleString()}`, icon: DollarSign },
          { label: "Pending", val: `$${totals.pending.toLocaleString()}`, icon: DollarSign },
          { label: "Overdue", val: totals.overdue, icon: FileText, danger: true },
        ].map(s => (
          <div key={s.label} className={`gradient-border rounded-xl p-4 ${s.danger && totals.overdue > 0 ? "border-red-500/30" : ""}`}>
            <div className={`text-xl font-black ${s.danger && totals.overdue > 0 ? "text-red-400" : "text-primary"}`}>{s.val}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {["all", "draft", "sent", "paid", "overdue", "cancelled"].map(s => (
          <Badge key={s} variant="outline" className={`capitalize text-xs cursor-pointer ${filterStatus === s ? (statusColors[s] ?? "bg-primary/10 text-primary border-primary/30") : ""}`} onClick={() => setFilterStatus(s)}>
            {s === "all" ? `All (${invoices?.length ?? 0})` : `${s} (${(invoices ?? []).filter(i => i.status === s).length})`}
          </Badge>
        ))}
      </div>

      {/* Table */}
      <div className="gradient-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/50 bg-muted/20">
              <tr>
                {["Invoice #", "Client", "Project", "Amount", "Status", "Due Date", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{inv.clientName}</div>
                    <div className="text-xs text-muted-foreground">{inv.clientEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-36 truncate">{inv.projectName}</td>
                  <td className="px-4 py-3 font-bold text-foreground">{inv.currency} {parseFloat(inv.total).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-xs capitalize ${statusColors[inv.status] ?? ""}`}>{inv.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{inv.dueDate || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setEditTarget({ ...inv })} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(inv.id)} className="p-1.5 rounded text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              {search || filterStatus !== "all" ? "No invoices match your filters." : "No invoices yet."}
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Invoice</DialogTitle></DialogHeader>
          {editTarget && (
            <InvoiceForm
              initial={{ invoiceNumber: editTarget.invoiceNumber, clientName: editTarget.clientName, clientEmail: editTarget.clientEmail, projectName: editTarget.projectName, amount: editTarget.amount, tax: editTarget.tax, total: editTarget.total, status: editTarget.status, currency: editTarget.currency, issueDate: editTarget.issueDate, dueDate: editTarget.dueDate ?? "", notes: editTarget.notes ?? "" }}
              onSubmit={handleEdit}
              loading={updateInvoice.isPending}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
