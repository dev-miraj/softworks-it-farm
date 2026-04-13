import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useListEmployees, useListPayroll, useListLeads,
  useListClients, useListProjects, useListLeaveRequests,
} from "@workspace/api-client-react";
import { Download, FileText, Users, DollarSign, Inbox, Briefcase, Calendar, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { API } from "@/lib/apiUrl";

function useLicenses() {
  return useQuery({ queryKey: ["licenses-all"], queryFn: async () => { const r = await fetch(`${API}/api/licenses`); return r.json(); } });
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const header = keys.join(",");
  const body = rows.map(row =>
    keys.map(k => {
      const v = row[k];
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g, '""');
      return s.includes(",") || s.includes("\n") || s.includes('"') ? `"${s}"` : s;
    }).join(",")
  ).join("\n");
  return `${header}\n${body}`;
}

function downloadCSV(filename: string, data: Record<string, unknown>[]) {
  const csv = toCSV(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function ReportCard({
  icon: Icon, title, description, color, bg, count, filename, getData, filterControls,
}: {
  icon: React.ElementType; title: string; description: string;
  color: string; bg: string; count: number; filename: string;
  getData: () => Record<string, unknown>[];
  filterControls?: React.ReactNode;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const data = getData();
      if (!data.length) { alert("No data to export."); return; }
      downloadCSV(filename, data);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="gradient-border rounded-xl p-5">
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          <div className={`text-xs font-bold mt-1 ${color}`}>{count} records</div>
        </div>
      </div>
      {filterControls && <div className="mb-4">{filterControls}</div>}
      <Button
        onClick={handleDownload}
        disabled={downloading || count === 0}
        size="sm"
        className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 transition-all"
      >
        <Download className="w-3.5 h-3.5 mr-2" />
        {downloading ? "Preparing..." : `Export CSV`}
      </Button>
    </div>
  );
}

export function ReportsPage() {
  const { data: employees } = useListEmployees();
  const { data: leads } = useListLeads();
  const { data: clients } = useListClients();
  const { data: projects } = useListProjects();
  const { data: leaves } = useListLeaveRequests();
  const { data: licenses } = useLicenses();
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7));
  const { data: payroll } = useListPayroll(payrollMonth ? { month: payrollMonth } : undefined);

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground mb-1">Reports & Exports</h1>
        <p className="text-muted-foreground text-sm">Download data as CSV for further analysis or record keeping</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ReportCard
          icon={Users}
          title="Employees"
          description="Full employee list with salary, department, and status"
          color="text-emerald-400"
          bg="bg-emerald-400/10"
          count={employees?.length ?? 0}
          filename={`employees_${new Date().toISOString().slice(0,10)}.csv`}
          getData={() => (employees ?? []).map(e => ({
            id: e.id, employee_id: e.employeeId, name: e.name, email: e.email,
            phone: e.phone, department: e.department, role: e.role,
            salary: e.salary, join_date: e.joinDate, status: e.status, address: e.address,
          }))}
        />

        <ReportCard
          icon={DollarSign}
          title="Payroll"
          description="Salary disbursements for selected month"
          color="text-green-400"
          bg="bg-green-400/10"
          count={payroll?.length ?? 0}
          filename={`payroll_${payrollMonth}.csv`}
          filterControls={
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Month:</label>
              <Input type="month" value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)} className="h-7 text-xs flex-1" />
            </div>
          }
          getData={() => {
            const empMap = Object.fromEntries((employees ?? []).map(e => [e.id, e]));
            return (payroll ?? []).map(p => ({
              employee_name: empMap[p.employeeId]?.name ?? `#${p.employeeId}`,
              employee_id: empMap[p.employeeId]?.employeeId ?? "",
              department: empMap[p.employeeId]?.department ?? "",
              month: p.month,
              basic_salary: p.basicSalary,
              bonus: p.bonus,
              deductions: p.deductions,
              net_salary: p.netSalary,
              status: p.status,
            }));
          }}
        />

        <ReportCard
          icon={Inbox}
          title="Leads"
          description="All contact form submissions and inquiries"
          color="text-blue-400"
          bg="bg-blue-400/10"
          count={leads?.length ?? 0}
          filename={`leads_${new Date().toISOString().slice(0,10)}.csv`}
          getData={() => (leads ?? []).map(l => ({
            name: l.name, email: l.email, phone: l.phone, company: l.company,
            service: l.service, message: l.message, status: l.status,
            created_at: new Date(l.createdAt).toLocaleDateString(),
          }))}
        />

        <ReportCard
          icon={Users}
          title="Clients"
          description="Client database with contact and project info"
          color="text-violet-400"
          bg="bg-violet-400/10"
          count={clients?.length ?? 0}
          filename={`clients_${new Date().toISOString().slice(0,10)}.csv`}
          getData={() => (clients ?? []).map(c => ({
            name: c.name, company: c.company, email: c.email, phone: c.phone,
            country: c.country, status: c.status, total_projects: c.totalProjects,
          }))}
        />

        <ReportCard
          icon={Briefcase}
          title="Projects"
          description="All projects with status, budget, and progress"
          color="text-amber-400"
          bg="bg-amber-400/10"
          count={projects?.length ?? 0}
          filename={`projects_${new Date().toISOString().slice(0,10)}.csv`}
          getData={() => (projects ?? []).map(p => ({
            name: p.name, client: p.clientName, status: p.status, priority: p.priority,
            budget: p.budget, progress: `${p.progress}%`,
            start_date: p.startDate, end_date: p.endDate,
            technologies: (p.technologies ?? []).join("; "),
          }))}
        />

        <ReportCard
          icon={Calendar}
          title="Leave Requests"
          description="All employee leave requests with status"
          color="text-orange-400"
          bg="bg-orange-400/10"
          count={leaves?.length ?? 0}
          filename={`leave_requests_${new Date().toISOString().slice(0,10)}.csv`}
          getData={() => {
            const empMap = Object.fromEntries((employees ?? []).map(e => [e.id, e]));
            return (leaves ?? []).map(l => ({
              employee_name: empMap[l.employeeId]?.name ?? `#${l.employeeId}`,
              department: empMap[l.employeeId]?.department ?? "",
              type: l.type, start_date: l.startDate, end_date: l.endDate,
              reason: l.reason, status: l.status, approved_by: l.approvedBy ?? "",
            }));
          }}
        />

        <ReportCard
          icon={Shield}
          title="Licenses"
          description="All software licenses with client and status"
          color="text-primary"
          bg="bg-primary/10"
          count={licenses?.length ?? 0}
          filename={`licenses_${new Date().toISOString().slice(0,10)}.csv`}
          getData={() => (licenses ?? []).map((l: Record<string, unknown>) => ({
            license_key: l.licenseKey, product: (l.metadata as Record<string, unknown>)?.productName ?? "",
            client: l.clientName, email: l.clientEmail, plan: l.plan,
            type: l.licenseType, status: l.status,
            issued_at: l.issuedAt ? new Date(l.issuedAt as string).toLocaleDateString() : "",
            expires_at: l.expiresAt ? new Date(l.expiresAt as string).toLocaleDateString() : "Lifetime",
          }))}
        />
      </div>

      <div className="mt-8 p-4 rounded-xl bg-muted/30 border border-white/8">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Export Notes</span>
        </div>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>CSV files can be opened in Excel, Google Sheets, or any spreadsheet app</li>
          <li>Payroll export is filtered by the selected month above</li>
          <li>All timestamps are in your local timezone</li>
          <li>License keys are included — share with caution</li>
        </ul>
      </div>
    </AdminLayout>
  );
}
