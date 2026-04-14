import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Flag, Plus, ToggleLeft, ToggleRight, Pencil, Trash2, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL ?? "";

interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  allowedPlans: string | null;
  allowedTenants: string | null;
  createdAt: string;
  updatedAt: string;
}

const PLAN_OPTIONS = ["free", "pro", "enterprise"];

function FlagModal({ flag, onClose, onSave }: {
  flag?: FeatureFlag; onClose: () => void;
  onSave: (data: Partial<FeatureFlag>) => void;
}) {
  const [form, setForm] = useState({
    key: flag?.key ?? "",
    name: flag?.name ?? "",
    description: flag?.description ?? "",
    isEnabled: flag?.isEnabled ?? false,
    allowedPlans: flag?.allowedPlans ?? "free,pro,enterprise",
    allowedTenants: flag?.allowedTenants ?? "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">{flag ? "Edit" : "New"} Feature Flag</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Key *</label>
            <input
              value={form.key}
              onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toLowerCase().replace(/\s+/g, "_") }))}
              disabled={!!flag}
              placeholder="feature_key"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-violet-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Feature display name"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Allowed Plans</label>
            <div className="flex flex-wrap gap-2">
              {PLAN_OPTIONS.map((plan) => {
                const current = (form.allowedPlans ?? "").split(",").map((s) => s.trim()).filter(Boolean);
                const checked = current.includes(plan);
                return (
                  <button
                    key={plan}
                    onClick={() => {
                      const next = checked
                        ? current.filter((p) => p !== plan)
                        : [...current, plan];
                      setForm((f) => ({ ...f, allowedPlans: next.join(",") }));
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                      checked
                        ? "bg-violet-500/30 border-violet-500 text-violet-300"
                        : "bg-white/5 border-white/10 text-muted-foreground"
                    }`}
                  >
                    {plan}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Allowed Tenants (comma-separated slugs)</label>
            <input
              value={form.allowedTenants}
              onChange={(e) => setForm((f) => ({ ...f, allowedTenants: e.target.value }))}
              placeholder="tenant1,tenant2 (leave blank for all)"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-violet-500"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isEnabled}
              onChange={(e) => setForm((f) => ({ ...f, isEnabled: e.target.checked }))}
              className="hidden"
            />
            {form.isEnabled
              ? <ToggleRight className="h-7 w-7 text-emerald-400" />
              : <ToggleLeft className="h-7 w-7 text-slate-500" />}
            <span className="text-sm text-foreground">Enabled by default</span>
          </label>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg py-2.5 text-sm border border-white/10 text-muted-foreground hover:border-white/20 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 rounded-lg py-2.5 text-sm bg-violet-500 text-white font-semibold hover:bg-violet-600 transition flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function FeatureFlagsAdminPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; flag?: FeatureFlag }>({ open: false });

  const { data, isLoading } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const r = await fetch(`${API}/api/feature-flags`, { credentials: "include" });
      return r.json() as Promise<{ success: boolean; data: FeatureFlag[] }>;
    },
  });

  const upsert = useMutation({
    mutationFn: async (body: Partial<FeatureFlag>) => {
      const r = await fetch(`${API}/api/feature-flags`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Failed to save");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feature-flags"] });
      setModal({ open: false });
      toast({ title: "Feature flag saved" });
    },
  });

  const toggle = useMutation({
    mutationFn: async (key: string) => {
      const r = await fetch(`${API}/api/feature-flags/${key}/toggle`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feature-flags"] }),
  });

  const del = useMutation({
    mutationFn: async (key: string) => {
      const r = await fetch(`${API}/api/feature-flags/${key}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feature-flags"] });
      toast({ title: "Feature flag deleted" });
    },
  });

  const flags = data?.data ?? [];

  return (
    <AdminLayout>
      {modal.open && (
        <FlagModal
          flag={modal.flag}
          onClose={() => setModal({ open: false })}
          onSave={(d) => upsert.mutate(d)}
        />
      )}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Flag className="h-6 w-6 text-violet-400" /> Feature Flags
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Enable or disable features per plan and tenant</p>
          </div>
          <button
            onClick={() => setModal({ open: true })}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-violet-500 text-white font-semibold hover:bg-violet-600 transition"
          >
            <Plus className="h-4 w-4" /> New Flag
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : flags.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Flag className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No feature flags yet</p>
            <button onClick={() => setModal({ open: true })} className="mt-4 text-sm text-violet-400 hover:underline">
              Create your first flag
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3">Flag</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Plans</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {flags.map((f) => (
                  <tr key={f.key} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-violet-300">{f.key}</p>
                      <p className="text-foreground text-sm font-medium">{f.name}</p>
                      {f.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{f.description}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(f.allowedPlans ?? "").split(",").filter(Boolean).map((p) => (
                          <span key={p} className="px-1.5 py-0.5 rounded text-xs bg-violet-500/20 text-violet-300">{p}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggle.mutate(f.key)}
                        disabled={toggle.isPending}
                        className="transition"
                      >
                        {f.isEnabled
                          ? <ToggleRight className="h-6 w-6 text-emerald-400 mx-auto" />
                          : <ToggleLeft className="h-6 w-6 text-slate-500 mx-auto" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setModal({ open: true, flag: f })}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete flag "${f.key}"?`)) del.mutate(f.key); }}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
