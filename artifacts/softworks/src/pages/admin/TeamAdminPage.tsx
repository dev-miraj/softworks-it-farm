import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useListTeamMembers, useCreateTeamMember, useDeleteTeamMember } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Linkedin } from "lucide-react";

const blankForm = { name: "", role: "", department: "", skills: "", avatarUrl: "", linkedinUrl: "", bio: "", isActive: true, order: 0 };

export function TeamAdminPage() {
  const { data: team, isLoading, queryKey } = useListTeamMembers();
  const createMember = useCreateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankForm);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMember.mutateAsync({
      data: { ...form, skills: form.skills.split(",").map(s => s.trim()).filter(Boolean), order: Number(form.order) }
    });
    await qc.invalidateQueries({ queryKey });
    setOpen(false);
    setForm(blankForm);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this team member?")) return;
    await deleteMember.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey });
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">Team Members</h1>
          <p className="text-muted-foreground text-sm">Manage the public team showcase</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Add Member</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5"><Label>Name *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Role *</Label><Input required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Department *</Label><Input required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Display Order</Label><Input type="number" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} /></div>
                <div className="flex flex-col gap-1.5 col-span-2"><Label>Avatar URL</Label><Input value={form.avatarUrl} onChange={e => setForm({ ...form, avatarUrl: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5 col-span-2"><Label>LinkedIn URL</Label><Input value={form.linkedinUrl} onChange={e => setForm({ ...form, linkedinUrl: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5 col-span-2"><Label>Skills (comma-separated)</Label><Input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="React, Node.js" /></div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
                  <Label>Show on website</Label>
                </div>
              </div>
              <Button type="submit" disabled={createMember.isPending}>{createMember.isPending ? "Adding..." : "Add Member"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {team?.map((member) => (
            <div key={member.id} className="gradient-border rounded-xl p-5 text-center group">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 ring-2 ring-primary/20">
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">{member.name.charAt(0)}</div>
                )}
              </div>
              <h3 className="font-bold text-foreground text-sm">{member.name}</h3>
              <p className="text-xs text-primary mb-1">{member.role}</p>
              <p className="text-xs text-muted-foreground mb-2">{member.department}</p>
              <Badge variant="outline" className={`text-xs mb-3 ${member.isActive ? "text-green-400 border-green-400/20" : "text-muted-foreground"}`}>{member.isActive ? "Visible" : "Hidden"}</Badge>
              <div className="flex items-center justify-center gap-2">
                {member.linkedinUrl && (
                  <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>
                )}
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(member.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!isLoading && (!team || team.length === 0) && (
        <div className="text-center py-20 text-muted-foreground">No team members yet.</div>
      )}
    </AdminLayout>
  );
}
