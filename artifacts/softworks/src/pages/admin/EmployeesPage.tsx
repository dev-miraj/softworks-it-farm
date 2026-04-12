import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Mail, Building2, Calendar, Search, Pencil, Users } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-400 border-green-400/20",
  inactive: "bg-red-500/10 text-red-400 border-red-400/20",
  on_leave: "bg-yellow-500/10 text-yellow-400 border-yellow-400/20",
};

const DEPARTMENTS = ["Engineering", "Design", "Marketing", "Sales", "HR", "Management", "Finance", "Operations"];

const blankForm = { employeeId: "", name: "", email: "", phone: "", department: "", role: "", salary: "", joinDate: "", status: "active", address: "" };

function EmployeeForm({ initial, onSubmit, loading, submitLabel }: {
  initial: typeof blankForm;
  onSubmit: (form: typeof blankForm) => void;
  loading: boolean;
  submitLabel: string;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof blankForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="flex flex-col gap-4 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5"><Label>Employee ID *</Label><Input required value={form.employeeId} onChange={e => set("employeeId", e.target.value)} placeholder="EMP001" /></div>
        <div className="flex flex-col gap-1.5"><Label>Full Name *</Label><Input required value={form.name} onChange={e => set("name", e.target.value)} /></div>
        <div className="flex flex-col gap-1.5"><Label>Email *</Label><Input required type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
        <div className="flex flex-col gap-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
        <div className="flex flex-col gap-1.5">
          <Label>Department *</Label>
          <Select required value={form.department} onValueChange={v => set("department", v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5"><Label>Role *</Label><Input required value={form.role} onChange={e => set("role", e.target.value)} /></div>
        <div className="flex flex-col gap-1.5"><Label>Salary ($) *</Label><Input required type="number" value={form.salary} onChange={e => set("salary", e.target.value)} /></div>
        <div className="flex flex-col gap-1.5"><Label>Join Date *</Label><Input required type="date" value={form.joinDate} onChange={e => set("joinDate", e.target.value)} /></div>
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 col-span-2"><Label>Address</Label><Input value={form.address} onChange={e => set("address", e.target.value)} /></div>
      </div>
      <Button type="submit" disabled={loading}>{loading ? "Saving..." : submitLabel}</Button>
    </form>
  );
}

export function EmployeesPage() {
  const { data: employees, queryKey } = useListEmployees();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<typeof employees extends undefined ? never : NonNullable<typeof employees>[0] | null>(null);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");

  const filtered = useMemo(() => {
    if (!employees) return [];
    return employees.filter(e => {
      const q = search.toLowerCase();
      const matchesSearch = !search || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.role.toLowerCase().includes(q);
      const matchesDept = filterDept === "all" || e.department === filterDept;
      return matchesSearch && matchesDept;
    });
  }, [employees, search, filterDept]);

  const handleCreate = async (form: typeof blankForm) => {
    await createEmployee.mutateAsync({ data: { ...form, salary: Number(form.salary) } });
    await qc.invalidateQueries({ queryKey });
    setAddOpen(false);
  };

  const handleEdit = async (form: typeof blankForm) => {
    if (!editTarget) return;
    await updateEmployee.mutateAsync({ id: editTarget.id, data: { ...form, salary: Number(form.salary) } });
    await qc.invalidateQueries({ queryKey });
    setEditTarget(null);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Remove employee "${name}"?`)) return;
    await deleteEmployee.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey });
  };

  const depts = useMemo(() => [...new Set((employees ?? []).map(e => e.department))].sort(), [employees]);

  return (
    <AdminLayout>
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">Employees</h1>
          <p className="text-muted-foreground text-sm">Manage your team members ({employees?.length ?? 0} total)</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Add Employee</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
            <EmployeeForm initial={blankForm} onSubmit={handleCreate} loading={createEmployee.isPending} submitLabel="Add Employee" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Dept summary chips */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        {depts.map(dept => {
          const count = (employees ?? []).filter(e => e.department === dept).length;
          return (
            <Badge
              key={dept}
              variant="outline"
              className={`text-xs cursor-pointer ${filterDept === dept ? "bg-primary/10 text-primary border-primary/30" : ""}`}
              onClick={() => setFilterDept(filterDept === dept ? "all" : dept)}
            >
              {dept} ({count})
            </Badge>
          );
        })}
        {filterDept !== "all" && <button onClick={() => setFilterDept("all")} className="text-xs text-muted-foreground underline">Clear</button>}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search employees..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20 text-xs text-muted-foreground uppercase tracking-wide">
              <th className="px-4 py-3 text-left font-medium">Employee</th>
              <th className="px-4 py-3 text-left font-medium">Department</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-right font-medium">Salary</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((emp) => (
              <tr key={emp.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{emp.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{emp.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-muted-foreground text-xs"><Building2 className="w-3 h-3" />{emp.department}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-sm">{emp.role}</td>
                <td className="px-4 py-3 text-right font-mono text-foreground">${Number(emp.salary).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-xs capitalize ${statusColors[emp.status] ?? ""}`}>{emp.status.replace("_", " ")}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{emp.joinDate}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => setEditTarget({ ...emp })}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id, emp.name)}
                      className="p-1.5 rounded text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
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
            {search || filterDept !== "all" ? "No employees match your filters." : "No employees found. Add one to get started."}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Employee</DialogTitle></DialogHeader>
          {editTarget && (
            <EmployeeForm
              initial={{
                employeeId: editTarget.employeeId,
                name: editTarget.name,
                email: editTarget.email,
                phone: editTarget.phone ?? "",
                department: editTarget.department,
                role: editTarget.role,
                salary: String(editTarget.salary),
                joinDate: editTarget.joinDate,
                status: editTarget.status,
                address: editTarget.address ?? "",
              }}
              onSubmit={handleEdit}
              loading={updateEmployee.isPending}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
