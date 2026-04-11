import { pgTable, text, serial, timestamp, integer, boolean, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const licenseProductsTable = pgTable("license_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  category: text("category").notNull().default("web"),
  version: text("version").default("1.0.0"),
  pricingMonthly: numeric("pricing_monthly").default("0"),
  pricingYearly: numeric("pricing_yearly").default("0"),
  pricingLifetime: numeric("pricing_lifetime").default("0"),
  trialDays: integer("trial_days").default(7),
  maxDomains: integer("max_domains").default(1),
  maxActivations: integer("max_activations").default(1),
  features: text("features").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const licensesTable = pgTable("licenses", {
  id: serial("id").primaryKey(),
  licenseKey: text("license_key").notNull().unique(),
  productId: integer("product_id"),
  productName: text("product_name").notNull(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  domain: text("domain"),
  domains: text("domains").array(),
  ipAddress: text("ip_address"),
  ipAddresses: text("ip_addresses").array(),
  hardwareId: text("hardware_id"),
  hardwareIds: text("hardware_ids").array(),
  expiryDate: text("expiry_date"),
  status: text("status").notNull().default("active"),
  licenseType: text("license_type").notNull().default("lifetime"),
  planType: text("plan_type").default("standard"),
  maxDomains: integer("max_domains").notNull().default(1),
  maxActivations: integer("max_activations").notNull().default(3),
  usageCount: integer("usage_count").notNull().default(0),
  totalValidations: integer("total_validations").notNull().default(0),
  isTrial: boolean("is_trial").notNull().default(false),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  lastValidated: timestamp("last_validated", { withTimezone: true }),
  lastHeartbeat: timestamp("last_heartbeat", { withTimezone: true }),
  isBlacklisted: boolean("is_blacklisted").notNull().default(false),
  suspendReason: text("suspend_reason"),
  feeAmount: numeric("fee_amount").default("0"),
  billingCycle: text("billing_cycle").default("lifetime"),
  paymentStatus: text("payment_status").notNull().default("free"),
  paymentMethodId: integer("payment_method_id"),
  paymentMethodName: text("payment_method_name"),
  nextPaymentDue: text("next_payment_due"),
  lastPaymentDate: text("last_payment_date"),
  gracePeriodEnd: timestamp("grace_period_end", { withTimezone: true }),
  autoBlockEnabled: boolean("auto_block_enabled").notNull().default(true),
  geoRestriction: text("geo_restriction").array(),
  killSwitch: boolean("kill_switch").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const licenseActivationsTable = pgTable("license_activations", {
  id: serial("id").primaryKey(),
  licenseId: integer("license_id").notNull(),
  licenseKey: text("license_key").notNull(),
  domain: text("domain"),
  ipAddress: text("ip_address"),
  hardwareId: text("hardware_id"),
  userAgent: text("user_agent"),
  fingerprint: text("fingerprint"),
  country: text("country"),
  city: text("city"),
  isActive: boolean("is_active").notNull().default(true),
  deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
  lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const licensePaymentsTable = pgTable("license_payments", {
  id: serial("id").primaryKey(),
  licenseId: integer("license_id").notNull(),
  licenseKey: text("license_key").notNull(),
  clientEmail: text("client_email"),
  amount: numeric("amount").notNull(),
  currency: text("currency").default("BDT"),
  method: text("method").notNull(),
  transactionId: text("transaction_id"),
  gatewayResponse: jsonb("gateway_response"),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const licenseLogsTable = pgTable("license_logs", {
  id: serial("id").primaryKey(),
  licenseId: integer("license_id"),
  licenseKey: text("license_key"),
  action: text("action").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  domain: text("domain"),
  status: text("status").default("success"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLicenseProductSchema = createInsertSchema(licenseProductsTable).omit({ id: true, createdAt: true });
export type InsertLicenseProduct = z.infer<typeof insertLicenseProductSchema>;
export type LicenseProduct = typeof licenseProductsTable.$inferSelect;

export const insertLicenseSchema = createInsertSchema(licensesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  activatedAt: true,
  lastValidated: true,
  lastHeartbeat: true,
  totalValidations: true,
  usageCount: true,
});
export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type License = typeof licensesTable.$inferSelect;

export const insertLicenseActivationSchema = createInsertSchema(licenseActivationsTable).omit({ id: true, createdAt: true });
export type InsertLicenseActivation = z.infer<typeof insertLicenseActivationSchema>;
export type LicenseActivation = typeof licenseActivationsTable.$inferSelect;

export const insertLicensePaymentSchema = createInsertSchema(licensePaymentsTable).omit({ id: true, createdAt: true });
export type InsertLicensePayment = z.infer<typeof insertLicensePaymentSchema>;
export type LicensePayment = typeof licensePaymentsTable.$inferSelect;

export const insertLicenseLogSchema = createInsertSchema(licenseLogsTable).omit({ id: true, createdAt: true });
export type InsertLicenseLog = z.infer<typeof insertLicenseLogSchema>;
export type LicenseLog = typeof licenseLogsTable.$inferSelect;
