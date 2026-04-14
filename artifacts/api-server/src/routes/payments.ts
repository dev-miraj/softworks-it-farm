/**
 * Payment Routes — SSLCommerz (Bangladesh) + Stripe (Global)
 *
 * SSLCommerz env vars:
 *   SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASS, SSLCOMMERZ_SANDBOX (true/false)
 *
 * Stripe env vars:
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 */
import { Router } from "express";
import { requireAuth } from "../lib/auth.js";
import { createSubscription } from "../lib/subscription.js";
import { enqueue } from "../lib/queue.js";
import { logger } from "../lib/logger.js";

const router = Router();

// ── SSLCommerz ────────────────────────────────────────────────────────────────

const PLAN_PRICES: Record<string, { taka: number; label: string }> = {
  pro:        { taka: 2500, label: "SOFTWORKS Pro Plan (30 days)" },
  enterprise: { taka: 9999, label: "SOFTWORKS Enterprise Plan (30 days)" },
};

function isSslConfigured(): boolean {
  return !!(process.env["SSLCOMMERZ_STORE_ID"] && process.env["SSLCOMMERZ_STORE_PASS"]);
}

function isStripeConfigured(): boolean {
  return !!process.env["STRIPE_SECRET_KEY"];
}

/**
 * POST /payments/sslcommerz/init
 * Initiates an SSLCommerz payment session and returns the payment URL.
 */
router.post("/payments/sslcommerz/init", requireAuth, async (req, res) => {
  if (!isSslConfigured()) {
    res.status(503).json({
      success: false,
      error: "SSLCommerz is not configured. Set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASS.",
    });
    return;
  }

  const user = (req as any).user;
  const { plan, customerName, customerEmail, customerPhone } = req.body;

  if (!plan || !PLAN_PRICES[plan]) {
    res.status(400).json({ success: false, error: "Invalid plan. Choose: pro, enterprise" });
    return;
  }

  const price = PLAN_PRICES[plan];
  const tranId = `SW-${Date.now()}-${user.username.slice(0, 6).toUpperCase()}`;
  const isSandbox = process.env["SSLCOMMERZ_SANDBOX"] !== "false";
  const baseUrl = isSandbox
    ? "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
    : "https://securepay.sslcommerz.com/gwprocess/v4/api.php";

  const frontendBase =
    process.env["ALLOWED_ORIGINS"]?.split(",")[0]?.trim() ||
    "https://softworksit.vercel.app";

  const params = new URLSearchParams({
    store_id:       process.env["SSLCOMMERZ_STORE_ID"]!,
    store_passwd:   process.env["SSLCOMMERZ_STORE_PASS"]!,
    total_amount:   String(price.taka),
    currency:       "BDT",
    tran_id:        tranId,
    success_url:    `${frontendBase}/payment/success?tran_id=${tranId}&plan=${plan}&username=${user.username}`,
    fail_url:       `${frontendBase}/payment/fail`,
    cancel_url:     `${frontendBase}/payment/cancel`,
    ipn_url:        `${process.env["API_BASE_URL"] || ""}/api/payments/sslcommerz/ipn`,
    product_name:   price.label,
    product_category: "Software",
    product_profile: "non-physical-goods",
    cus_name:       customerName || user.username,
    cus_email:      customerEmail || `${user.username}@softworksit.com`,
    cus_phone:      customerPhone || "017XXXXXXXX",
    cus_add1:       "Dhaka",
    cus_city:       "Dhaka",
    cus_country:    "Bangladesh",
    shipping_method: "NO",
    num_of_item:    "1",
    weight_of_items: "0",
    product_amount: String(price.taka),
    vat:            "0",
    discount_amount: "0",
    convenience_fee: "0",
    value_a:        user.username,
    value_b:        plan,
    value_c:        tranId,
  });

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json() as Record<string, unknown>;

    if (data["status"] !== "SUCCESS") {
      logger.error({ data }, "SSLCommerz init failed");
      res.status(502).json({ success: false, error: "Payment gateway error", details: data["failedreason"] });
      return;
    }

    logger.info({ tranId, plan, username: user.username }, "SSLCommerz session initiated");
    res.json({
      success: true,
      data: {
        tranId,
        redirectUrl: data["GatewayPageURL"],
        sessionKey: data["sessionkey"],
        plan,
        amount: price.taka,
        currency: "BDT",
      },
    });
  } catch (err) {
    logger.error({ err }, "SSLCommerz init request failed");
    res.status(500).json({ success: false, error: "Failed to connect to payment gateway" });
  }
});

/**
 * POST /payments/sslcommerz/ipn
 * Webhook from SSLCommerz after payment is completed
 */
router.post("/payments/sslcommerz/ipn", async (req, res) => {
  const { status, tran_id, val_id, amount, currency, value_a, value_b } = req.body;

  logger.info({ status, tran_id, amount, username: value_a, plan: value_b }, "SSLCommerz IPN received");

  if (status !== "VALID" && status !== "VALIDATED") {
    res.json({ success: false, message: "Payment not valid" });
    return;
  }

  const username = value_a as string;
  const plan = value_b as string;

  if (!username || !plan || !["pro", "enterprise"].includes(plan)) {
    res.json({ success: false, message: "Invalid IPN data" });
    return;
  }

  // Verify with SSLCommerz validation API
  if (isSslConfigured()) {
    try {
      const isSandbox = process.env["SSLCOMMERZ_SANDBOX"] !== "false";
      const validationUrl = isSandbox
        ? "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"
        : "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php";

      const verifyRes = await fetch(
        `${validationUrl}?val_id=${val_id}&store_id=${process.env["SSLCOMMERZ_STORE_ID"]}&store_passwd=${process.env["SSLCOMMERZ_STORE_PASS"]}&format=json`,
      );
      const verifyData = await verifyRes.json() as Record<string, unknown>;

      if (verifyData["status"] !== "VALID" && verifyData["status"] !== "VALIDATED") {
        logger.warn({ tran_id, verifyData }, "SSLCommerz validation failed");
        res.json({ success: false, message: "Validation failed" });
        return;
      }
    } catch (err) {
      logger.error({ err }, "SSLCommerz validation request failed");
    }
  }

  // Activate subscription
  try {
    await createSubscription(username, plan as "pro" | "enterprise", 30);

    // Send confirmation email
    await enqueue("send_email", {
      to: `${username}@softworksit.com`,
      subject: `✅ Payment Confirmed — ${plan.toUpperCase()} Plan Activated`,
      html: `<p>Your <strong>${plan.toUpperCase()}</strong> subscription has been activated. Transaction ID: <code>${tran_id}</code></p>`,
    });

    logger.info({ tran_id, username, plan }, "Subscription activated after SSLCommerz payment");
    res.json({ success: true, message: "Subscription activated" });
  } catch (err) {
    logger.error({ err, tran_id, username }, "Failed to activate subscription after IPN");
    res.status(500).json({ success: false, message: "Subscription activation failed" });
  }
});

// ── Stripe ────────────────────────────────────────────────────────────────────

const STRIPE_PLAN_PRICES: Record<string, number> = {
  pro:        29_00,
  enterprise: 99_00,
};

/**
 * POST /payments/stripe/checkout
 * Creates a Stripe Checkout session
 */
router.post("/payments/stripe/checkout", requireAuth, async (req, res) => {
  if (!isStripeConfigured()) {
    res.status(503).json({
      success: false,
      error: "Stripe is not configured. Set STRIPE_SECRET_KEY.",
    });
    return;
  }

  const user = (req as any).user;
  const { plan } = req.body;

  if (!plan || !STRIPE_PLAN_PRICES[plan]) {
    res.status(400).json({ success: false, error: "Invalid plan. Choose: pro, enterprise" });
    return;
  }

  const frontendBase =
    process.env["ALLOWED_ORIGINS"]?.split(",")[0]?.trim() ||
    "https://softworksit.vercel.app";

  try {
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env["STRIPE_SECRET_KEY"]}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "payment_method_types[]": "card",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][unit_amount]": String(STRIPE_PLAN_PRICES[plan]),
        "line_items[0][price_data][product_data][name]": `SOFTWORKS ${plan.toUpperCase()} Plan`,
        "line_items[0][quantity]": "1",
        mode: "payment",
        success_url: `${frontendBase}/payment/success?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendBase}/payment/cancel`,
        "metadata[username]": user.username,
        "metadata[plan]": plan,
      }).toString(),
    });

    const session = await response.json() as Record<string, unknown>;
    if (session["error"]) {
      logger.error({ session }, "Stripe checkout session error");
      res.status(502).json({ success: false, error: (session["error"] as any)?.message ?? "Stripe error" });
      return;
    }

    logger.info({ sessionId: session["id"], plan, username: user.username }, "Stripe checkout session created");
    res.json({ success: true, data: { checkoutUrl: session["url"], sessionId: session["id"] } });
  } catch (err) {
    logger.error({ err }, "Stripe checkout request failed");
    res.status(500).json({ success: false, error: "Failed to create checkout session" });
  }
});

/**
 * POST /payments/stripe/webhook
 * Stripe webhook — must be whitelisted from CSRF
 */
router.post("/payments/stripe/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];

  let event: Record<string, unknown>;

  if (webhookSecret && sig) {
    try {
      const crypto = await import("node:crypto");
      const rawBody = JSON.stringify(req.body);
      const [, ts, , v1] = String(sig).split(/[,=]/);
      const signed = `${ts}.${rawBody}`;
      const expected = crypto
        .createHmac("sha256", webhookSecret)
        .update(signed)
        .digest("hex");

      if (v1 !== expected) {
        res.status(400).json({ error: "Invalid signature" });
        return;
      }

      event = req.body as Record<string, unknown>;
    } catch (err) {
      logger.error({ err }, "Stripe webhook signature verification failed");
      res.status(400).json({ error: "Webhook error" });
      return;
    }
  } else {
    event = req.body as Record<string, unknown>;
  }

  const type = event["type"] as string;
  logger.info({ type }, "Stripe webhook received");

  if (type === "checkout.session.completed") {
    const session = event["data"] as Record<string, unknown>;
    const obj = session["object"] as Record<string, unknown>;
    const metadata = obj["metadata"] as Record<string, string> | undefined;

    if (metadata?.username && metadata?.plan) {
      try {
        await createSubscription(metadata.username, metadata.plan as "pro" | "enterprise", 30);
        logger.info({ username: metadata.username, plan: metadata.plan }, "Stripe: subscription activated");
      } catch (err) {
        logger.error({ err }, "Stripe: subscription activation failed");
      }
    }
  }

  res.json({ received: true });
});

/**
 * GET /payments/status
 * Returns which payment gateways are configured
 */
router.get("/payments/status", async (_req, res) => {
  res.json({
    success: true,
    data: {
      sslcommerz: {
        enabled: isSslConfigured(),
        sandbox: process.env["SSLCOMMERZ_SANDBOX"] !== "false",
      },
      stripe: {
        enabled: isStripeConfigured(),
      },
    },
  });
});

export default router;
