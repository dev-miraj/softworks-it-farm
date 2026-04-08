import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const testimonialsTable = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  company: text("company").notNull(),
  role: text("role"),
  content: text("content").notNull(),
  rating: integer("rating").notNull().default(5),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTestimonialSchema = createInsertSchema(testimonialsTable).omit({ id: true, createdAt: true });
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonialsTable.$inferSelect;
