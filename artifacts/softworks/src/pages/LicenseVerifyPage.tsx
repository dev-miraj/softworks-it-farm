import { useState } from "react";
import { Shield, CheckCircle2, XCircle, AlertTriangle, Search, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API = import.meta.env.VITE_API_URL ?? "";

type VerifyResult = {
  found: boolean; status?: string; product?: string; type?: string;
  is_trial?: boolean; expires?: string; blacklisted?: boolean;
  activated?: boolean; usageCount?: number; maxActivations?: number;
};

export function LicenseVerifyPage() {
  const [key, setKey] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (!key.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/license/check/${encodeURIComponent(key.trim())}`);
      setResult(await r.json());
    } finally { setLoading(false); }
  };

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    active: { icon: <CheckCircle2 className="w-8 h-8" />, color: "text-emerald-400", label: "সক্রিয় (Active)" },
    trial: { icon: <AlertTriangle className="w-8 h-8" />, color: "text-amber-400", label: "Trial" },
    expired: { icon: <XCircle className="w-8 h-8" />, color: "text-red-400", label: "মেয়াদোত্তীর্ণ (Expired)" },
    suspended: { icon: <XCircle className="w-8 h-8" />, color: "text-orange-400", label: "স্থগিত (Suspended)" },
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-xl mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 mx-auto mb-6">
          <Shield className="w-8 h-8 text-violet-400" />
        </div>
        <h1 className="text-3xl font-bold mb-2">
          <span className="gradient-text">License Verification</span>
        </h1>
        <p className="text-muted-foreground mb-8">আপনার license key দিয়ে status চেক করুন</p>

        <div className="flex gap-2 max-w-md mx-auto mb-10">
          <div className="relative flex-1">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="SW-XXXX-XXXX-XXXX-XXXX"
              value={key} onChange={e => setKey(e.target.value)}
              onKeyDown={e => e.key === "Enter" && verify()}
              className="pl-9 font-mono"
            />
          </div>
          <Button onClick={verify} disabled={loading || !key.trim()} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
            Verify
          </Button>
        </div>

        {result && (
          <div className="rounded-2xl border border-border bg-card p-8 text-left">
            {!result.found ? (
              <div className="text-center">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-red-400 mb-1">License Not Found</h3>
                <p className="text-sm text-muted-foreground">এই key টি আমাদের system-এ নেই।</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={statusConfig[result.status || ""]?.color || "text-muted-foreground"}>
                    {statusConfig[result.status || ""]?.icon || <Shield className="w-8 h-8" />}
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${statusConfig[result.status || ""]?.color || ""}`}>
                      {statusConfig[result.status || ""]?.label || result.status}
                    </h3>
                    <p className="text-sm text-muted-foreground">{result.product}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                  <InfoRow label="License Type" value={result.type || "—"} />
                  <InfoRow label="Trial" value={result.is_trial ? "হ্যাঁ" : "না"} />
                  <InfoRow label="Expires" value={result.expires ? new Date(result.expires).toLocaleDateString("bn-BD") : "কোনো মেয়াদ নেই"} />
                  <InfoRow label="Blacklisted" value={result.blacklisted ? "হ্যাঁ ⚠️" : "না"} />
                  <InfoRow label="Activated" value={result.activated ? "হ্যাঁ" : "না"} />
                  <InfoRow label="Activations" value={`${result.usageCount || 0} / ${result.maxActivations || "—"}`} />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-16 rounded-2xl border border-border bg-card/50 p-8 text-left">
          <h3 className="text-lg font-bold text-foreground mb-4">SDK Integration Guide</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-violet-400 mb-2">JavaScript / Node.js</h4>
              <pre className="text-xs bg-muted/30 rounded-lg p-4 overflow-x-auto text-foreground font-mono">
{`<script src="https://softworksit.vercel.app/sdk/softworks-license.js"></script>
<script>
  SoftworksLicense.init({
    licenseKey: 'SW-XXXX-XXXX-XXXX',
    serverUrl: 'https://softworksit.vercel.app'
  });
</script>`}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-cyan-400 mb-2">PHP</h4>
              <pre className="text-xs bg-muted/30 rounded-lg p-4 overflow-x-auto text-foreground font-mono">
{`require_once 'softworks-license.php';
$license = new SoftworksLicense('SW-XXXX-XXXX-XXXX');
$result = $license->validate();
if (!$result['valid']) die($result['error']);`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/20 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}
