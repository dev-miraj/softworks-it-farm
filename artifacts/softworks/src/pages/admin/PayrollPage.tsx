import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useListPayroll, useCreatePayrollRecord, useListEmployees } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, DollarSign, User } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-400/20",
  paid: "bg-green-500/10 text-green-600 border-green-400/20",
  processing: "bg-blue-500/10 text-blue-600 border-blue-400/20",
};

const thisMonth = new Date().toISOString().slice(0, 7);
const blankForm = { employeeId: "", month: thisMonth, basicSalary: "", bonus: "0", deductions: "0", status: "pending" };

export function PayrollPage() {
  const [filterMonth, setFilterMonth] = useState(thisMonth);
  const { data: payroll, isLoading, queryKey } = useListPayroll(filterMonth ? { month: filterMonth } : undefined);
  const { data: employees } = useListEmployees();
  const createPayroll = useCreatePayrollRecord();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankForm);

  const employeeMap = Object.fromEntries((employees ?? []).map(e => [e.id, e]));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const basic = Number(form.basicSalary);
    const bonus = Number(form.bonus);
    const deductions = Number(form.deductions);
    const selectedEmp = employees?.find(emp => String(emp.id) === form.employeeId);
    await createPayroll.mutateAsync({
      data: {
        employeeId: Number(form.employeeId),
        month: form.month,
        basicSalary: String(basic),
        bonus: String(bonus),
        deductions: String(deductions),
        netSalary: String(basic + bonus - deductions),
        status: form.status,
      }
    });
    await qc.invalidateQueries({ queryKey });
    setOpen(false);
    setForm(blankForm);
  };

  const totalNet = payroll?.reduce((sum, p) => sum + Number(p.netSalary), 0) ?? 0;

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">Payroll</h1>
          <p className="text-muted-foreground text-sm">Manage employee salaries and disbursements</p>
        </div>
        <div className="flex items-center gap-3">
          <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-40" />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Add Record</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add Payroll Record</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <Label>Employee *</Label>
                    <Select required value={form.employeeId} onValueChange={val => {
                      const emp = employees?.find(e => String(e.id) === val);
                      setForm({ ...form, employeeId: val, basicSalary: emp ? String(emp.salary) : "" });
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                      <SelectContent>
                        {employees?.map(emp => (
                          <SelectItem key={emp.id} value={String(emp.id)}>{emp.name} — {emp.role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2"><Label>Month *</Label><Input required type="month" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} /></div>
                  <div className="flex flex-col gap-1.5"><Label>Basic Salary *</Label><Input required type="number" value={form.basicSalary} onChange={e => setForm({ ...form, basicSalary: e.target.value })} /></div>
                  <div className="flex flex-col gap-1.5"><Label>Bonus</Label><Input type="number" value={form.bonus} onChange={e => setForm({ ...form, bonus: e.target.value })} /></div>
                  <div className="flex flex-col gap-1.5"><Label>Deductions</Label><Input type="number" value={form.deductions} onChange={e => setForm({ ...form, deductions: e.target.value })} /></div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Status</Label>
                    <Select defaultValue="pending" onValueChange={val => setForm({ ...form, status: val })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {form.basicSalary && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
                    <span className="text-muted-foreground">Net Salary: </span>
                    <span className="font-bold text-primary">${(Number(form.basicSalary) + Number(form.bonus) - Number(form.deductions)).toLocaleString()}</span>
                  </div>
                )}
                <Button type="submit" disabled={createPayroll.isPending || !form.employeeId}>{createPayroll.isPending ? "Adding..." : "Add Record"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {payroll && payroll.length > 0 && (
        <div className="flex items-center gap-2 mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <DollarSign className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">Total Net Payroll:</span>
          <span className="font-black text-primary text-lg">${totalNet.toLocaleString()}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                <th className="pb-3 text-left font-medium">Employee</th>
                <th className="pb-3 text-left font-medium">Month</th>
                <th className="pb-3 text-right font-medium">Basic</th>
                <th className="pb-3 text-right font-medium">Bonus</th>
                <th className="pb-3 text-right font-medium">Deductions</th>
                <th className="pb-3 text-right font-medium">Net Salary</th>
                <th className="pb-3 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payroll?.map((p) => {
                const emp = employeeMap[p.employeeId];
                return (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{emp?.name ?? `Employee #${p.employeeId}`}</div>
                          <div className="text-xs text-muted-foreground">{emp?.role ?? ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{p.month}</td>
                    <td className="py-3 pr-4 text-right font-mono">${Number(p.basicSalary).toLocaleString()}</td>
                    <td className="py-3 pr-4 text-right font-mono text-green-600">+${Number(p.bonus).toLocaleString()}</td>
                    <td className="py-3 pr-4 text-right font-mono text-red-500">-${Number(p.deductions).toLocaleString()}</td>
                    <td className="py-3 pr-4 text-right font-mono font-bold text-foreground">${Number(p.netSalary).toLocaleString()}</td>
                    <td className="py-3 text-center">
                      <Badge variant="outline" className={`text-xs capitalize ${statusColors[p.status] ?? ""}`}>{p.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(!payroll || payroll.length === 0) && (
            <div className="text-center py-16 text-muted-foreground">No payroll records found.</div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
