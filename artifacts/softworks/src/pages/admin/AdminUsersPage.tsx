import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, KeyRound, UserCheck, UserX, Trash2, RefreshCw,
  Shield, User, Loader2, Eye, EyeOff, Database, Info
} from "lucide-react";

interface AdminUser {
  id: number;
  username: string;
  role: string;
  displayName: string | null;
  email: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export function AdminUsersPage() {
  const { csrfFetch, user: currentUser } = useAdminAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [newUser, setNewUser] = useState({
    username: "", password: "", role: "admin", displayName: "", email: ""
  });
  const [passChange, setPassChange] = useState<{ username: string; password: string } | null>(null);
  const [showPassChange, setShowPassChange] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await csrfFetch("/api/admin-users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data ?? []);
      } else {
        toast({ title: "Failed to load users", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleCreate() {
    if (!newUser.username || !newUser.password) {
      toast({ title: "Username and password are required", variant: "destructive" });
      return;
    }
    setActionLoading("create");
    try {
      const res = await csrfFetch("/api/admin-users", {
        method: "POST",
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: `User '${newUser.username}' created successfully` });
        setNewUser({ username: "", password: "", role: "admin", displayName: "", email: "" });
        setShowCreate(false);
        loadUsers();
      } else {
        toast({ title: data.error || "Failed to create user", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePasswordChange() {
    if (!passChange || passChange.password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setActionLoading("pass-" + passChange.username);
    try {
      const res = await csrfFetch(`/api/admin-users/${passChange.username}/password`, {
        method: "PATCH",
        body: JSON.stringify({ password: passChange.password }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: data.message });
        setPassChange(null);
        setShowPassChange(false);
      } else {
        toast({ title: data.error || "Failed to update password", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleStatus(username: string, isActive: boolean) {
    setActionLoading("status-" + username);
    try {
      const res = await csrfFetch(`/api/admin-users/${username}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: data.message });
        loadUsers();
      } else {
        toast({ title: data.error || "Failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(username: string) {
    if (!confirm(`Delete user '${username}'? This cannot be undone.`)) return;
    setActionLoading("delete-" + username);
    try {
      const res = await csrfFetch(`/api/admin-users/${username}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast({ title: data.message });
        loadUsers();
      } else {
        toast({ title: data.error || "Failed to delete", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Database className="w-6 h-6 text-indigo-400" /> Admin Users
            </h1>
            <p className="text-white/40 text-sm mt-1">
              সকল admin credentials database-এ bcrypt hash করে store হয়।
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline"
              className="border-white/15 text-white/60 hover:text-white"
              onClick={loadUsers} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setShowCreate(s => !s)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> New User
            </Button>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-blue-200/70 text-xs">
            <p className="font-semibold text-blue-300 mb-1">DB-backed Authentication</p>
            <p>Database-এ user থাকলে সেটা ব্যবহার হবে। না থাকলে .env-এর <code className="bg-black/30 text-blue-300 px-1 rounded">ADMIN_USERNAME</code> ও <code className="bg-black/30 text-blue-300 px-1 rounded">ADMIN_PASSWORD</code> fallback হিসেবে কাজ করবে।
            Vercel-এ প্রথমবার login করতে <strong>এখানে user তৈরি করে তারপর deploy করুন</strong>, অথবা env vars দিয়ে login করে user তৈরি করুন।</p>
          </div>
        </div>

        {showCreate && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" /> Create New Admin User
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/40 text-xs mb-1 block">Username *</Label>
                <Input value={newUser.username}
                  onChange={e => setNewUser(u => ({ ...u, username: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="johndoe" />
              </div>
              <div>
                <Label className="text-white/40 text-xs mb-1 block">Role</Label>
                <select value={newUser.role}
                  onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
                  className="w-full h-10 rounded-md bg-white/5 border border-white/10 text-white text-sm px-3">
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div>
                <Label className="text-white/40 text-xs mb-1 block">Password * (min 8 chars)</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white pr-10"
                    placeholder="••••••••" />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    onClick={() => setShowPassword(s => !s)} type="button">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-white/40 text-xs mb-1 block">Display Name</Label>
                <Input value={newUser.displayName}
                  onChange={e => setNewUser(u => ({ ...u, displayName: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="John Doe" />
              </div>
              <div className="col-span-2">
                <Label className="text-white/40 text-xs mb-1 block">Email</Label>
                <Input type="email" value={newUser.email}
                  onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="john@example.com" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCreate} disabled={actionLoading === "create"}
                className="bg-indigo-600 hover:bg-indigo-700">
                {actionLoading === "create" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Create User
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}
                className="border-white/15 text-white/60 hover:text-white">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {passChange && (
          <div className="bg-white/5 border border-yellow-400/20 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-yellow-400" /> Change Password — {passChange.username}
            </h2>
            <div className="relative">
              <Input type={showPassChange ? "text" : "password"}
                value={passChange.password}
                onChange={e => setPassChange(p => p ? { ...p, password: e.target.value } : null)}
                className="bg-white/5 border-white/10 text-white pr-10"
                placeholder="New password (min 8 chars)" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                onClick={() => setShowPassChange(s => !s)} type="button">
                {showPassChange ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex gap-3">
              <Button onClick={handlePasswordChange}
                disabled={actionLoading === `pass-${passChange.username}`}
                className="bg-yellow-600 hover:bg-yellow-700">
                {actionLoading === `pass-${passChange.username}`
                  ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  : <KeyRound className="w-4 h-4 mr-2" />}
                Update Password
              </Button>
              <Button variant="outline" onClick={() => setPassChange(null)}
                className="border-white/15 text-white/60 hover:text-white">
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <Database className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No users in database yet.</p>
              <p className="text-white/25 text-xs mt-1">
                Currently using .env fallback credentials. Create a DB user above to switch.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="text-left text-white/40 text-xs font-medium px-4 py-3">User</th>
                  <th className="text-left text-white/40 text-xs font-medium px-4 py-3">Role</th>
                  <th className="text-left text-white/40 text-xs font-medium px-4 py-3">Status</th>
                  <th className="text-left text-white/40 text-xs font-medium px-4 py-3">Last Login</th>
                  <th className="text-right text-white/40 text-xs font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                          <User className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {u.username}
                            {u.username === currentUser?.username && (
                              <span className="ml-1.5 text-xs text-indigo-400">(you)</span>
                            )}
                          </p>
                          {u.displayName && <p className="text-white/40 text-xs">{u.displayName}</p>}
                          {u.email && <p className="text-white/30 text-xs">{u.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        u.role === "admin"
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          : u.role === "manager"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-white/10 text-white/50 border border-white/20"
                      }`}>
                        <Shield className="w-3 h-3" />
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        u.isActive
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                      }`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setPassChange({ username: u.username, password: "" }); setShowPassChange(false); }}
                          className="p-1.5 rounded text-white/40 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                          title="Change Password">
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        {u.username !== currentUser?.username && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(u.username, !u.isActive)}
                              disabled={actionLoading === `status-${u.username}`}
                              className="p-1.5 rounded text-white/40 hover:text-green-400 hover:bg-green-400/10 transition-colors"
                              title={u.isActive ? "Deactivate" : "Activate"}>
                              {actionLoading === `status-${u.username}`
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleDelete(u.username)}
                              disabled={actionLoading === `delete-${u.username}`}
                              className="p-1.5 rounded text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                              title="Delete User">
                              {actionLoading === `delete-${u.username}`
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
