import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  location: text("location").notNull().default("Remote"),
  type: text("type").notNull().default("full-time"),
  experience: text("experience").notNull(),
  salary: text("salary"),
  description: text("description").notNull(),
  responsibilities: text("responsibilities").array().notNull().default([]),
  requirements: text("requirements").array().notNull().default([]),
  benefits: text("benefits").array().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  deadline: text("deadline"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, createdAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
