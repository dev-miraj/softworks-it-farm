import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { blogTable, insertBlogSchema } from "@workspace/db/schema";

const router = Router();

router.get("/blog", async (req, res): Promise<void> => {
  const posts = await db.select().from(blogTable).orderBy(blogTable.id);
  res.json(posts);
});

router.post("/blog", async (req, res): Promise<void> => {
  const body = insertBlogSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [post] = await db.insert(blogTable).values(body.data).returning();
  res.status(201).json(post);
});

router.get("/blog/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [post] = await db.select().from(blogTable).where(eq(blogTable.id, id));
  if (!post) {
    res.status(404).json({ error: "Blog post not found" });
    return;
  }
  res.json(post);
});

router.put("/blog/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const body = insertBlogSchema.partial().safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [post] = await db.update(blogTable).set(body.data).where(eq(blogTable.id, id)).returning();
  if (!post) {
    res.status(404).json({ error: "Blog post not found" });
    return;
  }
  res.json(post);
});

router.delete("/blog/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(blogTable).where(eq(blogTable.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Blog post not found" });
    return;
  }
  res.status(204).end();
});

export default router;
