import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const portfolioTable = pgTable("portfolio", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  technologies: text("technologies").array().notNull().default([]),
  imageUrl: text("image_url").notNull(),
  projectUrl: text("project_url"),
  clientName: text("client_name").notNull(),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPortfolioSchema = createInsertSchema(portfolioTable).omit({ id: true, createdAt: true });
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Portfolio = typeof portfolioTable.$inferSelect;
