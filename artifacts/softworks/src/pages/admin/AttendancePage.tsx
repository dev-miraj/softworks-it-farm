import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListAttendance, useCreateAttendanceRecord, useListEmployees } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Clock, User } from "lucide-react";

const statusColors: Record<string, string> = {
  present: "bg-green-500/10 text-green-600 border-green-400/20",
  absent: "bg-red-500/10 text-red-600 border-red-400/20",
  late: "bg-yellow-500/10 text-yellow-600 border-yellow-400/20",
  half_day: "bg-blue-500/10 text-blue-600 border-blue-400/20",
};

const blankForm = { employeeId: "", date: new Date().toISOString().split("T")[0], checkIn: "", checkOut: "", status: "present", notes: "" };

export function AttendancePage() {
  const [filterEmployeeId, setFilterEmployeeId] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const params = {
    employeeId: filterEmployeeId ? Number(filterEmployeeId) : undefined,
    month: filterMonth || undefined,
  };
  const { data: attendance, queryKey } = useListAttendance(params);
  const { data: employees } = useListEmployees();
  const createAttendance = useCreateAttendanceRecord();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankForm);

  const employeeMap = Object.fromEntries((employees ?? []).map(e => [e.id, e]));
  const ALL = "__all__";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAttendance.mutateAsync({ data: { ...form, employeeId: Number(form.employeeId) } });
    await qc.invalidateQueries({ queryKey });
    setOpen(false);
    setForm(blankForm);
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">Attendance</h1>
          <p className="text-muted-foreground text-sm">Track employee attendance records</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={filterEmployeeId || ALL} onValueChange={val => setFilterEmployeeId(val === ALL ? "" : val)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Employees</SelectItem>
              {employees?.map(emp => (
                <SelectItem key={emp.id} value={String(emp.id)}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-40" />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Add Record</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add Attendance Record</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <Label>Employee *</Label>
                    <Select required value={form.employeeId} onValueChange={val => setForm({ ...form, employeeId: val })}>
                      <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                      <SelectContent>
                        {employees?.map(emp => (
                          <SelectItem key={emp.id} value={String(emp.id)}>{emp.name} — {emp.department}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2"><Label>Date *</Label><Input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                  <div className="flex flex-col gap-1.5"><Label>Check In</Label><Input type="time" value={form.checkIn} onChange={e => setForm({ ...form, checkIn: e.target.value })} /></div>
                  <div className="flex flex-col gap-1.5"><Label>Check Out</Label><Input type="time" value={form.checkOut} onChange={e => setForm({ ...form, checkOut: e.target.value })} /></div>
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <Label>Status</Label>
                    <Select defaultValue="present" onValueChange={val => setForm({ ...form, status: val })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="half_day">Half Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                </div>
                <Button type="submit" disabled={createAttendance.isPending || !form.employeeId}>{createAttendance.isPending ? "Adding..." : "Add Record"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                <th className="pb-3 text-left font-medium">Employee</th>
                <th className="pb-3 text-left font-medium">Department</th>
                <th className="pb-3 text-left font-medium">Date</th>
                <th className="pb-3 text-left font-medium">Check In</th>
                <th className="pb-3 text-left font-medium">Check Out</th>
                <th className="pb-3 text-left font-medium">Status</th>
                <th className="pb-3 text-left font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {attendance?.map((record) => {
                const emp = employeeMap[record.employeeId];
                return (
                  <tr key={record.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{emp?.name ?? `Employee #${record.employeeId}`}</div>
                          <div className="text-xs text-muted-foreground">{emp?.employeeId ?? ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{emp?.department ?? "—"}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{record.date}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{record.checkIn || "—"}</span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{record.checkOut || "—"}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className={`text-xs capitalize ${statusColors[record.status] ?? ""}`}>
                        {record.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground text-xs">{record.notes || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(!attendance || attendance.length === 0) && (
            <div className="text-center py-16 text-muted-foreground">No attendance records found.</div>
          )}
        </div>
    </AdminLayout>
  );
}
