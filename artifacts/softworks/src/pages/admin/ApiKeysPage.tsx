import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy, Eye, EyeOff, Check, KeyRound, AlertTriangle,
  Zap, Code2, Globe, ShieldCheck, RefreshCw, ServerCrash,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { API } from "@/lib/apiUrl";

// Fallback: shown when the API server's env var is not configured (e.g. on Vercel)
const FALLBACK_KEY = "swec-d587e1c6760bf65438cae1fe80724145c98c0069";

interface ApiKeyInfo {
  success: boolean;
  key: string;
  revealed: boolean;
  prefix: string;
  length: number;
  error?: string;
}

export function ApiKeysPage() {
  const { toast } = useToast();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<ApiKeyInfo>({
    queryKey: ["admin-api-key", revealed],
    queryFn: async () => {
      const r = await fetch(`${API}/api/admin/api-key${revealed ? "?reveal=1" : ""}`);
      const json = await r.json();
      return json;
    },
    retry: 1,
  });

  // Use API value if available, otherwise fallback
  const apiAvailable = data?.success === true;
  const displayKey   = apiAvailable
    ? data!.key
    : revealed
      ? FALLBACK_KEY
      : FALLBACK_KEY.slice(0, 8) + "••••••••••••••••••••••••••••••••" + FALLBACK_KEY.slice(-6);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast({ title: "Copied!", description: `${label} copied to clipboard.` });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Please copy manually.", variant: "destructive" });
    }
  };

  // Endpoint URLs — use current host (Vercel or Replit)
  const origin = window.location.origin.replace(":21645", ":8080");
  const provisionEndpoint = `${origin}/api/license/provision`;
  const lookupEndpoint    = `${origin}/api/license/lookup`;

  const codeSnippet = `// E-Commerce → SOFTWORKS IT License Sync
const SOFTWORKS_API_KEY = process.env.SOFTWORKS_API_KEY;
const SOFTWORKS_URL = "${provisionEndpoint}";

async function provisionLicense(store, user) {
  const res = await fetch(SOFTWORKS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${SOFTWORKS_API_KEY}\`,
    },
    body: JSON.stringify({
      store_id:      store.id,
      store_name:    store.name,
      client_name:   user.name,
      client_email:  user.email,
      domain:        store.domain,
      product_name:  "SOFTWORKS SaaS Platform",
      plan:          "pro",       // basic | pro | enterprise
      billing_cycle: "monthly",   // monthly | yearly | lifetime
      fee_amount:    2500,
    }),
  });
  const { license_key } = await res.json();
  return license_key;
}`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">API Keys</h1>
            <p className="text-sm text-muted-foreground">
              E-Commerce integration API key — Bangla Beauty Bazaar বা যেকোনো site এ ব্যবহার করুন
            </p>
          </div>
        </div>

        {/* Server env warning (only when API not configured) */}
        {!isLoading && !apiAvailable && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-300">Server এ ECOMMERCE_API_KEY সেট নেই</p>
              <p className="text-yellow-400/80 text-xs mt-0.5">
                Vercel → Settings → Environment Variables এ{" "}
                <code className="font-mono bg-black/30 px-1 rounded">ECOMMERCE_API_KEY</code>{" "}
                যোগ করুন। নিচে key টি দেওয়া আছে।
              </p>
            </div>
          </div>
        )}

        {/* Key Card */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span className="font-semibold text-sm">E-Commerce Integration Key</span>
              <Badge className="bg-green-500/15 text-green-400 border-green-500/20 text-xs">Active</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-2 text-xs"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>

          {/* Key Display */}
          <div className="bg-background/60 border border-border rounded-xl p-4 flex items-center gap-3 font-mono text-sm min-h-[56px]">
            {isLoading ? (
              <span className="text-muted-foreground animate-pulse flex-1">Loading...</span>
            ) : (
              <span className={`flex-1 break-all ${!revealed ? "tracking-widest text-muted-foreground" : "text-primary"}`}>
                {displayKey}
              </span>
            )}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setRevealed(r => !r)}
                title={revealed ? "Hide" : "Reveal"}
              >
                {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              {revealed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-orange-400 hover:text-orange-300"
                  onClick={() => copyText(FALLBACK_KEY, "API Key")}
                >
                  {copied === "API Key" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
            Key reveal করার পর copy করুন। এই key অন্য কারো সাথে share করবেন না।
          </p>
        </div>

        {/* Endpoints */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-sm">API Endpoints</span>
          </div>

          <div className="space-y-3">
            {[
              { label: "License Provision (POST)", desc: "নতুন license তৈরি করে", url: provisionEndpoint, method: "POST" },
              { label: "License Lookup (GET)", desc: "email বা store_id দিয়ে খোঁজে", url: `${lookupEndpoint}?email=...`, method: "GET" },
            ].map(ep => (
              <div key={ep.label} className="bg-background/60 border border-border rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`text-xs font-mono ${ep.method === "POST" ? "border-orange-500/30 text-orange-400" : "border-blue-500/30 text-blue-400"}`}>
                    {ep.method}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{ep.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{ep.desc}</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-primary flex-1 break-all font-mono">{ep.url}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyText(ep.url, ep.label)}>
                    {copied === ep.label ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code Snippet */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-sm">Integration Code (Lovable / যেকোনো সাইট)</span>
            </div>
            <Button variant="outline" size="sm" className="text-xs gap-2" onClick={() => copyText(codeSnippet, "Code")}>
              {copied === "Code" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              Copy Code
            </Button>
          </div>
          <pre className="bg-background/80 border border-border rounded-xl p-4 text-xs font-mono overflow-x-auto text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {codeSnippet}
          </pre>
        </div>

        {/* Setup Steps */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="font-semibold text-sm">Lovable.dev / Bangla Beauty Bazaar সেটআপ</span>
          </div>

          {/* Key Quick Copy */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
            <KeyRound className="w-4 h-4 text-primary shrink-0" />
            <code className="text-xs font-mono text-primary flex-1 break-all">{FALLBACK_KEY}</code>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyText(FALLBACK_KEY, "Quick Key")}>
              {copied === "Quick Key" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>

          <ol className="space-y-3">
            {[
              { step: "1", text: 'Lovable.dev → Settings → Secrets', sub: 'বা "Update Secret" prompt দেখালে সেখানে যান' },
              { step: "2", text: 'Secret name: SOFTWORKS_API_KEY', sub: 'ঠিক এই নামেই দিতে হবে' },
              { step: "3", text: 'উপরের key টি copy করে paste করুন', sub: 'swec- দিয়ে শুরু হওয়া পুরো key' },
              { step: "4", text: 'Submit করুন', sub: 'Submit হলেই সংযোগ active হয়ে যাবে' },
              { step: "5", text: 'Test: একটি store তৈরি করুন', sub: 'License Manager এ E-Commerce badge সহ license দেখা যাবে' },
            ].map(item => (
              <li key={item.step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-medium">{item.text}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </AdminLayout>
  );
}
