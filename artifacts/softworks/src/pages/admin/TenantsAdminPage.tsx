import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  Building2, Plus, Pencil, Crown, Zap, Shield, Globe, User, X, Save,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL ?? "";

interface Tenant {
  id: number;
  slug: string;
  name: string;
  ownerId: string;
  plan: string;
  customDomain: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PLAN_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  free:       { icon: Shield, color: "text-slate-400",  bg: "bg-slate-400/10" },
  pro:        { icon: Zap,    color: "text-blue-400",   bg: "bg-blue-400/10" },
  enterprise: { icon: Crown,  color: "text-amber-400",  bg: "bg-amber-400/10" },
};

function TenantModal({ tenant, onClose, onSave }: {
  tenant?: Tenant; onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    slug: tenant?.slug ?? "",
    name: tenant?.name ?? "",
    ownerId: tenant?.ownerId ?? "",
    plan: tenant?.plan ?? "free",
    customDomain: tenant?.customDomain ?? "",
    isActive: tenant?.isActive ?? true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">{tenant ? "Edit Tenant" : "New Tenant"}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Slug *</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
              disabled={!!tenant}
              placeholder="my-company"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="My Company Ltd"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Owner ID *</label>
            <input
              value={form.ownerId}
              onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
              placeholder="admin"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Custom Domain</label>
            <input
              value={form.customDomain}
              onChange={(e) => setForm((f) => ({ ...f, customDomain: e.target.value }))}
              placeholder="app.mycompany.com"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Plan</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PLAN_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setForm((f) => ({ ...f, plan: key }))}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border text-xs font-semibold transition ${
                      form.plan === key
                        ? `${cfg.bg} ${cfg.color} border-current`
                        : "bg-white/5 border-white/10 text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />{key}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="hidden" />
            <div className={`w-10 h-5 rounded-full transition ${form.isActive ? "bg-emerald-500" : "bg-slate-600"} relative`}>
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${form.isActive ? "left-5" : "left-0.5"}`} />
            </div>
            <span className="text-sm text-foreground">Active</span>
          </label>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm border border-white/10 text-muted-foreground">Cancel</button>
          <button
            onClick={() => onSave({ ...form, customDomain: form.customDomain || null })}
            className="flex-1 py-2.5 rounded-lg text-sm bg-teal-500 text-white font-semibold hover:bg-teal-600 flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function TenantsAdminPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; tenant?: Tenant }>({ open: false });

  const { data, isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const r = await fetch(`${API}/api/tenants`, { credentials: "include" });
      return r.json() as Promise<{ success: boolean; data: Tenant[] }>;
    },
  });

  const create = useMutation({
    mutationFn: async (body: any) => {
      const r = await fetch(`${API}/api/tenants`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      setModal({ open: false });
      toast({ title: "Tenant created" });
    },
    onError: () => toast({ title: "Failed to create tenant", variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...body }: any) => {
      const r = await fetch(`${API}/api/tenants/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      setModal({ open: false });
      toast({ title: "Tenant updated" });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const tenants = data?.data ?? [];

  return (
    <AdminLayout>
      {modal.open && (
        <TenantModal
          tenant={modal.tenant}
          onClose={() => setModal({ open: false })}
          onSave={(d) => modal.tenant ? update.mutate({ id: modal.tenant.id, ...d }) : create.mutate(d)}
        />
      )}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-6 w-6 text-teal-400" /> Tenants
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage organizations and multi-tenant configuration</p>
          </div>
          <button
            onClick={() => setModal({ open: true })}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 transition"
          >
            <Plus className="h-4 w-4" /> New Tenant
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No tenants configured</p>
            <button onClick={() => setModal({ open: true })} className="mt-4 text-sm text-teal-400 hover:underline">
              Create your first tenant
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenants.map((t) => {
              const planCfg = PLAN_CONFIG[t.plan] ?? PLAN_CONFIG.free;
              const PlanIcon = planCfg.icon;
              return (
                <div key={t.id} className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-foreground">{t.name}</p>
                      <p className="text-xs font-mono text-muted-foreground">{t.slug}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${planCfg.bg} ${planCfg.color}`}>
                      <PlanIcon className="h-3 w-3" />{t.plan}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      <span>Owner: <span className="text-foreground">{t.ownerId}</span></span>
                    </div>
                    {t.customDomain && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5" />
                        <span className="text-foreground">{t.customDomain}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.isActive ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                      {t.isActive ? "Active" : "Inactive"}
                    </span>
                    <button
                      onClick={() => setModal({ open: true, tenant: t })}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/10 text-muted-foreground hover:text-foreground hover:bg-white/15 transition"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
