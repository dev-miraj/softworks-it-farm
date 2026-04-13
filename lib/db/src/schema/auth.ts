import { pgTable, text, serial, timestamp, boolean, index } from "drizzle-orm/pg-core";

export const refreshTokensTable = pgTable(
  "refresh_tokens",
  {
    id: serial("id").primaryKey(),
    tokenHash: text("token_hash").notNull().unique(),
    username: text("username").notNull(),
    role: text("role").notNull().default("admin"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    isRevoked: boolean("is_revoked").notNull().default(false),
  },
  (t) => [
    index("rt_username_idx").on(t.username),
    index("rt_hash_idx").on(t.tokenHash),
    index("rt_expires_idx").on(t.expiresAt),
  ],
);

export const auditLogsTable = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    action: text("action").notNull(),
    resource: text("resource"),
    resourceId: text("resource_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    details: text("details"),
    status: text("status").notNull().default("success"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("al_username_idx").on(t.username),
    index("al_action_idx").on(t.action),
    index("al_created_idx").on(t.createdAt),
  ],
);

export const csrfTokensTable = pgTable(
  "csrf_tokens",
  {
    id: serial("id").primaryKey(),
    token: text("token").notNull().unique(),
    username: text("username").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("csrf_token_idx").on(t.token)],
);

export type RefreshToken = typeof refreshTokensTable.$inferSelect;
export type AuditLog = typeof auditLogsTable.$inferSelect;
