import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Briefcase,
  FolderOpen,
  FileText,
  MessageSquare,
  Users,
  Box,
  Inbox,
  UserPlus,
  Calendar,
  Clock,
  DollarSign,
  Menu,
  X,
  LogOut,
  Terminal,
  ExternalLink,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const sidebarSections = [
  {
    title: "Overview",
    links: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Site Content",
    links: [
      { href: "/admin/services", label: "Services", icon: Briefcase },
      { href: "/admin/portfolio", label: "Portfolio", icon: FolderOpen },
      { href: "/admin/saas-products", label: "SaaS Products", icon: Box },
      { href: "/admin/blog", label: "Blog Posts", icon: FileText },
      { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquare },
      { href: "/admin/team", label: "Team Members", icon: Users },
    ],
  },
  {
    title: "CRM",
    links: [
      { href: "/admin/leads", label: "Leads", icon: Inbox },
      { href: "/admin/clients", label: "Clients", icon: UserPlus },
      { href: "/admin/projects", label: "Projects", icon: FolderOpen },
    ],
  },
  {
    title: "HR System",
    links: [
      { href: "/admin/employees", label: "Employees", icon: Users },
      { href: "/admin/attendance", label: "Attendance", icon: Clock },
      { href: "/admin/leaves", label: "Leave Requests", icon: Calendar },
      { href: "/admin/payroll", label: "Payroll", icon: DollarSign },
    ],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout } = useAdminAuth();

  const isActive = (href: string) =>
    href === "/admin"
      ? location === "/admin"
      : location.startsWith(href);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <Link href="/admin" className="flex items-center gap-2 text-xl font-bold text-primary">
          <Terminal className="w-6 h-6" />
          <span>Admin Panel</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "flex" : "hidden"
        } md:flex w-full md:w-64 bg-card border-r border-border flex-col h-[calc(100vh-65px)] md:h-screen sticky top-0`}
      >
        {/* Logo */}
        <div className="p-5 hidden md:flex items-center gap-2 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-black text-primary tracking-tight">SOFTWORKS</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Admin Panel</div>
          </div>
        </div>

        {/* Nav sections */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-5">
          {sidebarSections.map((section) => (
            <div key={section.title}>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 px-3">
                {section.title}
              </div>
              <div className="flex flex-col gap-0.5">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                        active
                          ? "bg-primary/15 text-primary border border-primary/20"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-primary" : ""}`} />
                      {link.label}
                      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex flex-col gap-2">
          <Link href="/" target="_blank">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground text-xs">
              <ExternalLink className="w-3.5 h-3.5" />
              View Live Site
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-full">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
