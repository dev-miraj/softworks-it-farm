import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useListProjects, useCreateProject, useDeleteProject } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-400 border-blue-400/20",
  completed: "bg-green-500/10 text-green-400 border-green-400/20",
  on_hold: "bg-yellow-500/10 text-yellow-400 border-yellow-400/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-400/20",
};

const priorityColors: Record<string, string> = {
  high: "text-red-400",
  medium: "text-yellow-400",
  low: "text-green-400",
};

const blankForm = { name: "", description: "", clientId: "1", clientName: "", status: "active", priority: "medium", budget: "", startDate: "", endDate: "", progress: "0", technologies: "" };

export function ProjectsPage() {
  const { data: projects, queryKey } = useListProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankForm);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProject.mutateAsync({
      data: {
        ...form,
        clientId: Number(form.clientId) || 1,
        budget: Number(form.budget),
        progress: Number(form.progress),
        technologies: form.technologies.split(",").map(t => t.trim()).filter(Boolean),
      }
    });
    await qc.invalidateQueries({ queryKey });
    setOpen(false);
    setForm(blankForm);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this project?")) return;
    await deleteProject.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey });
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">Projects</h1>
          <p className="text-muted-foreground text-sm">Track and manage all client projects</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />New Project</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5"><Label>Project Name *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Description *</Label><Textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="resize-none h-20" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5"><Label>Client Name *</Label><Input required value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Budget ($) *</Label><Input required type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5">
                  <Label>Status</Label>
                  <Select defaultValue="active" onValueChange={val => setForm({ ...form, status: val })}>
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
                  <Select defaultValue="medium" onValueChange={val => setForm({ ...form, priority: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5 col-span-2"><Label>Progress (0-100)</Label><Input type="number" min={0} max={100} value={form.progress} onChange={e => setForm({ ...form, progress: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5 col-span-2"><Label>Technologies (comma-separated)</Label><Input value={form.technologies} onChange={e => setForm({ ...form, technologies: e.target.value })} placeholder="React, Node.js, PostgreSQL" /></div>
              </div>
              <Button type="submit" disabled={createProject.isPending}>{createProject.isPending ? "Creating..." : "Create Project"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects?.map((project) => (
            <div key={project.id} className="gradient-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-foreground mb-1">{project.name}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-xs capitalize ${statusColors[project.status] ?? ""}`}>{project.status.replace("_", " ")}</Badge>
                    <span className={`text-xs font-medium capitalize ${priorityColors[project.priority] ?? ""}`}>{project.priority} priority</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7" onClick={() => handleDelete(project.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span>Client: {project.clientName}</span>
                <span className="font-mono text-foreground">${Number(project.budget).toLocaleString()}</span>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-foreground font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-1.5" />
              </div>
              <div className="flex flex-wrap gap-1">
                {project.technologies.slice(0, 4).map(t => (
                  <Badge key={t} variant="secondary" className="text-xs py-0">{t}</Badge>
                ))}
                {project.technologies.length > 4 && <Badge variant="secondary" className="text-xs py-0">+{project.technologies.length - 4}</Badge>}
              </div>
            </div>
          ))}
        </div>
      {(!projects || projects.length === 0) && (
        <div className="text-center py-20 text-muted-foreground">No projects yet. Create your first project.</div>
      )}
    </AdminLayout>
  );
}
