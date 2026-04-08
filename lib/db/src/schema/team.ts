import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const teamTable = pgTable("team", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  department: text("department").notNull(),
  bio: text("bio").notNull(),
  avatarUrl: text("avatar_url"),
  skills: text("skills").array().notNull().default([]),
  linkedinUrl: text("linkedin_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTeamSchema = createInsertSchema(teamTable).omit({ id: true, createdAt: true });
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teamTable.$inferSelect;
