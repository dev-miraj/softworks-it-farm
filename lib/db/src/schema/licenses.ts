import { pgTable, text, serial, timestamp, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const licensesTable = pgTable("licenses", {
  id: serial("id").primaryKey(),
  licenseKey: text("license_key").notNull().unique(),
  productName: text("product_name").notNull(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  domain: text("domain"),
  ipAddress: text("ip_address"),
  hardwareId: text("hardware_id"),
  expiryDate: text("expiry_date"),
  status: text("status").notNull().default("active"),
  licenseType: text("license_type").notNull().default("lifetime"),
  maxDomains: integer("max_domains").notNull().default(1),
  notes: text("notes"),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  lastValidated: timestamp("last_validated", { withTimezone: true }),
  isBlacklisted: boolean("is_blacklisted").notNull().default(false),
  // Payment fields
  feeAmount: numeric("fee_amount").default("0"),
  billingCycle: text("billing_cycle").default("lifetime"),
  paymentStatus: text("payment_status").notNull().default("free"),
  paymentMethodId: integer("payment_method_id"),
  paymentMethodName: text("payment_method_name"),
  nextPaymentDue: text("next_payment_due"),
  lastPaymentDate: text("last_payment_date"),
  gracePeriodEnd: timestamp("grace_period_end", { withTimezone: true }),
  autoBlockEnabled: boolean("auto_block_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLicenseSchema = createInsertSchema(licensesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  activatedAt: true,
  lastValidated: true,
});
export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type License = typeof licensesTable.$inferSelect;
