import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { FileCode2, Copy, CheckCircle2, Globe, Zap, ShoppingCart, Code2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || (import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "");
const FRONTEND = typeof window !== "undefined" ? window.location.origin : "https://softworksit.vercel.app";

function CodeBlock({ code, lang = "js" }: { code: string; lang?: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Copied!" });
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="relative group">
      <pre className="bg-black/60 border border-white/10 rounded-xl p-4 overflow-x-auto text-sm font-mono text-green-300 leading-relaxed">
        <code>{code}</code>
      </pre>
      <button onClick={copy} className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition text-white/60 hover:text-white">
        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function Section({ id, title, icon: Icon, children }: { id: string; title: string; icon: React.ComponentType<{className?: string}>; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-indigo-400" />
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function VoiceCallApiDocsPage() {
  const [activeTab, setActiveTab] = useState<"js" | "php" | "python" | "woo">("js");

  const initiateExamples = {
    js: `// Step 1: Include our widget (add to your HTML <head>)
<script src="${API}/api/voice-calls/widget.js"></script>

// Step 2: Configure with your frontend URL
SoftworksCall.configure({ frontendUrl: '${FRONTEND}' });

// Step 3: After order placement, call your backend to initiate
// (Your backend calls our API — see server-side examples below)
// Then show the overlay with the token:
SoftworksCall.show(token, {
  onComplete: function(result) {
    console.log('Action:', result.action);  // 'confirmed' | 'cancelled' | custom
    console.log('Order ID:', result.orderId);
    // Update your order status here
  }
});`,
    php: `<?php
// Called from your order confirmation handler

$apiUrl = '${API}/api/voice-calls/initiate';

$data = [
    'orderId'             => $order->get_id(),
    'customerName'        => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
    'customerPhone'       => $order->get_billing_phone(),
    'orderAmount'         => '৳ ' . number_format($order->get_total(), 2),
    'orderDetails'        => 'Order summary here',
    'products'            => array_map(fn($item) => [
        'name'         => $item->get_name(),
        'price'        => (float) $item->get_product()->get_price(),
        'quantity'     => $item->get_quantity(),
        'deliveryDays' => 3,
    ], $order->get_items()),
    'deliveryInfo'        => '3-5 business days',
    'ecommerceWebhookUrl' => home_url('/api/order-webhook'),
    'ecommerceSiteUrl'    => home_url(),
];

$response = wp_remote_post($apiUrl, [
    'headers' => ['Content-Type' => 'application/json'],
    'body'    => json_encode($data),
    'timeout' => 15,
]);

$body  = json_decode(wp_remote_retrieve_body($response), true);
$token = $body['token'];  // Pass this to your frontend JS
?>

<!-- In your order confirmation page: -->
<script src="${API}/api/voice-calls/widget.js"></script>
<script>
SoftworksCall.configure({ frontendUrl: '${FRONTEND}' });
SoftworksCall.show('<?php echo esc_js($token); ?>', {
    onComplete: function(r) {
        fetch('/update-order', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ orderId: r.orderId, status: r.action })
        });
    }
});
</script>`,
    python: `import requests
import json

# Django/Flask example

def order_confirmation_view(request):
    order = get_order(request)
    
    # Call Softworks API
    response = requests.post(
        '${API}/api/voice-calls/initiate',
        json={
            'orderId': str(order.id),
            'customerName': order.customer_name,
            'customerPhone': order.phone,
            'orderAmount': f'৳ {order.total:.2f}',
            'products': [
                {
                    'name': item.name,
                    'price': float(item.price),
                    'quantity': item.quantity,
                    'deliveryDays': 3,
                }
                for item in order.items.all()
            ],
            'deliveryInfo': '3-5 business days',
            'ecommerceWebhookUrl': request.build_absolute_uri('/webhook/order/'),
            'ecommerceSiteUrl': 'https://yourstore.com',
        },
        timeout=15,
    )
    
    data = response.json()
    token = data['token']
    
    # Pass token to template
    return render(request, 'order_confirmation.html', {'call_token': token})

# Webhook endpoint (receives order status updates)
def order_webhook(request):
    data = json.loads(request.body)
    order_id = data['orderId']
    action   = data['action']  # 'confirmed' | 'cancelled'
    
    order = Order.objects.get(id=order_id)
    order.status = 'confirmed' if action == 'confirmed' else 'cancelled'
    order.save()
    
    return JsonResponse({'ok': True})`,
    woo: `<?php
// WooCommerce Integration
// Add to your theme's functions.php or a custom plugin

// Step 1: Show auto call overlay after order placement
add_action('woocommerce_thankyou', 'softworks_auto_call', 10, 1);

function softworks_auto_call($order_id) {
    $order = wc_get_order($order_id);
    if (!$order) return;
    
    // Build products array
    $products = [];
    foreach ($order->get_items() as $item) {
        $product = $item->get_product();
        $products[] = [
            'name'         => $item->get_name(),
            'price'        => (float) ($product ? $product->get_price() : 0),
            'quantity'     => $item->get_quantity(),
            'deliveryDays' => 3,
        ];
    }
    
    // Call Softworks API (server-side)
    $response = wp_remote_post('${API}/api/voice-calls/initiate', [
        'headers' => ['Content-Type' => 'application/json'],
        'body'    => json_encode([
            'orderId'             => (string) $order_id,
            'customerName'        => $order->get_formatted_billing_full_name(),
            'customerPhone'       => $order->get_billing_phone(),
            'orderAmount'         => '৳ ' . number_format($order->get_total(), 0),
            'products'            => $products,
            'deliveryInfo'        => '3-5 business days delivery',
            'ecommerceWebhookUrl' => get_rest_url(null, 'softworks/v1/webhook'),
            'ecommerceSiteUrl'    => home_url(),
        ]),
        'timeout' => 15,
    ]);
    
    $body  = json_decode(wp_remote_retrieve_body($response), true);
    $token = $body['token'] ?? '';
    
    if (!$token) return;
    
    // Output JS to show the overlay
    echo '<script src="${API}/api/voice-calls/widget.js"></script>';
    echo '<script>';
    echo 'SoftworksCall.configure({ frontendUrl: "' . esc_js('${FRONTEND}') . '" });';
    echo 'document.addEventListener("DOMContentLoaded", function() {';
    echo '  SoftworksCall.show("' . esc_js($token) . '", {';
    echo '    onComplete: function(r) {';
    echo '      fetch("' . esc_js(get_rest_url(null, 'softworks/v1/update')) . '", {';
    echo '        method: "POST",';
    echo '        headers: {"Content-Type":"application/json","X-WP-Nonce":"' . wp_create_nonce('wp_rest') . '"},';
    echo '        body: JSON.stringify({ orderId: r.orderId, action: r.action })';
    echo '      });';
    echo '    }';
    echo '  });';
    echo '});';
    echo '</script>';
}

// Step 2: Register webhook endpoint
add_action('rest_api_init', function() {
    register_rest_route('softworks/v1', '/webhook', [
        'methods'  => 'POST',
        'callback' => 'softworks_handle_webhook',
        'permission_callback' => '__return_true',
    ]);
});

function softworks_handle_webhook(WP_REST_Request $request) {
    $data     = $request->get_json_params();
    $order_id = absint($data['orderId'] ?? 0);
    $action   = sanitize_key($data['action'] ?? '');
    
    $order = wc_get_order($order_id);
    if (!$order) return new WP_Error('not_found', 'Order not found', ['status' => 404]);
    
    if ($action === 'confirmed') {
        $order->update_status('processing', 'Order confirmed via auto-call.');
    } elseif ($action === 'cancelled') {
        $order->update_status('cancelled', 'Order cancelled via auto-call.');
    }
    
    return rest_ensure_response(['ok' => true]);
}`,
  };

  const webhookExample = `// Webhook payload sent to your ecommerceWebhookUrl:
POST https://your-shop.com/api/webhook

{
  "orderId":    "ORD-12345",
  "action":     "confirmed",       // the action set for the pressed key
  "status":     "confirmed",
  "dtmfInput":  "1",               // which key was pressed
  "customerName": "Rahim Uddin",
  "token":      "abc123..."
}`;

  const initiatePayload = `POST ${API}/api/voice-calls/initiate
Content-Type: application/json

{
  "orderId":             "ORD-12345",          // required
  "customerName":        "Rahim Uddin",
  "customerPhone":       "01700000000",
  "orderAmount":         "৳ 2,500",
  "orderDetails":        "2x T-Shirt, 1x Shoe",
  "products": [
    {
      "name":         "Premium T-Shirt",
      "price":        800,
      "quantity":     2,
      "deliveryDays": 3
    },
    {
      "name":         "Running Shoe",
      "price":        900,
      "quantity":     1,
      "deliveryDays": 5
    }
  ],
  "deliveryInfo":        "3-5 business days",
  "ecommerceWebhookUrl": "https://your-shop.com/api/webhook",
  "ecommerceSiteUrl":    "https://your-shop.com"
}

// Response:
{
  "token":   "abc123def456...",
  "callUrl": "${FRONTEND}/call/abc123def456...",
  "session": { "id": 1, "orderId": "ORD-12345", ... }
}`;

  const ttsExample = `POST ${API}/api/voice-calls/tts
Content-Type: application/json

{
  "text":  "আপনার অর্ডার সফলভাবে confirmed হয়েছে। ধন্যবাদ!",
  "voice": "nova"        // nova | alloy | echo | fable | onyx | shimmer
}

// Response:
{
  "url":      "${API}/api/voice-calls/audio/1234567890-xyz.mp3",
  "filename": "1234567890-xyz.mp3"
}`;

  const tabs = [
    { key: "js" as const, label: "JavaScript" },
    { key: "php" as const, label: "PHP" },
    { key: "python" as const, label: "Python / Django" },
    { key: "woo" as const, label: "WooCommerce" },
  ];

  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "initiate", label: "Initiate Call" },
    { id: "widget", label: "Widget / Overlay" },
    { id: "webhook", label: "Webhook" },
    { id: "tts", label: "Text-to-Speech" },
    { id: "examples", label: "Code Examples" },
  ];

  return (
    <AdminLayout>
      <div className="flex gap-0 min-h-screen">
        <div className="hidden lg:block w-52 shrink-0 sticky top-0 h-screen border-r border-white/10 py-6 px-3">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-4 px-2">API Reference</p>
          <nav className="space-y-0.5">
            {navItems.map(n => (
              <a key={n.id} href={`#${n.id}`}
                className="block px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="mt-8 mx-2 p-3 bg-indigo-500/10 rounded-xl border border-indigo-400/20">
            <p className="text-xs text-indigo-300 font-medium mb-1">API Base URL</p>
            <p className="text-xs text-white/50 break-all font-mono">{API}</p>
          </div>
        </div>

        <div className="flex-1 p-6 max-w-4xl space-y-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <FileCode2 className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Auto Call API Documentation</h1>
                <p className="text-white/40 text-sm">Integrate browser-based order confirmation calls</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { icon: Zap, label: "No App Required", desc: "Works in any browser" },
                { icon: ShoppingCart, label: "Any E-Commerce", desc: "PHP, Python, JS, WooCommerce" },
                { icon: Globe, label: "Fully Self-Hosted", desc: "Your server, your data" },
              ].map(f => (
                <div key={f.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <f.icon className="w-5 h-5 text-indigo-400 mb-2" />
                  <p className="text-white text-sm font-medium">{f.label}</p>
                  <p className="text-white/40 text-xs">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <Section id="overview" title="How It Works" icon={Zap}>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="space-y-3">
                {[
                  ["1", "Customer places order on your e-commerce site"],
                  ["2", "Your server calls POST /api/voice-calls/initiate → gets a token"],
                  ["3", "Your page loads SoftworksCall widget and calls SoftworksCall.show(token)"],
                  ["4", "Call overlay appears automatically on the same page (no redirect!)"],
                  ["5", "Customer sees their order details, hears welcome voice, sees key options"],
                  ["6", "Customer presses a key → your webhook receives the result → order updates"],
                ].map(([n, t]) => (
                  <div key={n} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs flex items-center justify-center shrink-0 font-bold">{n}</span>
                    <p className="text-white/70 text-sm">{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section id="initiate" title="POST /api/voice-calls/initiate" icon={Code2}>
            <p className="text-white/50 text-sm mb-3">Create a new call session. Call this from your server after order placement.</p>
            <CodeBlock code={initiatePayload} />
          </Section>

          <Section id="widget" title="Widget / Overlay Script" icon={Globe}>
            <p className="text-white/50 text-sm mb-3">Include this script on your order confirmation page to show the call overlay automatically.</p>
            <CodeBlock code={`<!-- Step 1: Include the widget script in your HTML <head> -->
<script src="${API}/api/voice-calls/widget.js"></script>

<!-- Step 2: Configure and show after getting token from your server -->
<script>
// Configure once (usually in your app initialization)
SoftworksCall.configure({
  frontendUrl: '${FRONTEND}'
});

// Show overlay with token (call this after getting token from server)
SoftworksCall.show(token, {
  onComplete: function(result) {
    // result.action   = 'confirmed' | 'cancelled' | custom
    // result.orderId  = your order ID
    // result.dtmfInput = key that was pressed ('1', '2', etc.)
    
    console.log('Customer chose:', result.action);
    
    // Update your order status
    updateOrderStatus(result.orderId, result.action);
  }
});

// You can also hide it programmatically
// SoftworksCall.hide();
</script>`} />
          </Section>

          <Section id="webhook" title="Webhook (Auto Order Update)" icon={Zap}>
            <p className="text-white/50 text-sm mb-3">When a customer presses a key, we send a POST request to your <code className="text-indigo-300">ecommerceWebhookUrl</code>.</p>
            <CodeBlock code={webhookExample} />
          </Section>

          <Section id="tts" title="Text-to-Speech API" icon={Code2}>
            <p className="text-white/50 text-sm mb-3">Convert text to human-like voice. Generated audio can be used in call sessions.</p>
            <CodeBlock code={ttsExample} />
            <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/70 text-sm font-medium mb-2">Available Voices</p>
              <div className="grid grid-cols-3 gap-2">
                {["nova (female, warm)", "alloy (neutral)", "echo (male)", "fable (expressive)", "onyx (deep)", "shimmer (soft)"].map(v => (
                  <code key={v} className="text-xs text-indigo-300 bg-indigo-500/10 rounded px-2 py-1">{v}</code>
                ))}
              </div>
            </div>
          </Section>

          <Section id="examples" title="Complete Code Examples" icon={Code2}>
            <div className="flex gap-1 mb-4 bg-white/5 rounded-xl p-1 w-fit border border-white/10">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? "bg-indigo-600 text-white" : "text-white/50 hover:text-white"}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <CodeBlock code={initiateExamples[activeTab]} lang={activeTab === "woo" || activeTab === "php" ? "php" : activeTab} />
          </Section>

          <div className="bg-indigo-500/10 border border-indigo-400/20 rounded-xl p-5">
            <h3 className="text-indigo-300 font-semibold mb-2">Quick Start Checklist</h3>
            <div className="space-y-2">
              {[
                "Configure your call options in Admin → Auto Calling → Call Config",
                "Upload welcome, confirm, and cancel audio files (or generate with TTS)",
                "Add the widget script to your order confirmation page",
                "Call POST /api/voice-calls/initiate from your server",
                "Pass the token to SoftworksCall.show(token) in your frontend",
                "Set up your webhook endpoint to receive order status updates",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-white/60 text-sm">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
