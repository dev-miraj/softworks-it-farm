/**
 * Email Service — nodemailer with SMTP
 * Env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *   SMTP_FROM  (default: noreply@softworksit.com)
 *   SMTP_SECURE (optional, "true" for TLS)
 *
 * Falls back gracefully when SMTP is not configured.
 */
import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "./logger.js";

export interface EmailPayload {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

let _transporter: Transporter | null = null;
let _from = "SOFTWORKS IT FARM <noreply@softworksit.com>";

function getTransporter(): Transporter | null {
  if (_transporter) return _transporter;

  const host = process.env["SMTP_HOST"];
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASS"];
  const from = process.env["SMTP_FROM"];

  if (!host || !user || !pass) {
    logger.warn("Email: SMTP not configured — email sending disabled");
    return null;
  }

  if (from) _from = from;

  _transporter = nodemailer.createTransport({
    host,
    port: Number(process.env["SMTP_PORT"] ?? 587),
    secure: process.env["SMTP_SECURE"] === "true",
    auth: { user, pass },
    pool: true,
    maxConnections: 5,
  });

  logger.info({ host, user }, "Email: SMTP transporter ready");
  return _transporter;
}

export function isEmailEnabled(): boolean {
  return !!(
    process.env["SMTP_HOST"] &&
    process.env["SMTP_USER"] &&
    process.env["SMTP_PASS"]
  );
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    logger.warn({ to: payload.to, subject: payload.subject }, "Email: skipped (SMTP not configured)");
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: _from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo,
    });
    logger.info({ to: payload.to, subject: payload.subject, messageId: info.messageId }, "Email: sent");
    return true;
  } catch (err) {
    logger.error({ err, to: payload.to, subject: payload.subject }, "Email: send failed");
    return false;
  }
}

export const EmailTemplates = {
  welcome: (name: string, loginUrl: string): EmailPayload => ({
    to: "",
    subject: "Welcome to SOFTWORKS IT FARM",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px">
        <h1 style="color:#38bdf8;margin-bottom:8px">Welcome, ${name}!</h1>
        <p>Your account has been created on <strong>SOFTWORKS IT FARM</strong>.</p>
        <a href="${loginUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#0ea5e9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Login to Dashboard</a>
        <p style="margin-top:24px;font-size:12px;color:#64748b">If you did not request this, please ignore this email.</p>
      </div>
    `,
  }),

  subscriptionUpgraded: (name: string, plan: string, expiry: string): EmailPayload => ({
    to: "",
    subject: `Your SOFTWORKS plan has been upgraded to ${plan.toUpperCase()}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px">
        <h1 style="color:#34d399;margin-bottom:8px">Plan Upgraded!</h1>
        <p>Hi <strong>${name}</strong>, your subscription has been upgraded to <strong>${plan.toUpperCase()}</strong>.</p>
        <p style="color:#94a3b8">Valid until: <strong style="color:#e2e8f0">${expiry}</strong></p>
        <p style="margin-top:24px;font-size:12px;color:#64748b">Thank you for choosing SOFTWORKS IT FARM.</p>
      </div>
    `,
  }),

  suspiciousLogin: (username: string, ip: string, time: string): EmailPayload => ({
    to: "",
    subject: "⚠️ Suspicious Login Detected — SOFTWORKS",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px">
        <h1 style="color:#f87171;margin-bottom:8px">Suspicious Login Alert</h1>
        <p>A login was detected for <strong>${username}</strong>:</p>
        <ul style="color:#94a3b8">
          <li>IP: <strong style="color:#e2e8f0">${ip}</strong></li>
          <li>Time: <strong style="color:#e2e8f0">${time}</strong></li>
        </ul>
        <p>If this was not you, please change your password immediately.</p>
      </div>
    `,
  }),

  reportReady: (name: string, reportUrl: string): EmailPayload => ({
    to: "",
    subject: "Your SOFTWORKS Report is Ready",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px">
        <h1 style="color:#a78bfa;margin-bottom:8px">Report Ready</h1>
        <p>Hi <strong>${name}</strong>, your requested report has been generated.</p>
        <a href="${reportUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#8b5cf6;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Download Report</a>
      </div>
    `,
  }),
};
