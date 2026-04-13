import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const voiceCallConfigsTable = pgTable("voice_call_configs", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").default("SOFTWORKS IT FARM"),
  welcomeAudioUrl: text("welcome_audio_url"),
  menuAudioUrl: text("menu_audio_url"),
  menuText: text("menu_text").default("আপনার অর্ডার confirm করতে 1 চাপুন। Cancel করতে 2 চাপুন।"),
  confirmAudioUrl: text("confirm_audio_url"),
  confirmText: text("confirm_text").default("আপনার অর্ডার সফলভাবে confirmed হয়েছে। ধন্যবাদ।"),
  cancelAudioUrl: text("cancel_audio_url"),
  cancelText: text("cancel_text").default("আপনার অর্ডার cancelled হয়েছে।"),
  sessionExpiryMinutes: integer("session_expiry_minutes").default(30),
  enabled: boolean("enabled").default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const voiceCallSessionsTable = pgTable("voice_call_sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  orderId: text("order_id").notNull(),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  orderAmount: text("order_amount"),
  orderDetails: text("order_details"),
  ecommerceWebhookUrl: text("ecommerce_webhook_url"),
  ecommerceSiteUrl: text("ecommerce_site_url"),
  status: text("status").default("pending"),
  dtmfInput: text("dtmf_input"),
  actionTaken: text("action_taken"),
  webhookSent: boolean("webhook_sent").default(false),
  webhookResponse: text("webhook_response"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
