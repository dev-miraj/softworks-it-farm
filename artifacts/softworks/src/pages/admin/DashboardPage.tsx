import { Link } from "wouter";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  Users, Briefcase, Inbox, TrendingUp, DollarSign, Clock,
  CheckCircle, AlertCircle, Shield, KeyRound, Activity,
  ArrowRight, Bell, UserCheck, ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  useGetDashboardStats,
  useGetRecentLeads,
  useGetProjectSummary,
  useGetHrSummary,
} from "@workspace/api-client-react";

const API = import.meta.env.VITE_API_URL ?? "";

function useLicenseStats() {
  return useQuery({
    queryKey: ["license-stats"],
    queryFn: async () => { const r = await fetch(`${API}/api/license-stats`); return r.json(); },
  });
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400",
  contacted: "bg-yellow-500/10 text-yellow-400",
  converted: "bg-green-500/10 text-green-400",
  lost: "bg-red-500/10 text-red-400",
};

const quickLinks = [
  { href: "/admin/leads", label: "Leads", icon: Inbox, color: "text-blue-400" },
  { href: "/admin/licenses", label: "Licenses", icon: KeyRound, color: "text-violet-400" },
  { href: "/admin/employees", label: "Employees", icon: Users, color: "text-emerald-400" },
  { href: "/admin/projects", label: "Projects", icon: Briefcase, color: "text-amber-400" },
  { href: "/admin/leaves", label: "Leave Requests", icon: Clock, color: "text-orange-400" },
  { href: "/admin/payroll", label: "Payroll", icon: DollarSign, color: "text-green-400" },
];

export function DashboardPage() {
  const { data: stats } = useGetDashboardStats();
  const { data: recentLeads } = useGetRecentLeads();
  const { data: projectSummary } = useGetProjectSummary();
  const { data: hrSummary } = useGetHrSummary();
  const { data: licStats } = useLicenseStats();

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  const alerts: { label: string; value: number; href: string; color: string }[] = [];
  if ((stats?.pendingLeaves ?? 0) > 0)
    alerts.push({ label: "leave requests pending", value: stats!.pendingLeaves, href: "/admin/leaves", color: "text-yellow-400" });
  if ((stats?.newLeadsThisMonth ?? 0) > 0)
    alerts.push({ label: "new leads this month", value: stats!.newLeadsThisMonth, href: "/admin/leads", color: "text-blue-400" });
  if ((licStats?.overdue ?? 0) > 0)
    alerts.push({ label: "overdue license payments", value: licStats!.overdue, href: "/admin/license-payments", color: "text-red-400" });

  const statCards = [
    { icon: Users, label: "Clients", value: stats?.totalClients ?? 0, color: "text-primary", bg: "bg-primary/10", href: "/admin/clients" },
    { icon: Briefcase, label: "Active Projects", value: stats?.activeProjects ?? 0, color: "text-secondary", bg: "bg-secondary/10", href: "/admin/projects" },
    { icon: Users, label: "Employees", value: stats?.totalEmployees ?? 0, color: "text-accent", bg: "bg-accent/10", href: "/admin/employees" },
    { icon: Inbox, label: "Total Leads", value: stats?.totalLeads ?? 0, color: "text-chart-4", bg: "bg-chart-4/10", href: "/admin/leads" },
    { icon: Clock, label: "Pending Leaves", value: stats?.pendingLeaves ?? 0, color: "text-yellow-400", bg: "bg-yellow-400/10", href: "/admin/leaves" },
    { icon: DollarSign, label: "Monthly Payroll", value: stats ? `$${(stats.monthlyRevenue / 1000).toFixed(1)}k` : "$0", color: "text-green-400", bg: "bg-green-400/10", href: "/admin/payroll" },
    { icon: CheckCircle, label: "Completed", value: stats?.projectsCompleted ?? 0, color: "text-teal-400", bg: "bg-teal-400/10", href: "/admin/projects" },
    { icon: TrendingUp, label: "New Leads/Mo", value: stats?.newLeadsThisMonth ?? 0, color: "text-purple-400", bg: "bg-purple-400/10", href: "/admin/leads" },
  ];

  const licenseCards = [
    { icon: Shield, label: "Active Licenses", value: licStats?.active ?? 0, color: "text-emerald-400", bg: "bg-emerald-400/10", href: "/admin/licenses" },
    { icon: KeyRound, label: "Total Licenses", value: licStats?.totalLicenses ?? 0, color: "text-violet-400", bg: "bg-violet-400/10", href: "/admin/licenses" },
    { icon: Activity, label: "Activations", value: licStats?.totalActivations ?? 0, color: "text-blue-400", bg: "bg-blue-400/10", href: "/admin/license-activations" },
    { icon: DollarSign, label: "License Revenue", value: licStats ? `$${Number(licStats.totalRevenue ?? 0).toLocaleString()}` : "$0", color: "text-green-400", bg: "bg-green-400/10", href: "/admin/license-payments" },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{greeting}, Admin</p>
          <h1 className="text-3xl font-black text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Quick Links */}
        <div className="hidden lg:flex items-center gap-2 flex-wrap justify-end">
          {quickLinks.map(link => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted/40 hover:bg-muted/80 transition-colors ${link.color} cursor-pointer`}>
                  <Icon className="w-3 h-3" />
                  {link.label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      {alerts.length > 0 && (
        <div className="mb-6 flex flex-col gap-2">
          {alerts.map((alert, i) => (
            <Link key={i} href={alert.href}>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card/60 border border-white/8 hover:border-white/15 transition-all cursor-pointer group">
                <Bell className={`w-4 h-4 ${alert.color} flex-shrink-0`} />
                <span className="text-sm text-foreground">
                  <span className={`font-bold ${alert.color}`}>{alert.value}</span>{" "}
                  {alert.label}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Core Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <div className="gradient-border rounded-xl p-4 cursor-pointer hover:scale-[1.01] transition-transform">
                <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div className={`text-2xl font-black ${card.color} mb-0.5`}>{card.value}</div>
                <div className="text-xs text-muted-foreground font-medium">{card.label}</div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* License System Stats */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">License Management</h2>
          <Link href="/admin/license-dashboard">
            <span className="ml-auto text-xs text-primary flex items-center gap-1 hover:underline">
              View Dashboard <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {licenseCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.label} href={card.href}>
                <div className="rounded-xl p-4 bg-card/60 border border-white/8 hover:border-violet-500/30 cursor-pointer hover:scale-[1.01] transition-all">
                  <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <div className={`text-2xl font-black ${card.color} mb-0.5`}>{card.value}</div>
                  <div className="text-xs text-muted-foreground font-medium">{card.label}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Leads */}
        <div className="lg:col-span-2 gradient-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">Recent Leads</h2>
            <Link href="/admin/leads">
              <span className="text-xs text-primary flex items-center gap-1 hover:underline">All Leads <ArrowRight className="w-3 h-3" /></span>
            </Link>
          </div>
          <div className="flex flex-col gap-2">
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
              <p className="text-sm text-muted-foreground text-center py-8">No leads yet</p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Project Status */}
          <div className="gradient-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground">Projects</h2>
              <Link href="/admin/projects">
                <span className="text-xs text-primary flex items-center gap-1 hover:underline">View <ArrowRight className="w-3 h-3" /></span>
              </Link>
            </div>
            {projectSummary && (
              <div className="flex flex-col gap-3">
                {[
                  { label: "Active", value: projectSummary.active, color: "bg-primary", textColor: "text-primary" },
                  { label: "Completed", value: projectSummary.completed, color: "bg-green-500", textColor: "text-green-400" },
                  { label: "On Hold", value: projectSummary.onHold, color: "bg-yellow-500", textColor: "text-yellow-400" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className={`font-medium ${item.textColor}`}>{item.label}</span>
                      <span className="text-muted-foreground">{item.value} / {projectSummary.total}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: projectSummary.total > 0 ? `${(item.value / projectSummary.total) * 100}%` : "0%" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HR Overview */}
          <div className="gradient-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground">HR Overview</h2>
              <Link href="/admin/employees">
                <span className="text-xs text-primary flex items-center gap-1 hover:underline">View <ArrowRight className="w-3 h-3" /></span>
              </Link>
            </div>
            {hrSummary && (
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Total</span>
                  <span className="font-bold text-foreground">{hrSummary.totalEmployees}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" />Present Today</span>
                  <span className="font-bold text-primary">{hrSummary.presentToday}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-yellow-400" />Pending Leaves</span>
                  <span className="font-bold text-yellow-400">{hrSummary.pendingLeaves}</span>
                </div>
                {hrSummary.byDepartment.length > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <div className="text-xs text-muted-foreground mb-2">By Department</div>
                    {hrSummary.byDepartment.slice(0, 4).map((dept) => (
                      <div key={dept.department} className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">{dept.department}</span>
                        <span className="text-foreground font-medium">{dept.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
