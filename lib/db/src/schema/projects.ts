import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  clientId: integer("client_id").notNull(),
  clientName: text("client_name").notNull(),
  status: text("status").notNull().default("active"),
  priority: text("priority").notNull().default("medium"),
  budget: numeric("budget").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  progress: integer("progress").notNull().default(0),
  technologies: text("technologies").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
