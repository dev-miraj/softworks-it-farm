import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Search, ChevronDown, ChevronUp } from "lucide-react";

const categories = ["general", "services", "pricing", "technical", "hr", "license", "other"];

const blankForm = { question: "", answer: "", category: "general", sortOrder: "0", isActive: true };

function FaqForm({ initial, onSubmit, loading, submitLabel }: {
  initial: typeof blankForm; onSubmit: (f: typeof blankForm) => void; loading: boolean; submitLabel: string;
}) {
  const [form, setForm] = useState(initial);
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="flex flex-col gap-4 mt-2">
      <div className="flex flex-col gap-1.5">
        <Label>Question *</Label>
        <Input required value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="What is...?" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Answer *</Label>
        <Textarea required value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} className="resize-none h-28" placeholder="Detailed answer..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Sort Order</Label>
          <Input type="number" min={0} value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
        </div>
      </div>
      <Button type="submit" disabled={loading}>{loading ? "Saving..." : submitLabel}</Button>
    </form>
  );
}

export function FaqsPage() {
  const { data: faqs, queryKey } = useListFaqs();
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const deleteFaq = useDeleteFaq();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<NonNullable<typeof faqs>[0] | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!faqs) return [];
    const q = search.toLowerCase();
    return faqs.filter(f => {
      const ms = !search || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
      const mc = filterCat === "all" || f.category === filterCat;
      return ms && mc;
    });
  }, [faqs, search, filterCat]);

  const handleCreate = async (form: typeof blankForm) => {
    await createFaq.mutateAsync({ data: { ...form, sortOrder: Number(form.sortOrder) } });
    await qc.invalidateQueries({ queryKey });
    setAddOpen(false);
  };

  const handleEdit = async (form: typeof blankForm) => {
    if (!editTarget) return;
    await updateFaq.mutateAsync({ id: editTarget.id, data: { ...form, sortOrder: Number(form.sortOrder) } });
    await qc.invalidateQueries({ queryKey });
    setEditTarget(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this FAQ?")) return;
    await deleteFaq.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey });
  };

  return (
    <AdminLayout>
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">FAQs</h1>
          <p className="text-muted-foreground text-sm">Manage frequently asked questions ({faqs?.length ?? 0} total)</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Add FAQ</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add FAQ</DialogTitle></DialogHeader>
            <FaqForm initial={blankForm} onSubmit={handleCreate} loading={createFaq.isPending} submitLabel="Add FAQ" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search FAQs..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["all", ...categories].map(c => (
            <Badge
              key={c}
              variant="outline"
              className={`capitalize text-xs cursor-pointer ${filterCat === c ? "bg-primary/10 text-primary border-primary/30" : ""}`}
              onClick={() => setFilterCat(c)}
            >
              {c === "all" ? `All (${faqs?.length ?? 0})` : c}
            </Badge>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total FAQs", val: faqs?.length ?? 0 },
          { label: "Active", val: (faqs ?? []).filter(f => f.isActive).length },
          { label: "Categories", val: new Set((faqs ?? []).map(f => f.category)).size },
        ].map(s => (
          <div key={s.label} className="gradient-border rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-primary">{s.val}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* FAQ accordion list */}
      <div className="flex flex-col gap-2">
        {filtered.map(faq => (
          <div key={faq.id} className="gradient-border rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/3 transition-colors"
              onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Badge variant="outline" className="text-xs capitalize shrink-0">{faq.category}</Badge>
                <span className="font-medium text-foreground truncate">{faq.question}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); setEditTarget({ ...faq }); }}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(faq.id); }}
                  className="p-1.5 rounded text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {expanded === faq.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>
            {expanded === faq.id && (
              <div className="px-5 pb-4 border-t border-border/40">
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{faq.answer}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span>Sort Order: {faq.sortOrder}</span>
                  <span className={faq.isActive ? "text-green-400" : "text-red-400"}>
                    {faq.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          {search || filterCat !== "all" ? "No FAQs match your filters." : "No FAQs yet. Add your first FAQ."}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit FAQ</DialogTitle></DialogHeader>
          {editTarget && (
            <FaqForm
              initial={{ question: editTarget.question, answer: editTarget.answer, category: editTarget.category, sortOrder: String(editTarget.sortOrder), isActive: editTarget.isActive }}
              onSubmit={handleEdit}
              loading={updateFaq.isPending}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
