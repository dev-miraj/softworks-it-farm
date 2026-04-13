import { useState, useRef, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Upload, Trash2, CheckCircle, XCircle, Eye, EyeOff, Terminal, Lock, Save, RefreshCw, Globe, Phone, Mail, Building2, Facebook, Instagram, Linkedin, Twitter, Loader2 } from "lucide-react";
import { API } from "@/lib/apiUrl";
import { useToast } from "@/hooks/use-toast";

export function SiteSettingsPage() {
  const { logoUrl, siteName, setLogoUrl, setSiteName, saveSettings, reloadSettings, apiLoaded } = useSiteSettings();
  const { changePassword } = useAdminAuth();
  const { toast } = useToast();

  const [siteNameDraft, setSiteNameDraft] = useState(siteName);
  const [saving, setSaving] = useState(false);
  const [reloading, setReloading] = useState(false);

  const [draft, setDraft] = useState({
    contactEmail: "", contactPhone: "", address: "",
    socialFacebook: "", socialInstagram: "", socialLinkedin: "", socialTwitter: "",
    footerText: "", seoTitle: "", seoDescription: "",
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(logoUrl);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPasses, setShowPasses] = useState(false);
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setSiteNameDraft(siteName);
    setLogoPreview(logoUrl);
  }, [siteName, logoUrl]);

  async function handleReload() {
    setReloading(true);
    await reloadSettings();
    setReloading(false);
    toast({ title: "Settings reloaded from database!" });
  }

  async function saveName() {
    setSaving(true);
    try {
      await saveSettings({ siteName: siteNameDraft.trim() || "SOFTWORKS IT FARM" });
      toast({ title: "Site name saved!" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast({ title: "Only images allowed", variant: "destructive" }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: "Max 5MB", variant: "destructive" }); return; }

    setLogoUploading(true);
    const preview = URL.createObjectURL(file);
    setLogoPreview(preview);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const r = await fetch(`${API}/api/settings/upload-logo`, { method: "POST", body: fd });
      if (!r.ok) throw new Error("Upload failed");
      const d = await r.json();
      setLogoUrl(d.logoUrl);
      setLogoPreview(d.logoUrl);
      toast({ title: "Logo saved to database!" });
    } catch (err) {
      toast({ title: "Upload failed — logo stored locally only", variant: "destructive" });
      const reader = new FileReader();
      reader.onload = () => { const url = reader.result as string; setLogoUrl(url); setLogoPreview(url); };
      reader.readAsDataURL(file);
    } finally { setLogoUploading(false); }
  }

  function removeLogo() {
    setLogoPreview(null);
    setLogoUrl(null);
    saveSettings({ logoUrl: null }).catch(() => {});
    if (fileRef.current) fileRef.current.value = "";
  }

  async function saveContactInfo() {
    setSaving(true);
    try {
      await saveSettings(draft);
      toast({ title: "Contact info saved!" });
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  const handleChangePassword = () => {
    setPassMsg(null);
    if (!currentPass) { setPassMsg({ ok: false, text: "Enter current password" }); return; }
    if (newPass.length < 8) { setPassMsg({ ok: false, text: "New password must be at least 8 characters" }); return; }
    if (newPass !== confirmPass) { setPassMsg({ ok: false, text: "Passwords do not match" }); return; }
    const result = changePassword(currentPass, newPass);
    if (result.ok) {
      setPassMsg({ ok: true, text: result.message });
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
    } else {
      setPassMsg({ ok: false, text: result.message });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Site Settings</h1>
            <p className="text-white/40 text-sm mt-1">All settings are saved to the database.</p>
          </div>
          <Button size="sm" variant="outline" className="border-white/15 text-white/60 hover:text-white"
            disabled={reloading} onClick={handleReload}>
            {reloading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
            Reload from DB
          </Button>
        </div>

        {!apiLoaded && (
          <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-4 flex items-start gap-3">
            <Terminal className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-300 font-semibold text-sm">API not connected</p>
              <p className="text-yellow-200/60 text-xs mt-1">Settings are using cached local values. Set <code className="text-yellow-300">VITE_API_URL</code> in Vercel environment variables and redeploy to persist settings in the database.</p>
            </div>
          </div>
        )}

        {/* Logo */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-400" /> Logo & Branding</h2>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
              {logoPreview ? <img src={logoPreview} className="max-w-full max-h-full object-contain p-1" alt="logo" />
                : <Terminal className="w-8 h-8 text-white/20" />}
              {logoUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl"><Loader2 className="w-6 h-6 animate-spin text-white" /></div>}
            </div>
            <div className="space-y-2 flex-1">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={logoUploading}
                className="border-white/15 text-white/60 hover:text-white w-full">
                <Upload className="w-3.5 h-3.5 mr-2" /> {logoUploading ? "Uploading to DB..." : "Upload Logo"}
              </Button>
              {logoPreview && (
                <Button variant="outline" size="sm" onClick={removeLogo}
                  className="border-red-400/30 text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full">
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Remove Logo
                </Button>
              )}
              <p className="text-white/30 text-xs">Max 5MB. Saved to database — works across all devices.</p>
            </div>
          </div>
        </div>

        {/* Site Name */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-indigo-400" /> Site Name</h2>
          <div className="flex gap-3">
            <Input value={siteNameDraft} onChange={e => setSiteNameDraft(e.target.value)}
              className="bg-white/5 border-white/10 text-white flex-1"
              placeholder="SOFTWORKS IT FARM" />
            <Button onClick={saveName} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Save
            </Button>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2"><Phone className="w-4 h-4 text-indigo-400" /> Contact & Social</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["contactEmail", "Email", "your@email.com", Mail],
              ["contactPhone", "Phone", "+880 17xxx", Phone],
            ].map(([k, label, ph, Icon]) => (
              <div key={k as string}>
                <Label className="text-white/40 text-xs mb-1 flex items-center gap-1"><Icon className="w-3 h-3" />{label as string}</Label>
                <Input value={draft[k as keyof typeof draft]} onChange={e => setDraft(d => ({...d, [k as string]: e.target.value}))}
                  className="bg-white/5 border-white/10 text-white text-sm" placeholder={ph as string} />
              </div>
            ))}
          </div>
          <div>
            <Label className="text-white/40 text-xs mb-1 block">Address</Label>
            <Input value={draft.address} onChange={e => setDraft(d => ({...d, address: e.target.value}))}
              className="bg-white/5 border-white/10 text-white" placeholder="Dhaka, Bangladesh" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["socialFacebook", "Facebook URL", Facebook],
              ["socialInstagram", "Instagram URL", Instagram],
              ["socialLinkedin", "LinkedIn URL", Linkedin],
              ["socialTwitter", "Twitter/X URL", Twitter],
            ].map(([k, label, Icon]) => (
              <div key={k as string}>
                <Label className="text-white/40 text-xs mb-1 flex items-center gap-1"><Icon className="w-3 h-3" />{label as string}</Label>
                <Input value={draft[k as keyof typeof draft]} onChange={e => setDraft(d => ({...d, [k as string]: e.target.value}))}
                  className="bg-white/5 border-white/10 text-white text-sm" placeholder="https://..." />
              </div>
            ))}
          </div>
          <div>
            <Label className="text-white/40 text-xs mb-1 block">Footer Text</Label>
            <Textarea value={draft.footerText} onChange={e => setDraft(d => ({...d, footerText: e.target.value}))}
              className="bg-white/5 border-white/10 text-white text-sm" rows={2}
              placeholder="© 2025 SOFTWORKS IT FARM. All rights reserved." />
          </div>
          <Button onClick={saveContactInfo} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Save Contact Info
          </Button>
        </div>

        {/* SEO */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-400" /> SEO Settings</h2>
          <div>
            <Label className="text-white/40 text-xs mb-1 block">SEO Title</Label>
            <Input value={draft.seoTitle} onChange={e => setDraft(d => ({...d, seoTitle: e.target.value}))}
              className="bg-white/5 border-white/10 text-white" placeholder="SOFTWORKS IT FARM | Web & App Development" />
          </div>
          <div>
            <Label className="text-white/40 text-xs mb-1 block">SEO Description</Label>
            <Textarea value={draft.seoDescription} onChange={e => setDraft(d => ({...d, seoDescription: e.target.value}))}
              className="bg-white/5 border-white/10 text-white" rows={3}
              placeholder="Professional IT solutions..." />
          </div>
          <Button onClick={saveContactInfo} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Save SEO Settings
          </Button>
        </div>

        {/* Password */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2"><Lock className="w-4 h-4 text-indigo-400" /> Admin Password</h2>
          <div className="space-y-3">
            {[["Current Password", currentPass, setCurrentPass], ["New Password", newPass, setNewPass], ["Confirm New Password", confirmPass, setConfirmPass]].map(([label, val, setter]) => (
              <div key={label as string}>
                <Label className="text-white/40 text-xs mb-1 block">{label as string}</Label>
                <div className="relative">
                  <Input type={showPasses ? "text" : "password"} value={val as string} onChange={e => (setter as (v: string) => void)(e.target.value)}
                    className="bg-white/5 border-white/10 text-white pr-10" />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white" onClick={() => setShowPasses(s => !s)}>
                    {showPasses ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {passMsg && (
            <div className={`flex items-center gap-2 text-sm ${passMsg.ok ? "text-green-400" : "text-red-400"}`}>
              {passMsg.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {passMsg.text}
            </div>
          )}
          <Button onClick={handleChangePassword} className="bg-indigo-600 hover:bg-indigo-700">
            <Lock className="w-4 h-4 mr-2" /> Change Password
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
