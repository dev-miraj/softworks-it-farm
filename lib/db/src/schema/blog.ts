import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const blogTable = pgTable("blog", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array().notNull().default([]),
  imageUrl: text("image_url").notNull(),
  authorName: text("author_name").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBlogSchema = createInsertSchema(blogTable).omit({ id: true, createdAt: true });
export type InsertBlog = z.infer<typeof insertBlogSchema>;
export type Blog = typeof blogTable.$inferSelect;
