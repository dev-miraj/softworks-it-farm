import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useListEmployees, useCreateEmployee, useDeleteEmployee } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Mail, Building2, Calendar } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-400 border-green-400/20",
  inactive: "bg-red-500/10 text-red-400 border-red-400/20",
  on_leave: "bg-yellow-500/10 text-yellow-400 border-yellow-400/20",
};

const DEPARTMENTS = ["Engineering", "Design", "Marketing", "Sales", "HR", "Management", "Finance", "Operations"];

export function EmployeesPage() {
  const { data: employees, isLoading, queryKey } = useListEmployees();
  const createEmployee = useCreateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", name: "", email: "", phone: "", department: "", role: "", salary: "", joinDate: "", status: "active", address: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEmployee.mutateAsync({ data: { ...form, salary: Number(form.salary) } });
    await qc.invalidateQueries({ queryKey });
    setOpen(false);
    setForm({ employeeId: "", name: "", email: "", phone: "", department: "", role: "", salary: "", joinDate: "", status: "active", address: "" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this employee?")) return;
    await deleteEmployee.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey });
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">Employees</h1>
          <p className="text-muted-foreground text-sm">Manage your team members</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Add Employee</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5"><Label>Employee ID *</Label><Input required value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} placeholder="EMP001" /></div>
                <div className="flex flex-col gap-1.5"><Label>Full Name *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Email *</Label><Input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5">
                  <Label>Department *</Label>
                  <Select required onValueChange={val => setForm({ ...form, department: val })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5"><Label>Role *</Label><Input required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Salary *</Label><Input required type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Join Date *</Label><Input required type="date" value={form.joinDate} onChange={e => setForm({ ...form, joinDate: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5">
                  <Label>Status</Label>
                  <Select defaultValue="active" onValueChange={val => setForm({ ...form, status: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5 col-span-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              </div>
              <Button type="submit" disabled={createEmployee.isPending}>{createEmployee.isPending ? "Adding..." : "Add Employee"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                <th className="pb-3 text-left font-medium">Employee</th>
                <th className="pb-3 text-left font-medium">Department</th>
                <th className="pb-3 text-left font-medium">Role</th>
                <th className="pb-3 text-left font-medium">Salary</th>
                <th className="pb-3 text-left font-medium">Status</th>
                <th className="pb-3 text-left font-medium">Joined</th>
                <th className="pb-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees?.map((emp) => (
                <tr key={emp.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-foreground">{emp.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{emp.email}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1 text-muted-foreground"><Building2 className="w-3 h-3" />{emp.department}</div>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{emp.role}</td>
                  <td className="py-3 pr-4 font-mono text-foreground">${Number(emp.salary).toLocaleString()}</td>
                  <td className="py-3 pr-4">
                    <Badge variant="outline" className={`text-xs capitalize ${statusColors[emp.status] ?? ""}`}>{emp.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{emp.joinDate}</td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7" onClick={() => handleDelete(emp.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!employees || employees.length === 0) && (
            <div className="text-center py-16 text-muted-foreground">No employees found. Add one to get started.</div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
