import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy, Eye, EyeOff, Check, KeyRound, AlertTriangle,
  Zap, Code2, Globe, ShieldCheck, RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL ?? "";

interface ApiKeyInfo {
  success: boolean;
  key: string;
  revealed: boolean;
  prefix: string;
  length: number;
}

export function ApiKeysPage() {
  const { toast } = useToast();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<ApiKeyInfo>({
    queryKey: ["admin-api-key", revealed],
    queryFn: async () => {
      const r = await fetch(`${API}/api/admin/api-key${revealed ? "?reveal=1" : ""}`);
      if (!r.ok) throw new Error("Failed to fetch");
      return r.json();
    },
  });

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

  const provisionEndpoint = `${window.location.origin.replace(":21645", ":8080")}/api/license/provision`;
  const lookupEndpoint = `${window.location.origin.replace(":21645", ":8080")}/api/license/lookup`;

  const codeSnippet = `// E-Commerce → SOFTWORKS IT License Sync
const SOFTWORKS_API_KEY = process.env.SOFTWORKS_API_KEY;
const SOFTWORKS_URL = "${provisionEndpoint}";

// Call this when a client creates/purchases a store
async function provisionLicense(store, user) {
  const res = await fetch(SOFTWORKS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${SOFTWORKS_API_KEY}\`,
    },
    body: JSON.stringify({
      store_id:     store.id,
      store_name:   store.name,
      client_name:  user.name,
      client_email: user.email,
      domain:       store.domain,
      product_name: "SOFTWORKS SaaS Platform",
      plan:         "pro",           // basic | pro | enterprise
      billing_cycle: "monthly",      // monthly | yearly | lifetime
      fee_amount:   2500,
    }),
  });

  const { license_key } = await res.json();
  return license_key; // Save this in your store DB
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
              E-Commerce integration API key — Bangla Beauty Bazaar বা যেকোনো site এ এই key ব্যবহার করুন
            </p>
          </div>
        </div>

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
              onClick={() => { setRevealed(false); refetch(); }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>

          {/* Key Display */}
          <div className="bg-background/60 border border-border rounded-xl p-4 flex items-center gap-3 font-mono text-sm">
            {isLoading ? (
              <span className="text-muted-foreground animate-pulse">Loading key...</span>
            ) : (
              <span className={`flex-1 break-all ${!revealed ? "tracking-widest text-muted-foreground" : "text-primary"}`}>
                {data?.key ?? "—"}
              </span>
            )}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setRevealed(r => !r)}
                title={revealed ? "Hide key" : "Reveal key"}
              >
                {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              {revealed && data?.key && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-orange-400 hover:text-orange-300"
                  onClick={() => copyText(data.key, "API Key")}
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
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs font-mono ${ep.method === "POST" ? "border-orange-500/30 text-orange-400" : "border-blue-500/30 text-blue-400"}`}>
                    {ep.method}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{ep.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{ep.desc}</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-primary flex-1 break-all font-mono">{ep.url}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => copyText(ep.url, ep.label)}
                  >
                    {copied === ep.label ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Guide */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-sm">Integration Code (Lovable / যেকোনো সাইট)</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-2"
              onClick={() => copyText(codeSnippet, "Code")}
            >
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

          <ol className="space-y-3">
            {[
              { step: "1", text: 'Lovable.dev প্রজেক্টে যান → Settings → Secrets', sub: 'বা "Update Secret" prompt দেখালে সেখানে যান' },
              { step: "2", text: 'Secret name দিন: SOFTWORKS_API_KEY', sub: 'ঠিক এই নামেই দিতে হবে' },
              { step: "3", text: 'উপরের "Reveal Key" বাটন চেপে key copy করুন', sub: 'swec- দিয়ে শুরু হওয়া পুরো key টি' },
              { step: "4", text: 'Lovable তে Paste করে Submit করুন', sub: 'Submit করলেই সংযোগ হয়ে যাবে' },
              { step: "5", text: 'Test করুন — একটি store তৈরি করুন', sub: 'License Manager পেজে এসে দেখুন নতুন E-Commerce badge সহ license এসেছে কিনা' },
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
