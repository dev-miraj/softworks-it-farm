import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";

export const tenantsTable = pgTable("tenants", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull(),
  plan: text("plan").notNull().default("free"),
  logoUrl: text("logo_url"),
  customDomain: text("custom_domain"),
  isActive: boolean("is_active").notNull().default(true),
  settings: text("settings").default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Tenant = typeof tenantsTable.$inferSelect;
