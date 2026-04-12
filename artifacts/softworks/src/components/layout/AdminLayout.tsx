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
  KeyRound,
  CreditCard,
  Package,
  Activity,
  ScrollText,
  Shield,
  ChevronRight,
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
  {
    title: "License System",
    links: [
      { href: "/admin/license-dashboard", label: "License Dashboard", icon: Shield },
      { href: "/admin/licenses", label: "License Manager", icon: KeyRound },
      { href: "/admin/license-products", label: "Products", icon: Package },
      { href: "/admin/license-activations", label: "Activations", icon: Activity },
      { href: "/admin/license-payments", label: "Payments", icon: CreditCard },
      { href: "/admin/license-logs", label: "Audit Logs", icon: ScrollText },
      { href: "/admin/payment-methods", label: "Payment Methods", icon: CreditCard },
    ],
  },
  {
    title: "Settings",
    links: [
      { href: "/admin/api-keys", label: "API Keys", icon: KeyRound },
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

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/8">
        <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
          <Terminal className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <div className="text-sm font-black text-foreground tracking-tight leading-none">SOFTWORKS</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] mt-0.5">IT Farm Admin</div>
        </div>
      </div>

      {/* Nav sections — scrollable */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {sidebarSections.map((section) => (
          <div key={section.title} className="mb-1">
            <div className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.18em] px-3 py-2">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.links.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-sm ${
                      active
                        ? "bg-primary/12 text-primary"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        active ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground"
                      }`}
                    />
                    <span className="flex-1 font-medium leading-none">{link.label}</span>
                    {active && (
                      <ChevronRight className="w-3 h-3 text-primary/70" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4 pt-2 border-t border-white/8 space-y-0.5">
        <Link href="/" target="_blank">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-150">
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
            <span>View Live Site</span>
          </button>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150"
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    /* Root: full viewport height, no overflow — prevents page-level scroll */
    <div className="h-screen overflow-hidden bg-background flex">

      {/* ── Desktop Sidebar — fixed height, never scrolls with content ── */}
      <aside className="hidden md:flex w-60 flex-shrink-0 flex-col bg-card/60 border-r border-white/8 h-full backdrop-blur-xl">
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay ── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-card border-r border-white/8 transform transition-transform duration-200 ease-out md:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* ── Main area: takes remaining width, scrolls independently ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex-shrink-0 flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-xl border-b border-white/8">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Terminal className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-black text-primary tracking-tight">SOFTWORKS</span>
          </Link>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/8 transition-colors"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
          </button>
        </header>

        {/* Page content — only this div scrolls */}
        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
