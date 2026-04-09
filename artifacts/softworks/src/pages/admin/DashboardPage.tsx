import { AdminLayout } from "@/components/layout/AdminLayout";
import { Users, Briefcase, Inbox, TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle } from "lucide-react";
import {
  useGetDashboardStats,
  useGetRecentLeads,
  useGetProjectSummary,
  useGetHrSummary,
} from "@workspace/api-client-react";

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400",
  contacted: "bg-yellow-500/10 text-yellow-400",
  converted: "bg-green-500/10 text-green-400",
  lost: "bg-red-500/10 text-red-400",
};

export function DashboardPage() {
  const { data: stats } = useGetDashboardStats();
  const { data: recentLeads } = useGetRecentLeads();
  const { data: projectSummary } = useGetProjectSummary();
  const { data: hrSummary } = useGetHrSummary();

  const statCards = [
    { icon: Users, label: "Total Clients", value: stats?.totalClients ?? 0, color: "text-primary", bg: "bg-primary/10" },
    { icon: Briefcase, label: "Active Projects", value: stats?.activeProjects ?? 0, color: "text-secondary", bg: "bg-secondary/10" },
    { icon: Users, label: "Total Employees", value: stats?.totalEmployees ?? 0, color: "text-accent", bg: "bg-accent/10" },
    { icon: Inbox, label: "Total Leads", value: stats?.totalLeads ?? 0, color: "text-chart-4", bg: "bg-chart-4/10" },
    { icon: Clock, label: "Pending Leaves", value: stats?.pendingLeaves ?? 0, color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { icon: DollarSign, label: "Monthly Revenue", value: stats ? `$${(stats.monthlyRevenue / 1000).toFixed(1)}k` : "$0", color: "text-green-400", bg: "bg-green-400/10" },
    { icon: CheckCircle, label: "Completed", value: stats?.projectsCompleted ?? 0, color: "text-teal-400", bg: "bg-teal-400/10" },
    { icon: TrendingUp, label: "New Leads (Mo)", value: stats?.newLeadsThisMonth ?? 0, color: "text-purple-400", bg: "bg-purple-400/10" },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Platform overview and key metrics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="gradient-border rounded-xl p-5">
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className={`text-2xl font-black ${card.color} mb-1`}>{card.value}</div>
              <div className="text-xs text-muted-foreground font-medium">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 gradient-border rounded-xl p-6">
          <h2 className="font-bold text-foreground mb-4">Recent Leads</h2>
          <div className="flex flex-col gap-3">
            {recentLeads?.slice(0, 6).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div>
                  <div className="font-medium text-sm text-foreground">{lead.name}</div>
                  <div className="text-xs text-muted-foreground">{lead.email}{lead.company && ` · ${lead.company}`}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${statusColors[lead.status] ?? ""}`}>{lead.status}</span>
              </div>
            ))}
            {(!recentLeads || recentLeads.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-6">No leads yet</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="gradient-border rounded-xl p-6">
            <h2 className="font-bold text-foreground mb-4">Project Status</h2>
            {projectSummary && (
              <div className="flex flex-col gap-3">
                {[
                  { label: "Active", value: projectSummary.active, color: "bg-primary" },
                  { label: "Completed", value: projectSummary.completed, color: "bg-green-500" },
                  { label: "On Hold", value: projectSummary.onHold, color: "bg-yellow-500" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium text-foreground">{item.value}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: projectSummary.total > 0 ? `${(item.value / projectSummary.total) * 100}%` : "0%" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="gradient-border rounded-xl p-6">
            <h2 className="font-bold text-foreground mb-4">HR Overview</h2>
            {hrSummary && (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total</span><span className="font-bold text-foreground">{hrSummary.totalEmployees}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Active</span><span className="font-bold text-green-400">{hrSummary.activeEmployees}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Present Today</span><span className="font-bold text-primary">{hrSummary.presentToday}</span></div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><AlertCircle className="w-3 h-3 text-yellow-400" />Pending Leaves</span>
                  <span className="font-bold text-yellow-400">{hrSummary.pendingLeaves}</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-2">By Department</div>
                  {hrSummary.byDepartment.slice(0, 4).map((dept) => (
                    <div key={dept.department} className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{dept.department}</span>
                      <span className="text-foreground">{dept.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
