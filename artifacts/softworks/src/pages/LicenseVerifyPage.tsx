import { useState } from "react";
import {
  Shield, CheckCircle2, XCircle, AlertTriangle, Search, KeyRound,
  Globe, Code2, Cpu, Copy, Check, Zap, Lock, Server, ArrowRight,
  Terminal, FileCode, Layers, ChevronDown, ChevronUp, ExternalLink,
  Fingerprint, RefreshCw, ShieldCheck, Wifi, HardDrive, Eye, EyeOff,
  Download, BookOpen, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API = import.meta.env.VITE_API_URL ?? "";
const SERVER_URL = "https://softworksit.vercel.app";

type VerifyResult = {
  found: boolean; status?: string; product?: string; type?: string;
  is_trial?: boolean; expires?: string; blacklisted?: boolean;
  activated?: boolean; usageCount?: number; maxActivations?: number;
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
      title="Copy code"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
    </button>
  );
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="relative group">
      <div className="absolute top-3 left-3 text-[10px] font-mono uppercase tracking-wider text-violet-400/60">{lang}</div>
      <CopyBtn text={code} />
      <pre className="text-[13px] bg-[#0d0f1a] rounded-xl p-4 pt-8 overflow-x-auto text-slate-300 font-mono border border-white/5 leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

function StepCard({ step, title, titleBn, desc, icon: Icon, children }: {
  step: number; title: string; titleBn: string; desc: string;
  icon: React.ElementType; children?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="flex gap-5">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center border border-violet-500/30 shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-cyan-600/10 animate-pulse" />
            <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 relative z-10">{step}</span>
          </div>
          <div className="w-px flex-1 bg-gradient-to-b from-violet-500/30 to-transparent mt-3" />
        </div>
        <div className="pb-10 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4 text-cyan-400" />
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
          </div>
          <p className="text-sm text-violet-300/70 mb-1 font-medium">{titleBn}</p>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{desc}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, color }: {
  icon: React.ElementType; title: string; desc: string; color: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all hover:border-white/10 group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-bold text-foreground mb-1 group-hover:text-white transition-colors">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-all">
        <span className="text-sm font-medium text-foreground pr-4">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-violet-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-white/5 pt-3">{a}</div>}
    </div>
  );
}

export function LicenseVerifyPage() {
  const [key, setKey] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"js" | "php" | "node" | "wordpress">("js");
  const [sdkType, setSdkType] = useState<"stealth" | "shield" | "standard">("stealth");
  const [showKey, setShowKey] = useState(false);

  const verify = async () => {
    if (!key.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/license/check/${encodeURIComponent(key.trim())}`);
      setResult(await r.json());
    } finally { setLoading(false); }
  };

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string; labelBn: string; bg: string }> = {
    active: { icon: <CheckCircle2 className="w-10 h-10" />, color: "text-emerald-400", label: "Active", labelBn: "সক্রিয়", bg: "from-emerald-500/20 to-emerald-600/5" },
    trial: { icon: <AlertTriangle className="w-10 h-10" />, color: "text-amber-400", label: "Trial", labelBn: "ট্রায়াল", bg: "from-amber-500/20 to-amber-600/5" },
    expired: { icon: <XCircle className="w-10 h-10" />, color: "text-red-400", label: "Expired", labelBn: "মেয়াদোত্তীর্ণ", bg: "from-red-500/20 to-red-600/5" },
    suspended: { icon: <XCircle className="w-10 h-10" />, color: "text-orange-400", label: "Suspended", labelBn: "স্থগিত", bg: "from-orange-500/20 to-orange-600/5" },
  };

  const codeExamples: Record<string, Record<string, { code: string; lang: string }>> = {
    stealth: {
      js: {
        lang: "HTML / JavaScript (Stealth)",
        code: `<!-- WebPerf Analytics — পুরো site invisible protection -->
<!-- দেখতে মনে হবে analytics library, কিন্তু এটাই license protection! -->
<script
  src="${SERVER_URL}/sdk/sw-perf.js"
  data-wp-key="SW-XXXX-XXXX-XXXX"
  data-wp-endpoint="${SERVER_URL}"
><\/script>

<!-- অথবা manual init করতে চাইলে: -->
<script>
  WebPerf.track({
    k: 'SW-XXXX-XXXX-XXXX',
    b: '${SERVER_URL}',
    c: function(m) {
      // m.ok = true মানে license valid
      console.log('Analytics ready:', m.ok);
    }
  });

  // License status check করতে:
  var stats = WebPerf.metrics();
  console.log('Active:', stats.ok);
<\/script>

<!--
  ✅ কেউ code পড়লে মনে করবে এটা analytics/performance tool
  ✅ Global object: WebPerf (কোনো "license" শব্দ নেই)
  ✅ Variable names: _rq, _ck, _hb (analytics মনে হয়)
  ✅ API headers: X-WP-Nonce, X-WP-Auth (WordPress মনে হয়)
  ✅ File name: sw-perf.js (service worker performance মনে হয়)
  ✅ License invalid হলে site নিজেই বন্ধ হয়ে যায়
  ✅ Anti-debug + anti-tamper built-in
-->`,
      },
      php: {
        lang: "PHP (Stealth)",
        code: `<?php
// PageCache — Server-Side Caching Optimizer
// দেখতে মনে হবে page cache plugin, কিন্তু এটাই license protection!

// Method 1: Environment variable দিয়ে (recommended)
// .env ফাইলে রাখুন:
//   WP_CACHE_KEY=SW-XXXX-XXXX-XXXX
//   WP_CACHE_API=${SERVER_URL}
putenv('WP_CACHE_KEY=SW-XXXX-XXXX-XXXX');
putenv('WP_CACHE_API=${SERVER_URL}');
require_once __DIR__ . '/sw-cache.php';
// ব্যস! PageCache স্বয়ংক্রিয়ভাবে activate হয়ে যাবে

// Method 2: Global variable দিয়ে
$GLOBALS['WP_CACHE_KEY'] = 'SW-XXXX-XXXX-XXXX';
$GLOBALS['WP_CACHE_API'] = '${SERVER_URL}';
require_once __DIR__ . '/sw-cache.php';

// Method 3: Manual init (advanced)
define('WP_CACHE_SKIP', true);
require_once __DIR__ . '/sw-cache.php';
$cache = PageCache::init([
    'key' => 'SW-XXXX-XXXX-XXXX',
    'api' => '${SERVER_URL}',
]);

// Status check করতে:
if ($cache->isReady()) {
    // License valid — সব features চালু
}

// ✅ Class name: PageCache (কোনো "license" শব্দ নেই)
// ✅ Env vars: WP_CACHE_KEY, WP_CACHE_API (cache config মনে হয়)
// ✅ API headers: X-Cache-Token, X-Cache-Time
// ✅ File name: sw-cache.php (service worker cache মনে হয়)
// ✅ License invalid হলে 503 Service Unavailable দেখায়
?>`,
      },
      node: {
        lang: "Node.js / Express (Stealth)",
        code: `// WebPerf Analytics — Server-Side Performance Monitoring
// দেখতে মনে হবে analytics tool, কিন্তু এটাই license protection!
const fs = require('fs');

// sw-perf.js SDK টি server-side এও কাজ করে
// তবে Node.js এ সরাসরি API call করাই ভালো:

const LICENSE_KEY = process.env.WP_CACHE_KEY || 'SW-XXXX-XXXX-XXXX';
const API_URL = process.env.WP_CACHE_API || '${SERVER_URL}';

// License validate — analytics-style naming
async function initPerformanceMonitor() {
  const res = await fetch(API_URL + '/api/license/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce': Date.now().toString(36),
    },
    body: JSON.stringify({
      license_key: LICENSE_KEY,
      domain: process.env.DOMAIN || 'localhost',
      hardware_id: require('os').hostname(),
    }),
  });
  const data = await res.json();
  if (!data.valid && !data.data?.valid) {
    console.error('Performance monitor failed to initialize');
    process.exit(1);
  }
  return data;
}

// Express middleware — প্রতিটি request check
async function perfMiddleware(req, res, next) {
  // Heartbeat পাঠান background এ
  fetch(API_URL + '/api/license/heartbeat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      license_key: LICENSE_KEY,
      domain: req.hostname,
    }),
  }).catch(() => {});
  next();
}

// App start এ call করুন:
initPerformanceMonitor().then(() => {
  console.log('Performance monitor active');
});

// Middleware যোগ করুন:
// app.use(perfMiddleware);`,
      },
      wordpress: {
        lang: "WordPress (Stealth)",
        code: `<?php
/**
 * Plugin Name: My Licensed Plugin
 * Description: Performance optimized WordPress plugin
 */

// PageCache SDK include করুন (দেখতে caching plugin মনে হবে)
define('WP_CACHE_SKIP', true);
require_once plugin_dir_path(__FILE__) . 'sw-cache.php';

// Plugin activation-এ cache init করুন
register_activation_hook(__FILE__, function() {
    $key = get_option('wp_cache_key', '');
    if (empty($key)) {
        deactivate_plugins(plugin_basename(__FILE__));
        wp_die('Cache configuration required! Enter key in Settings.');
    }
});

// প্রতিটি page load-এ PageCache check
add_action('plugins_loaded', function() {
    $key = get_option('wp_cache_key', '');
    if (empty($key)) return;

    // PageCache init — invisible license protection
    $cache = PageCache::init([
        'key' => $key,
        'api' => '${SERVER_URL}',
    ]);

    if (!$cache->isReady()) {
        add_action('admin_notices', function() {
            echo '<div class="notice notice-error">';
            echo '<p><strong>Cache initialization failed!</strong> ';
            echo 'Contact support for assistance.</p>';
            echo '</div>';
        });
        return;
    }

    // ✅ Cache ready — plugin features চালু করুন
    require_once plugin_dir_path(__FILE__) . 'includes/main.php';
});

// Admin settings page (cache settings মনে হবে)
add_action('admin_menu', function() {
    add_options_page('Cache Settings', 'Page Cache',
        'manage_options', 'wp-cache-settings', function() {
        if (isset($_POST['cache_key'])) {
            update_option('wp_cache_key',
                sanitize_text_field($_POST['cache_key']));
            echo '<div class="updated"><p>Cache key saved!</p></div>';
        }
        $key = get_option('wp_cache_key', '');
        echo '<div class="wrap"><h1>Cache Settings</h1>';
        echo '<form method="post"><p><label>Cache Key:</label><br>';
        echo '<input name="cache_key" value="'.esc_attr($key).'"';
        echo ' class="regular-text" placeholder="Enter cache key">';
        echo '</p><p><button class="button-primary">';
        echo 'Save Settings</button></p></form></div>';
    });
});

// ✅ সব কিছু "Cache" নামে — কেউ বুঝবে না এটা license system
// ✅ Settings page: "Cache Settings" (License Settings না)
// ✅ Option name: wp_cache_key (sw_license_key না)
// ✅ Error messages: "Cache failed" (License failed না)`,
      },
    },
    shield: {
      js: {
        lang: "HTML / JavaScript (Shield)",
        code: `<!-- SOFTWORKS Shield — Tamper-Proof License Protection -->
<!-- এই একটি লাইন যোগ করলেই পুরো site protected -->
<script
  src="${SERVER_URL}/sdk/softworks-shield.js"
  data-license-key="SW-XXXX-XXXX-XXXX"
  data-server-url="${SERVER_URL}"
><\/script>

<!-- অথবা manual init করতে চাইলে: -->
<script>
  SoftworksShield.init({
    licenseKey: 'SW-XXXX-XXXX-XXXX',
    serverUrl: '${SERVER_URL}',
    heartbeatInterval: 180000,  // ৩ মিনিট
    onValid: (data) => {
      console.log('Protected!');
    },
    onInvalid: (error) => {
      // Shield নিজেই site বন্ধ করে দেবে
      // কোনো কিছু করার দরকার নেই
    }
  });
<\/script>

<!--
  Shield Features (automatic):
  ✅ Anti-tampering — কেউ code পরিবর্তন করলে detect করবে
  ✅ Anti-debugging — DevTools দিয়ে bypass করা যাবে না
  ✅ Self-healing — script মুছে ফেললে নিজেই ফিরে আসবে
  ✅ Multi-layer heartbeat — random interval এ server check
  ✅ Kill switch — Admin Panel থেকে instantly বন্ধ করা যাবে
  ✅ Encrypted communication — API calls signed & verified
-->`,
      },
      php: {
        lang: "PHP (Shield)",
        code: `<?php
// SOFTWORKS Shield — Tamper-Proof License Protection
// এই ২ লাইন আপনার PHP ফাইলের শুরুতে যোগ করুন

// Method 1: Environment variable দিয়ে (recommended)
// .env ফাইলে রাখুন: SW_LICENSE_KEY=SW-XXXX-XXXX-XXXX
//                     SW_SERVER_URL=${SERVER_URL}
putenv('SW_LICENSE_KEY=SW-XXXX-XXXX-XXXX');
putenv('SW_SERVER_URL=${SERVER_URL}');
require_once __DIR__ . '/softworks-shield.php';
// ব্যস! Shield স্বয়ংক্রিয়ভাবে activate হয়ে যাবে

// Method 2: Global variable দিয়ে
$GLOBALS['SW_LICENSE_KEY'] = 'SW-XXXX-XXXX-XXXX';
$GLOBALS['SW_SERVER_URL'] = '${SERVER_URL}';
require_once __DIR__ . '/softworks-shield.php';

// Method 3: Manual boot (advanced)
define('SW_SHIELD_SKIP', true);
require_once __DIR__ . '/softworks-shield.php';
$shield = SW_Shield::boot([
    'k' => 'SW-XXXX-XXXX-XXXX',
    'u' => '${SERVER_URL}',
]);

// Shield Features (automatic):
// ✅ File integrity check — ফাইল modify করলে block
// ✅ Shutdown hook — require মুছে দিলেও কাজ করবে
// ✅ Encrypted API — HMAC signed communication
// ✅ Auto-block — license invalid হলে 403 page
// ✅ Kill switch — Admin Panel থেকে remote control
?>`,
      },
      node: {
        lang: "Node.js / Express (Shield)",
        code: `// SOFTWORKS Shield — Server-Side Protection
const SoftworksLicense = require('./softworks-license.js');

const license = SoftworksLicense.init({
  licenseKey: process.env.LICENSE_KEY || 'SW-XXXX-XXXX-XXXX',
  serverUrl: '${SERVER_URL}',
  autoHeartbeat: true,
  heartbeatInterval: 180000, // ৩ মিনিট
  onInvalid: (error) => {
    console.error('License blocked:', error);
    process.exit(1); // Server বন্ধ করে দিন
  }
});

// Activate করুন (app start-এ)
await license.activate();

// Express middleware — প্রতিটি request check
app.use(async (req, res, next) => {
  const result = await license.validate();
  if (!result.valid) {
    return res.status(403).json({
      error: 'Unauthorized',
      message: 'Software license expired'
    });
  }
  next();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await license.deactivate();
  process.exit(0);
});`,
      },
      wordpress: {
        lang: "WordPress (Shield)",
        code: `<?php
/**
 * Plugin Name: My Licensed Plugin
 * Description: SOFTWORKS Shield protected WordPress plugin
 */

// Shield SDK include করুন (file modify করলে auto-block)
define('SW_SHIELD_SKIP', true);
require_once plugin_dir_path(__FILE__) . 'softworks-shield.php';

// Plugin activation-এ license boot করুন
register_activation_hook(__FILE__, function() {
    $key = get_option('sw_license_key', '');
    if (empty($key)) {
        deactivate_plugins(plugin_basename(__FILE__));
        wp_die('License key প্রয়োজন! Settings-এ key দিন।');
    }
});

// প্রতিটি page load-এ Shield check
add_action('plugins_loaded', function() {
    $key = get_option('sw_license_key', '');
    if (empty($key)) return;

    // Shield boot — tamper-proof protection
    $shield = SW_Shield::boot([
        'k' => $key,
        'u' => '${SERVER_URL}',
    ]);

    if (!$shield->isValid()) {
        add_action('admin_notices', function() {
            echo '<div class="notice notice-error">';
            echo '<p><strong>License সমস্যা!</strong> ';
            echo 'support@softworks.dev এ যোগাযোগ করুন।</p>';
            echo '</div>';
        });
        return;
    }

    // ✅ License valid — plugin features চালু করুন
    require_once plugin_dir_path(__FILE__) . 'includes/main.php';
});

// Admin settings page
add_action('admin_menu', function() {
    add_options_page('License', 'SW License',
        'manage_options', 'sw-license', function() {
        if (isset($_POST['sw_key'])) {
            update_option('sw_license_key',
                sanitize_text_field($_POST['sw_key']));
            echo '<div class="updated"><p>Key saved!</p></div>';
        }
        $key = get_option('sw_license_key', '');
        echo '<div class="wrap"><h1>License Settings</h1>';
        echo '<form method="post"><p>';
        echo '<input name="sw_key" value="'.esc_attr($key).'"';
        echo ' class="regular-text" placeholder="SW-XXXX-XXXX-XXXX">';
        echo '</p><p><button class="button-primary">';
        echo 'Save Key</button></p></form></div>';
    });
});`,
      },
    },
    standard: {
      js: {
        lang: "HTML / JavaScript (Standard)",
        code: `<!-- SOFTWORKS License — Standard Integration -->
<script src="${SERVER_URL}/sdk/softworks-license.js"><\/script>
<script>
  const license = SoftworksLicense.init({
    licenseKey: 'SW-XXXX-XXXX-XXXX',
    serverUrl: '${SERVER_URL}',
    autoHeartbeat: true,
    heartbeatInterval: 300000, // ৫ মিনিট
    onValid: (data) => {
      console.log('License সক্রিয়!', data);
      // আপনার app এর features চালু করুন
    },
    onInvalid: (error) => {
      console.error('License সমস্যা:', error);
      // Features বন্ধ করুন বা message দেখান
      document.body.innerHTML = '<h1>License Required</h1>';
    }
  });

  // প্রথমবার activate
  await license.activate();

  // যেকোনো সময় status check
  const status = await license.validate();
  console.log('Valid:', status.valid);
  console.log('Expires:', status.expires);
<\/script>

<!--
  Standard SDK Features:
  ✅ সহজ integration — মাত্র কয়েক লাইন code
  ✅ Auto heartbeat — নিয়মিত server check
  ✅ Hardware fingerprint — device binding
  ✅ Domain lock — নির্দিষ্ট domain-এ কাজ করবে
  ✅ HMAC signed — secure API communication
-->`,
      },
      php: {
        lang: "PHP (Standard)",
        code: `<?php
// SOFTWORKS License — Standard PHP Integration
require_once __DIR__ . '/softworks-license.php';

$license = new SoftworksLicense(
    'SW-XXXX-XXXX-XXXX',
    '${SERVER_URL}'
);

// License activate করুন
$result = $license->activate();

if ($result['success']) {
    echo "License সক্রিয়!";
} else {
    echo "সমস্যা: " . ($result['error'] ?? 'Unknown');
}

// License validate করুন
$valid = $license->validate();

if ($valid['valid']) {
    // ✅ সব features চালু
    echo "License valid — expires: " . $valid['expires'];
} else {
    // ❌ Features বন্ধ করুন
    die('Valid license required.');
}

// অথবা enforceOrDie() — invalid হলে page বন্ধ
$license->enforceOrDie();

// এই লাইনের পরে শুধুমাত্র valid license-এ আসবে
echo "Protected content here";
?>`,
      },
      node: {
        lang: "Node.js / Express (Standard)",
        code: `// SOFTWORKS License — Standard Node.js Integration
const SoftworksLicense = require('./softworks-license.js');

const license = SoftworksLicense.init({
  licenseKey: process.env.LICENSE_KEY || 'SW-XXXX-XXXX-XXXX',
  serverUrl: '${SERVER_URL}',
  autoHeartbeat: true,
  heartbeatInterval: 300000, // ৫ মিনিট
  onValid: (data) => {
    console.log('License active:', data);
  },
  onInvalid: (error) => {
    console.error('License invalid:', error);
    process.exit(1);
  }
});

// App start এ activate
await license.activate();

// Express middleware
app.use(async (req, res, next) => {
  const result = await license.validate();
  if (!result.valid) {
    return res.status(403).json({
      error: 'License required',
      message: 'Please activate a valid license'
    });
  }
  next();
});

// Status check endpoint
app.get('/license-status', async (req, res) => {
  const status = await license.validate();
  res.json({
    valid: status.valid,
    product: status.product,
    expires: status.expires
  });
});`,
      },
      wordpress: {
        lang: "WordPress (Standard)",
        code: `<?php
/**
 * Plugin Name: My Licensed Plugin
 * Description: SOFTWORKS License protected plugin
 */

require_once plugin_dir_path(__FILE__) . 'softworks-license.php';

// Plugin activation
register_activation_hook(__FILE__, function() {
    $key = get_option('sw_license_key', '');
    if (empty($key)) {
        deactivate_plugins(plugin_basename(__FILE__));
        wp_die('License key required!');
    }
});

// License check on every page load
add_action('plugins_loaded', function() {
    $key = get_option('sw_license_key', '');
    if (empty($key)) return;

    $license = new SoftworksLicense($key, '${SERVER_URL}');
    $result = $license->validate();

    if (empty($result['valid'])) {
        add_action('admin_notices', function() {
            echo '<div class="notice notice-error">';
            echo '<p><strong>License invalid!</strong> ';
            echo 'Enter a valid license key in settings.</p>';
            echo '</div>';
        });
        return;
    }

    // ✅ License valid
    require_once plugin_dir_path(__FILE__) . 'includes/main.php';
});

// Settings page
add_action('admin_menu', function() {
    add_options_page('License', 'SW License',
        'manage_options', 'sw-license', function() {
        if (isset($_POST['sw_key'])) {
            update_option('sw_license_key',
                sanitize_text_field($_POST['sw_key']));
            echo '<div class="updated"><p>Key saved!</p></div>';
        }
        $key = get_option('sw_license_key', '');
        echo '<div class="wrap"><h1>License Settings</h1>';
        echo '<form method="post"><p>';
        echo '<input name="sw_key" value="'.esc_attr($key).'"';
        echo ' class="regular-text" placeholder="SW-XXXX-XXXX-XXXX">';
        echo '</p><p><button class="button-primary">';
        echo 'Save Key</button></p></form></div>';
    });
});`,
      },
    },
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative pt-28 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-violet-300 font-medium">Military-Grade License Protection</span>
          </div>

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center border border-violet-500/30 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-600/10 to-cyan-600/10 animate-pulse" />
            <Shield className="w-10 h-10 text-violet-400 relative z-10" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400">
              License Verification
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-2">আপনার license key দিয়ে status চেক করুন</p>
          <p className="text-sm text-violet-300/50">SOFTWORKS IT FARM — Software License Management System</p>

          {/* Verify Input */}
          <div className="flex gap-3 max-w-lg mx-auto mt-10">
            <div className="relative flex-1">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400/60" />
              <Input
                placeholder="SW-XXXX-XXXX-XXXX"
                value={key}
                onChange={e => setKey(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && verify()}
                className="pl-11 pr-10 h-12 font-mono text-base bg-white/[0.03] border-white/10 rounded-xl focus:border-violet-500/50 focus:ring-violet-500/20"
                type={showKey ? "text" : "password"}
              />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button
              onClick={verify}
              disabled={loading || !key.trim()}
              className="h-12 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white gap-2 rounded-xl shadow-lg shadow-violet-500/20 transition-all hover:shadow-violet-500/30"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
              Verify
            </Button>
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="max-w-xl mx-auto px-4 -mt-2 mb-12">
          <div className={`rounded-2xl border border-white/10 p-8 backdrop-blur-sm ${!result.found ? "bg-red-500/[0.03]" : `bg-gradient-to-br ${statusConfig[result.status || ""]?.bg || "from-slate-500/10 to-slate-600/5"}`}`}>
            {!result.found ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-red-400 mb-2">License Not Found</h3>
                <p className="text-sm text-muted-foreground">এই key টি আমাদের system-এ নেই। অনুগ্রহ করে সঠিক key ব্যবহার করুন।</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${statusConfig[result.status || ""]?.color || ""} bg-white/5 border border-white/10`}>
                    {statusConfig[result.status || ""]?.icon || <Shield className="w-10 h-10" />}
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold ${statusConfig[result.status || ""]?.color || ""}`}>
                      {statusConfig[result.status || ""]?.label || result.status}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {statusConfig[result.status || ""]?.labelBn} — {result.product}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                  <InfoRow label="License Type" labelBn="ধরন" value={result.type || "—"} />
                  <InfoRow label="Trial" labelBn="ট্রায়াল" value={result.is_trial ? "হ্যাঁ" : "না"} />
                  <InfoRow label="Expires" labelBn="মেয়াদ" value={result.expires ? new Date(result.expires).toLocaleDateString("bn-BD") : "আজীবন"} />
                  <InfoRow label="Blacklisted" labelBn="ব্ল্যাকলিস্ট" value={result.blacklisted ? "হ্যাঁ ⚠️" : "না"} />
                  <InfoRow label="Activated" labelBn="সক্রিয়" value={result.activated ? "হ্যাঁ" : "না"} />
                  <InfoRow label="Activations" labelBn="ব্যবহার" value={`${result.usageCount || 0} / ${result.maxActivations || "∞"}`} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">কেন SOFTWORKS License?</span>
          </h2>
          <p className="text-sm text-muted-foreground">আপনার সফটওয়্যারের জন্য সবচেয়ে নিরাপদ লাইসেন্স সিস্টেম</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FeatureCard icon={Fingerprint} title="Hardware Binding" desc="প্রতিটি device-এর unique fingerprint তৈরি করে license lock করে" color="bg-violet-500/10 text-violet-400 border border-violet-500/20" />
          <FeatureCard icon={Globe} title="Domain Lock" desc="নির্দিষ্ট domain-এ license সীমাবদ্ধ রাখুন" color="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" />
          <FeatureCard icon={RefreshCw} title="Auto Heartbeat" desc="প্রতি ৫ মিনিটে স্বয়ংক্রিয়ভাবে license verify করে" color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" />
          <FeatureCard icon={Lock} title="Kill Switch" desc="যেকোনো সময় remote থেকে license বাতিল করুন" color="bg-red-500/10 text-red-400 border border-red-500/20" />
          <FeatureCard icon={ShieldCheck} title="HMAC Signed" desc="প্রতিটি response cryptographically signed" color="bg-amber-500/10 text-amber-400 border border-amber-500/20" />
          <FeatureCard icon={Wifi} title="Rate Limiting" desc="প্রতি IP-তে ৬০ request/min সীমা" color="bg-blue-500/10 text-blue-400 border border-blue-500/20" />
          <FeatureCard icon={HardDrive} title="Multi-Activation" desc="একটি key দিয়ে একাধিক device-এ ব্যবহার" color="bg-purple-500/10 text-purple-400 border border-purple-500/20" />
          <FeatureCard icon={Layers} title="Multi-Product" desc="একাধিক product-এর জন্য আলাদা license" color="bg-pink-500/10 text-pink-400 border border-pink-500/20" />
        </div>
      </div>

      {/* Step by Step Integration Guide */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-300 font-medium">Integration Guide</span>
          </div>
          <h2 className="text-3xl font-bold mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
              কিভাবে আপনার Website-এ Connect করবেন
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            মাত্র ৪টি সহজ ধাপে আপনার যেকোনো website, app বা software-এ SOFTWORKS License system যুক্ত করুন।
            কোনো complex setup নেই — just copy, paste, and go!
          </p>
        </div>

        <div className="space-y-0">
          <StepCard
            step={1}
            title="License Key সংগ্রহ করুন"
            titleBn="আপনার unique license key পেতে আমাদের সাথে যোগাযোগ করুন"
            desc="SOFTWORKS Admin Panel থেকে আপনার জন্য একটি unique license key (SW-XXXX-XXXX-XXXX) তৈরি করা হবে। key টি আপনার email-এ পাঠানো হবে।"
            icon={KeyRound}
          >
            <div className="rounded-xl bg-[#0d0f1a] border border-white/5 p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center border border-violet-500/30 shrink-0">
                <KeyRound className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <div className="font-mono text-lg text-foreground tracking-wider">SW-A1B2-C3D4-E5F6</div>
                <div className="text-xs text-muted-foreground mt-0.5">আপনার License Key (উদাহরণ)</div>
              </div>
            </div>
          </StepCard>

          <StepCard
            step={2}
            title="SDK ডাউনলোড করুন"
            titleBn="আপনার platform অনুযায়ী সঠিক SDK বেছে নিন"
            desc="আমরা JavaScript এবং PHP দুটি SDK সরবরাহ করি। আপনার website/app যে ভাষায় তৈরি সেই SDK ডাউনলোড করুন।"
            icon={Download}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a href={`${SERVER_URL}/sdk/sw-perf.js`} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 hover:bg-emerald-500/[0.06] transition-all group relative">
                <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Stealth</div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Lock className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground group-hover:text-emerald-300 transition-colors">JS Stealth SDK</div>
                  <div className="text-xs text-muted-foreground">Invisible Protection (Web)</div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
              </a>
              <a href={`${SERVER_URL}/sdk/sw-cache.php`} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 hover:bg-emerald-500/[0.06] transition-all group relative">
                <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Stealth</div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Lock className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground group-hover:text-emerald-300 transition-colors">PHP Stealth SDK</div>
                  <div className="text-xs text-muted-foreground">Invisible Protection (PHP)</div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
              </a>
              <a href={`${SERVER_URL}/sdk/softworks-shield.js`} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.03] p-4 hover:bg-red-500/[0.06] transition-all group relative">
                <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-[10px] font-bold text-red-400 uppercase tracking-wider">Shield</div>
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <ShieldCheck className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground group-hover:text-red-300 transition-colors">JS Shield SDK</div>
                  <div className="text-xs text-muted-foreground">Anti-Tamper Protection</div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" />
              </a>
              <a href={`${SERVER_URL}/sdk/softworks-shield.php`} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.03] p-4 hover:bg-red-500/[0.06] transition-all group relative">
                <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-[10px] font-bold text-red-400 uppercase tracking-wider">Shield</div>
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <ShieldCheck className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground group-hover:text-red-300 transition-colors">PHP Shield SDK</div>
                  <div className="text-xs text-muted-foreground">Anti-Tamper Protection</div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" />
              </a>
              <a href={`${SERVER_URL}/sdk/softworks-license.js`} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4 hover:bg-amber-500/[0.06] transition-all group">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <FileCode className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground group-hover:text-amber-300 transition-colors">JavaScript SDK</div>
                  <div className="text-xs text-muted-foreground">Standard (Browser + Node.js)</div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-amber-400 transition-colors" />
              </a>
              <a href={`${SERVER_URL}/sdk/softworks-license.php`} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.03] p-4 hover:bg-blue-500/[0.06] transition-all group">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <FileCode className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground group-hover:text-blue-300 transition-colors">PHP SDK</div>
                  <div className="text-xs text-muted-foreground">Standard (PHP 7.4+)</div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
              </a>
            </div>
          </StepCard>

          <StepCard
            step={3}
            title="আপনার Website-এ SDK যোগ করুন"
            titleBn="নিচে আপনার platform অনুযায়ী code কপি করে paste করুন"
            desc="আপনার project-এর root folder-এ SDK ফাইলটি রাখুন, তারপর নিচের code আপনার main ফাইলে যোগ করুন।"
            icon={Code2}
          >
            <div className="flex flex-wrap gap-2 mb-4">
              {([
                { id: "stealth" as const, label: "Stealth SDK", desc: "Invisible Protection", color: "emerald", icon: Lock },
                { id: "shield" as const, label: "Shield SDK", desc: "Anti-Tamper", color: "red", icon: ShieldCheck },
                { id: "standard" as const, label: "Standard SDK", desc: "Basic Integration", color: "amber", icon: FileCode },
              ]).map(s => (
                <button
                  key={s.id}
                  onClick={() => setSdkType(s.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    sdkType === s.id
                      ? s.color === "emerald"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-lg shadow-emerald-500/10"
                        : s.color === "red"
                        ? "border-red-500/40 bg-red-500/10 text-red-300 shadow-lg shadow-red-500/10"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-lg shadow-amber-500/10"
                      : "border-white/10 bg-white/[0.02] text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                  }`}
                >
                  <s.icon className="w-4 h-4" />
                  <div className="text-left">
                    <div className="leading-tight">{s.label}</div>
                    <div className="text-[10px] opacity-60">{s.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-white/5 overflow-hidden">
              <div className="flex border-b border-white/5 bg-white/[0.02] overflow-x-auto">
                {([
                  { id: "js" as const, label: "HTML / JS", icon: Globe },
                  { id: "php" as const, label: "PHP", icon: Server },
                  { id: "node" as const, label: "Node.js", icon: Terminal },
                  { id: "wordpress" as const, label: "WordPress", icon: Layers },
                ]).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                      tab === t.id
                        ? "text-violet-300 border-b-2 border-violet-500 bg-violet-500/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.02]"
                    }`}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="p-4">
                <CodeBlock code={codeExamples[sdkType][tab].code} lang={codeExamples[sdkType][tab].lang} />
              </div>
            </div>
          </StepCard>

          <StepCard
            step={4}
            title="Domain যুক্ত করুন ও Test করুন"
            titleBn="আপনার domain নাম license-এর সাথে connect করুন"
            desc="আপনার license activate করার সময় SDK স্বয়ংক্রিয়ভাবে আপনার domain detect করে আমাদের server-এ register করবে। আপনাকে manually কিছু করতে হবে না।"
            icon={Globe}
          >
            <div className="space-y-3">
              <div className="rounded-xl bg-[#0d0f1a] border border-white/5 p-4">
                <div className="text-xs font-mono text-muted-foreground mb-3">আপনার license activate হলে যা ঘটে:</div>
                <div className="space-y-2">
                  {[
                    { icon: Globe, text: "Domain auto-detect: yoursite.com", color: "text-cyan-400" },
                    { icon: Cpu, text: "Hardware fingerprint তৈরি হয়", color: "text-violet-400" },
                    { icon: Server, text: "IP address record হয়", color: "text-amber-400" },
                    { icon: ShieldCheck, text: "HMAC signed response আসে", color: "text-emerald-400" },
                    { icon: RefreshCw, text: "Auto heartbeat শুরু হয়", color: "text-blue-400" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
                      <span className="text-sm text-slate-300">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-emerald-300 mb-1">Test করুন</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      আপনার website open করুন এবং browser-এর Developer Console (F12) দেখুন।
                      সফল হলে <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[11px]">License সক্রিয়!</code> message দেখাবে।
                      সমস্যা হলে error message দেখে আমাদের সাথে যোগাযোগ করুন।
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </StepCard>
        </div>
      </div>

      {/* API Endpoints Reference */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">API Endpoints</span>
          </h2>
          <p className="text-sm text-muted-foreground">আপনি চাইলে SDK ছাড়াও সরাসরি API ব্যবহার করতে পারেন</p>
        </div>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Method</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Endpoint</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">বিবরণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { method: "POST", endpoint: "/api/license/activate", desc: "License সক্রিয় করুন (প্রথমবার)" },
                { method: "POST", endpoint: "/api/license/validate", desc: "License verify করুন (প্রতিবার)" },
                { method: "POST", endpoint: "/api/license/heartbeat", desc: "Heartbeat পাঠান (auto-check)" },
                { method: "POST", endpoint: "/api/license/deactivate", desc: "License নিষ্ক্রিয় করুন" },
                { method: "GET", endpoint: "/api/license/check/:key", desc: "Public verification (কোনো auth লাগে না)" },
              ].map((r, i) => (
                <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-5 py-3">
                    <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${r.method === "GET" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {r.method}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-violet-300">{r.endpoint}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 py-12 pb-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">সাধারণ প্রশ্নোত্তর (FAQ)</span>
          </h2>
        </div>
        <div className="space-y-2">
          <FaqItem q="License key কিভাবে পাব?" a="SOFTWORKS IT FARM-এর সাথে যোগাযোগ করুন অথবা আমাদের SaaS প্যানেল থেকে সরাসরি কিনুন। আপনার email-এ key পাঠানো হবে। key ফরম্যাট: SW-XXXX-XXXX-XXXX" />
          <FaqItem q="একটি key কতগুলো website-এ ব্যবহার করা যাবে?" a="এটি আপনার license plan-এর উপর নির্ভর করে। Single-site plan-এ ১টি domain, Multi-site plan-এ ৩-৫টি domain, এবং Unlimited plan-এ যেকোনো সংখ্যক domain-এ ব্যবহার করা যাবে। Admin Panel থেকে max activations সেট করা হয়।" />
          <FaqItem q="Domain পরিবর্তন করলে কি হবে?" a="আপনার পুরনো domain-এর activation deactivate করুন (SDK-এর deactivate() method দিয়ে), তারপর নতুন domain-এ আবার activate করুন। অথবা আমাদের সাথে যোগাযোগ করলে Admin Panel থেকে 'Reset Activations' করে দেওয়া হবে।" />
          <FaqItem q="Internet না থাকলে কি হবে?" a="License validate করতে internet connection লাগে। তবে Grace Period আছে — শেষ successful validation-এর পর ৩ দিন পর্যন্ত কাজ করবে। এরপর license check ব্যর্থ হবে।" />
          <FaqItem q="WordPress-এ কিভাবে ব্যবহার করব?" a="উপরের WordPress tab-এ দেখানো code follow করুন। softworks-license.php ফাইলটি আপনার plugin folder-এ রাখুন, তারপর plugin-এর main file-এ require করুন এবং license check করুন। Settings page-এ License key input রাখতে পারেন।" />
          <FaqItem q="Kill Switch কি?" a="Admin Panel থেকে যেকোনো সময় একটি license-এর Kill Switch ON করলে সেই license তৎক্ষণাৎ কাজ করা বন্ধ করবে — client-এর পরবর্তী validate/heartbeat call-এ license invalid দেখাবে। Emergency situation-এ খুবই কার্যকর।" />
          <FaqItem q="Trial license কিভাবে কাজ করে?" a="Trial license ৭ দিনের জন্য দেওয়া হয়। Trial শেষ হলে license automatically expired হয়ে যায়। Trial থেকে paid plan-এ upgrade করা যায়।" />
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.05] to-cyan-500/[0.05] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/10 rounded-full blur-[60px]" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-[60px]" />
          <div className="relative z-10">
            <Zap className="w-10 h-10 text-violet-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">আজই শুরু করুন!</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              আপনার software protect করতে SOFTWORKS License System ব্যবহার করুন।
              আমাদের সাথে যোগাযোগ করুন অথবা SaaS panel-এ sign up করুন।
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="/contact" className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium text-sm hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/20 flex items-center gap-2">
                যোগাযোগ করুন <ArrowRight className="w-4 h-4" />
              </a>
              <a href="/saas" className="px-6 py-3 rounded-xl border border-white/10 text-foreground font-medium text-sm hover:bg-white/[0.03] transition-all flex items-center gap-2">
                SaaS Products দেখুন <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, labelBn, value }: { label: string; labelBn: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-sm font-semibold text-foreground mt-0.5">{value}</div>
    </div>
  );
}
