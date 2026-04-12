import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useListProjects, useCreateProject, useUpdateProject, useDeleteProject } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Search, Pencil, ArrowUpRight } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-400 border-blue-400/20",
  completed: "bg-green-500/10 text-green-400 border-green-400/20",
  on_hold: "bg-yellow-500/10 text-yellow-400 border-yellow-400/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-400/20",
};

const priorityColors: Record<string, string> = {
  high: "text-red-400 bg-red-400/10",
  medium: "text-yellow-400 bg-yellow-400/10",
  low: "text-green-400 bg-green-400/10",
};

const blankForm = {
  name: "", description: "", clientId: "1", clientName: "", status: "active",
  priority: "medium", budget: "", startDate: "", endDate: "", progress: "0", technologies: "",
};

function ProjectForm({ initial, onSubmit, loading, submitLabel }: {
  initial: typeof blankForm; onSubmit: (f: typeof blankForm) => void; loading: boolean; submitLabel: string;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof blankForm, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="flex flex-col gap-4 mt-2">
      <div className="flex flex-col gap-1.5"><Label>Project Name *</Label><Input required value={form.name} onChange={e => set("name", e.target.value)} /></div>
      <div className="flex flex-col gap-1.5"><Label>Description *</Label><Textarea required value={form.description} onChange={e => set("description", e.target.value)} className="resize-none h-20" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5"><Label>Client Name *</Label><Input required value={form.clientName} onChange={e => set("clientName", e.target.value)} /></div>
        <div className="flex flex-col gap-1.5"><Label>Budget ($) *</Label><Input required type="number" value={form.budget} onChange={e => set("budget", e.target.value)} /></div>
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={v => set("priority", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} /></div>
        <div className="flex flex-col gap-1.5"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} /></div>
        <div className="flex flex-col gap-1.5 col-span-2">
          <Label>Progress: {form.progress}%</Label>
          <Input type="range" min={0} max={100} value={form.progress} onChange={e => set("progress", e.target.value)} className="cursor-pointer" />
        </div>
        <div className="flex flex-col gap-1.5 col-span-2"><Label>Technologies (comma-separated)</Label><Input value={form.technologies} onChange={e => set("technologies", e.target.value)} placeholder="React, Node.js, PostgreSQL" /></div>
      </div>
      <Button type="submit" disabled={loading}>{loading ? "Saving..." : submitLabel}</Button>
    </form>
  );
}

export function ProjectsPage() {
  const { data: projects, queryKey } = useListProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<(typeof projects extends undefined ? never : NonNullable<typeof projects>[0]) | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = useMemo(() => {
    if (!projects) return [];
    const q = search.toLowerCase();
    return projects.filter(p => {
      const ms = !search || p.name.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q);
      const mst = filterStatus === "all" || p.status === filterStatus;
      return ms && mst;
    });
  }, [projects, search, filterStatus]);

  const handleCreate = async (form: typeof blankForm) => {
    await createProject.mutateAsync({ data: { ...form, clientId: Number(form.clientId) || 1, budget: Number(form.budget), progress: Number(form.progress), technologies: form.technologies.split(",").map(t => t.trim()).filter(Boolean) } });
    await qc.invalidateQueries({ queryKey });
    setAddOpen(false);
  };

  const handleEdit = async (form: typeof blankForm) => {
    if (!editTarget) return;
    await updateProject.mutateAsync({ id: editTarget.id, data: { ...form, clientId: Number(form.clientId) || editTarget.clientId, budget: Number(form.budget), progress: Number(form.progress), technologies: form.technologies.split(",").map(t => t.trim()).filter(Boolean) } });
    await qc.invalidateQueries({ queryKey });
    setEditTarget(null);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete project "${name}"?`)) return;
    await deleteProject.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey });
  };

  const counts = useMemo(() => {
    if (!projects) return {} as Record<string, number>;
    return projects.reduce((acc: Record<string, number>, p) => { acc[p.status] = (acc[p.status] ?? 0) + 1; return acc; }, {});
  }, [projects]);

  return (
    <AdminLayout>
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">Projects</h1>
          <p className="text-muted-foreground text-sm">Track and manage all client projects ({projects?.length ?? 0} total)</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />New Project</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
            <ProjectForm initial={blankForm} onSubmit={handleCreate} loading={createProject.isPending} submitLabel="Create Project" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search projects..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {["all", "active", "completed", "on_hold", "cancelled"].map(s => (
          <Badge
            key={s}
            variant="outline"
            className={`text-xs cursor-pointer capitalize ${filterStatus === s ? (statusColors[s] ?? "bg-primary/10 text-primary border-primary/30") : ""}`}
            onClick={() => setFilterStatus(s)}
          >
            {s === "all" ? `All (${projects?.length ?? 0})` : `${s.replace("_", " ")} (${counts[s] ?? 0})`}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((project) => (
          <div key={project.id} className="gradient-border rounded-xl p-5 group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground mb-1 truncate">{project.name}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`text-xs capitalize ${statusColors[project.status] ?? ""}`}>{project.status.replace("_", " ")}</Badge>
                  <span className={`text-xs font-medium capitalize px-1.5 py-0.5 rounded ${priorityColors[project.priority] ?? ""}`}>{project.priority}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                <button onClick={() => setEditTarget({ ...project })} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(project.id, project.name)} className="p-1.5 rounded text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
              <span>Client: <span className="text-foreground">{project.clientName}</span></span>
              <span className="font-mono font-bold text-foreground">${Number(project.budget).toLocaleString()}</span>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-foreground font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-1.5" />
            </div>
            {project.technologies?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {project.technologies.slice(0, 4).map(t => (
                  <Badge key={t} variant="secondary" className="text-xs py-0">{t}</Badge>
                ))}
                {project.technologies.length > 4 && <Badge variant="secondary" className="text-xs py-0">+{project.technologies.length - 4}</Badge>}
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          {search || filterStatus !== "all" ? "No projects match your filters." : "No projects yet. Create your first project."}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
          {editTarget && (
            <ProjectForm
              initial={{
                name: editTarget.name, description: editTarget.description,
                clientId: String(editTarget.clientId), clientName: editTarget.clientName,
                status: editTarget.status, priority: editTarget.priority,
                budget: String(editTarget.budget), startDate: editTarget.startDate ?? "",
                endDate: editTarget.endDate ?? "", progress: String(editTarget.progress),
                technologies: (editTarget.technologies ?? []).join(", "),
              }}
              onSubmit={handleEdit}
              loading={updateProject.isPending}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
