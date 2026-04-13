import { pgTable, text, serial, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";

export interface VoiceCallOption {
  key: string;
  label: string;
  action: string;
  color: "green" | "red" | "yellow" | "blue" | "purple";
  responseText: string;
  responseAudioUrl: string | null;
  enabled: boolean;
}

export interface VoiceCallProduct {
  name: string;
  price: number;
  quantity: number;
  deliveryDays?: number;
  imageUrl?: string;
}

export const voiceCallConfigsTable = pgTable("voice_call_configs", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").default("SOFTWORKS IT FARM"),
  logoUrl: text("logo_url"),
  welcomeAudioUrl: text("welcome_audio_url"),
  welcomeText: text("welcome_text").default("আপনার অর্ডারের জন্য ধন্যবাদ!"),
  announcementAudioUrl: text("announcement_audio_url"),
  announcementText: text("announcement_text").default("নিচের বিকল্পগুলি থেকে আপনার পছন্দ করুন।"),
  options: jsonb("options").$type<VoiceCallOption[]>().default([
    { key: "1", label: "Confirm Order", action: "confirmed", color: "green", responseText: "আপনার অর্ডার সফলভাবে confirmed হয়েছে। ধন্যবাদ!", responseAudioUrl: null, enabled: true },
    { key: "2", label: "Cancel Order", action: "cancelled", color: "red", responseText: "আপনার অর্ডার cancelled হয়েছে।", responseAudioUrl: null, enabled: true },
  ]),
  ttsVoice: text("tts_voice").default("nova"),
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
  products: jsonb("products").$type<VoiceCallProduct[]>(),
  deliveryInfo: text("delivery_info"),
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
