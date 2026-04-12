import { useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Upload, Trash2, CheckCircle, XCircle, Eye, EyeOff, Terminal, Lock } from "lucide-react";

export function SiteSettingsPage() {
  const { logoUrl, siteName, setLogoUrl, setSiteName } = useSiteSettings();
  const { changePassword } = useAdminAuth();

  const [siteNameDraft, setSiteNameDraft] = useState(siteName);
  const [siteNameSaved, setSiteNameSaved] = useState(false);

  const [logoPreview, setLogoPreview] = useState<string | null>(logoUrl);
  const [logoSaved, setLogoSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPasses, setShowPasses] = useState(false);
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
    setLogoSaved(false);
  };

  const saveLogo = () => {
    setLogoUrl(logoPreview);
    setLogoSaved(true);
    setTimeout(() => setLogoSaved(false), 3000);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setLogoUrl(null);
    setLogoSaved(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const saveSiteName = () => {
    setSiteName(siteNameDraft.trim() || "SOFTWORKS IT FARM");
    setSiteNameSaved(true);
    setTimeout(() => setSiteNameSaved(false), 3000);
  };

  const handleChangePassword = () => {
    setPassMsg(null);
    if (!currentPass || !newPass || !confirmPass) {
      setPassMsg({ ok: false, text: "All fields are required." });
      return;
    }
    if (newPass.length < 8) {
      setPassMsg({ ok: false, text: "New password must be at least 8 characters." });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({ ok: false, text: "New passwords do not match." });
      return;
    }
    const ok = changePassword(currentPass, newPass);
    if (ok) {
      setPassMsg({ ok: true, text: "Password changed successfully!" });
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
    } else {
      setPassMsg({ ok: false, text: "Current password is incorrect." });
    }
  };

  return (
    <AdminLayout>
      <div className="mb-7">
        <h1 className="text-3xl font-black text-foreground mb-1">Site Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your site logo, name, and admin password</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">

        {/* ── Logo & Site Name ── */}
        <div className="gradient-border rounded-xl p-6 flex flex-col gap-6">
          <div>
            <h2 className="text-base font-bold text-foreground mb-0.5">Site Logo</h2>
            <p className="text-xs text-muted-foreground">PNG, JPG — max 2MB. Shown in navbar and admin panel.</p>
          </div>

          {/* Preview */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                  <Terminal className="w-10 h-10" />
                  <span className="text-[10px]">No Logo</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                className="gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                {logoPreview ? "Change" : "Upload"}
              </Button>
              {logoPreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeLogo}
                  className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </Button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>

          <Button
            onClick={saveLogo}
            disabled={logoPreview === logoUrl}
            className="w-full gap-2"
          >
            {logoSaved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : "Save Logo"}
          </Button>

          <hr className="border-border/50" />

          {/* Site Name */}
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground mb-0.5">Site Name</h2>
              <p className="text-xs text-muted-foreground">Shown in the navbar beside the logo.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input
                value={siteNameDraft}
                onChange={e => { setSiteNameDraft(e.target.value); setSiteNameSaved(false); }}
                placeholder="SOFTWORKS IT FARM"
                onKeyDown={e => e.key === "Enter" && saveSiteName()}
              />
            </div>
            <Button onClick={saveSiteName} disabled={siteNameDraft.trim() === siteName} className="w-full gap-2">
              {siteNameSaved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : "Save Name"}
            </Button>
          </div>

          {/* Live preview */}
          <div className="mt-1 p-3 rounded-lg bg-background/50 border border-border/40">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Navbar Preview</p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center overflow-hidden">
                {logoPreview
                  ? <img src={logoPreview} alt="" className="w-full h-full object-contain p-0.5" />
                  : <Terminal className="w-3.5 h-3.5 text-primary" />}
              </div>
              <span className="font-black tracking-tight text-primary text-sm">{siteNameDraft || "SOFTWORKS IT FARM"}</span>
            </div>
          </div>
        </div>

        {/* ── Password Change ── */}
        <div className="gradient-border rounded-xl p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Change Password</h2>
              <p className="text-xs text-muted-foreground">Admin login password</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showPasses ? "text" : "password"}
                  value={currentPass}
                  onChange={e => { setCurrentPass(e.target.value); setPassMsg(null); }}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPasses(v => !v)}
                >
                  {showPasses ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>New Password</Label>
              <Input
                type={showPasses ? "text" : "password"}
                value={newPass}
                onChange={e => { setNewPass(e.target.value); setPassMsg(null); }}
                placeholder="Min. 8 characters"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Confirm New Password</Label>
              <Input
                type={showPasses ? "text" : "password"}
                value={confirmPass}
                onChange={e => { setConfirmPass(e.target.value); setPassMsg(null); }}
                placeholder="Re-enter new password"
                onKeyDown={e => e.key === "Enter" && handleChangePassword()}
              />
            </div>

            {passMsg && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg border ${
                passMsg.ok
                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}>
                {passMsg.ok
                  ? <CheckCircle className="w-4 h-4 shrink-0" />
                  : <XCircle className="w-4 h-4 shrink-0" />}
                {passMsg.text}
              </div>
            )}

            {/* Password strength */}
            {newPass && (
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1">
                  {[8, 12, 16].map((len, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      newPass.length >= len
                        ? i === 0 ? "bg-yellow-400" : i === 1 ? "bg-blue-400" : "bg-green-400"
                        : "bg-muted"
                    }`} />
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Strength: {newPass.length < 8 ? "Weak" : newPass.length < 12 ? "Fair" : newPass.length < 16 ? "Good" : "Strong"}
                </p>
              </div>
            )}

            <Button onClick={handleChangePassword} className="w-full mt-1">
              Update Password
            </Button>
          </div>

          <div className="mt-2 p-3 rounded-lg bg-muted/20 border border-border/30 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground/70">Security notes:</p>
            <p>• Default username is <code className="text-primary">admin</code></p>
            <p>• Password is stored locally in your browser</p>
            <p>• After changing, you'll use the new password on next login</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
