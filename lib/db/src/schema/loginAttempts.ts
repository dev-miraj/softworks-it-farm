import { pgTable, text, serial, timestamp, boolean, integer, index } from "drizzle-orm/pg-core";

export const loginAttemptsTable = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    identifier: text("identifier").notNull(),
    ipAddress: text("ip_address"),
    success: boolean("success").notNull().default(false),
    failCount: integer("fail_count").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("la_identifier_idx").on(t.identifier),
    index("la_ip_idx").on(t.ipAddress),
  ],
);

export type LoginAttempt = typeof loginAttemptsTable.$inferSelect;
