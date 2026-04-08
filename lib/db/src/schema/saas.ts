import { pgTable, text, serial, timestamp, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const saasProductsTable = pgTable("saas_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("active"),
  features: text("features").array().notNull().default([]),
  pricingMonthly: numeric("pricing_monthly"),
  pricingYearly: numeric("pricing_yearly"),
  iconUrl: text("icon_url"),
  demoUrl: text("demo_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSaasProductSchema = createInsertSchema(saasProductsTable).omit({ id: true, createdAt: true });
export type InsertSaasProduct = z.infer<typeof insertSaasProductSchema>;
export type SaasProduct = typeof saasProductsTable.$inferSelect;
