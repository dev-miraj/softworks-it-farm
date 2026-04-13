import { pgTable, text, serial, timestamp, boolean, index } from "drizzle-orm/pg-core";

export const adminUsersTable = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("admin"),
    displayName: text("display_name"),
    email: text("email"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("au_username_idx").on(t.username),
    index("au_role_idx").on(t.role),
    index("au_active_idx").on(t.isActive),
  ],
);

export type AdminUser = typeof adminUsersTable.$inferSelect;
export type NewAdminUser = typeof adminUsersTable.$inferInsert;
