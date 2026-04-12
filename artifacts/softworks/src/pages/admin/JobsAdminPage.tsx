import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListJobs, useCreateJob, useUpdateJob, useDeleteJob } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Search, MapPin, Clock, Briefcase, Users } from "lucide-react";

const departments = ["Engineering", "Design", "Marketing", "Sales", "HR", "Operations", "Finance", "Product"];
const jobTypes = ["full-time", "part-time", "contract", "internship", "remote"];

const typeColors: Record<string, string> = {
  "full-time": "bg-green-500/10 text-green-400 border-green-400/20",
  "part-time": "bg-blue-500/10 text-blue-400 border-blue-400/20",
  "contract": "bg-yellow-500/10 text-yellow-400 border-yellow-400/20",
  "internship": "bg-purple-500/10 text-purple-400 border-purple-400/20",
  "remote": "bg-cyan-500/10 text-cyan-400 border-cyan-400/20",
};

const blankForm = {
  title: "", department: "Engineering", location: "Remote", type: "full-time",
  experience: "", salary: "", description: "", responsibilities: "", requirements: "", benefits: "", isActive: true, deadline: "",
};

function JobForm({ initial, onSubmit, loading, submitLabel }: {
  initial: typeof blankForm; onSubmit: (f: typeof blankForm) => void; loading: boolean; submitLabel: string;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof blankForm, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="flex flex-col gap-4 mt-2">
      <div className="flex flex-col gap-1.5">
        <Label>Job Title *</Label>
        <Input required value={form.title} onChange={e => set("title", e.target.value)} placeholder="Senior React Developer" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Department</Label>
          <Select value={form.department} onValueChange={v => set("department", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Job Type</Label>
          <Select value={form.type} onValueChange={v => set("type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{jobTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Location *</Label>
          <Input required value={form.location} onChange={e => set("location", e.target.value)} placeholder="Remote / Dhaka, BD" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Experience *</Label>
          <Input required value={form.experience} onChange={e => set("experience", e.target.value)} placeholder="2-4 years" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Salary Range</Label>
          <Input value={form.salary} onChange={e => set("salary", e.target.value)} placeholder="$3,000 - $5,000/month" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Application Deadline</Label>
          <Input type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Job Description *</Label>
        <Textarea required value={form.description} onChange={e => set("description", e.target.value)} className="resize-none h-24" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Responsibilities (one per line)</Label>
        <Textarea value={form.responsibilities} onChange={e => set("responsibilities", e.target.value)} className="resize-none h-20" placeholder="Build scalable React apps&#10;Write clean code..." />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Requirements (one per line)</Label>
        <Textarea value={form.requirements} onChange={e => set("requirements", e.target.value)} className="resize-none h-20" placeholder="3+ years React experience&#10;TypeScript knowledge..." />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Benefits (one per line)</Label>
        <Textarea value={form.benefits} onChange={e => set("benefits", e.target.value)} className="resize-none h-16" placeholder="Health insurance&#10;Remote work..." />
      </div>
      <Button type="submit" disabled={loading}>{loading ? "Saving..." : submitLabel}</Button>
    </form>
  );
}

function splitLines(s: string) { return s.split("\n").map(l => l.trim()).filter(Boolean); }

export function JobsAdminPage() {
  const { data: jobs, queryKey } = useListJobs();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<NonNullable<typeof jobs>[0] | null>(null);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");

  const filtered = useMemo(() => {
    if (!jobs) return [];
    const q = search.toLowerCase();
    return jobs.filter(j => {
      const ms = !search || j.title.toLowerCase().includes(q) || j.department.toLowerCase().includes(q);
      const md = filterDept === "all" || j.department === filterDept;
      return ms && md;
    });
  }, [jobs, search, filterDept]);

  const toData = (form: typeof blankForm) => ({
    ...form,
    responsibilities: splitLines(form.responsibilities),
    requirements: splitLines(form.requirements),
    benefits: splitLines(form.benefits),
  });

  const handleCreate = async (form: typeof blankForm) => {
    await createJob.mutateAsync({ data: toData(form) });
    await qc.invalidateQueries({ queryKey });
    setAddOpen(false);
  };

  const handleEdit = async (form: typeof blankForm) => {
    if (!editTarget) return;
    await updateJob.mutateAsync({ id: editTarget.id, data: toData(form) });
    await qc.invalidateQueries({ queryKey });
    setEditTarget(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this job posting?")) return;
    await deleteJob.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey });
  };

  const toggleActive = async (job: NonNullable<typeof jobs>[0]) => {
    await updateJob.mutateAsync({ id: job.id, data: { isActive: !job.isActive } });
    await qc.invalidateQueries({ queryKey });
  };

  return (
    <AdminLayout>
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">Job Postings</h1>
          <p className="text-muted-foreground text-sm">Career openings management ({jobs?.length ?? 0} total)</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Post Job</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Post New Job</DialogTitle></DialogHeader>
            <JobForm initial={blankForm} onSubmit={handleCreate} loading={createJob.isPending} submitLabel="Post Job" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total Postings", val: jobs?.length ?? 0, icon: Briefcase },
          { label: "Active", val: (jobs ?? []).filter(j => j.isActive).length, icon: Users },
          { label: "Departments", val: new Set((jobs ?? []).map(j => j.department)).size, icon: Briefcase },
        ].map(s => (
          <div key={s.label} className="gradient-border rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-primary">{s.val}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["all", ...departments].map(d => (
            <Badge key={d} variant="outline" className={`text-xs cursor-pointer ${filterDept === d ? "bg-primary/10 text-primary border-primary/30" : ""}`} onClick={() => setFilterDept(d)}>
              {d === "all" ? `All` : d}
            </Badge>
          ))}
        </div>
      </div>

      {/* Job cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(job => (
          <div key={job.id} className={`gradient-border rounded-xl p-5 group ${!job.isActive ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground mb-1 truncate">{job.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">{job.department}</Badge>
                  <Badge variant="outline" className={`text-xs capitalize ${typeColors[job.type] ?? ""}`}>{job.type}</Badge>
                  {!job.isActive && <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditTarget({ ...job })} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(job.id)} className="p-1.5 rounded text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{job.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.experience}</span>
              {job.salary && <span className="text-green-400 font-medium">{job.salary}</span>}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              {job.deadline && <span className="text-xs text-muted-foreground">Deadline: {job.deadline}</span>}
              <button
                onClick={() => toggleActive(job)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${job.isActive ? "bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400" : "bg-muted/30 text-muted-foreground hover:bg-green-500/10 hover:text-green-400"}`}
              >
                {job.isActive ? "Active" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          {search || filterDept !== "all" ? "No jobs match your filters." : "No job postings yet."}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Job Posting</DialogTitle></DialogHeader>
          {editTarget && (
            <JobForm
              initial={{ title: editTarget.title, department: editTarget.department, location: editTarget.location, type: editTarget.type, experience: editTarget.experience, salary: editTarget.salary ?? "", description: editTarget.description, responsibilities: (editTarget.responsibilities ?? []).join("\n"), requirements: (editTarget.requirements ?? []).join("\n"), benefits: (editTarget.benefits ?? []).join("\n"), isActive: editTarget.isActive, deadline: editTarget.deadline ?? "" }}
              onSubmit={handleEdit}
              loading={updateJob.isPending}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
