import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db } from "../lib/db.js";
import { conversations, messages } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const SYSTEM_PROMPT = `You are the AI assistant for SOFTWORKS IT FARM — a premium IT consulting and software development company.

About SOFTWORKS IT FARM:
- A full-service tech studio specializing in web applications, AI/ML systems, SaaS platforms, and digital transformation
- Services: Custom web development (React, Next.js, Node.js), Mobile apps (Flutter, React Native), Cloud infrastructure (AWS, Docker), AI & machine learning integration, SaaS product development, IT consulting
- Has worked with 65+ happy clients, delivered 123+ projects, and has 12+ team members
- Remote-first, global team
- Contact: hello@softworks.dev

Your role:
- Answer questions about services, pricing, technologies, and capabilities
- Help visitors understand what SOFTWORKS offers
- Guide potential clients toward booking a consultation
- Be professional, concise, and helpful
- For specific pricing, encourage them to contact the team for a custom quote
- If asked about topics unrelated to the company or tech, politely redirect

Keep responses concise (2-4 sentences typically), professional, and helpful. Use a friendly but professional tone.`;

router.get("/conversations", async (req, res) => {
  try {
    const all = await db.select().from(conversations).orderBy(conversations.id);
    res.json(all);
  } catch (error) {
    console.error("Error listing conversations:", error);
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.post("/conversations", async (req, res) => {
  try {
    const { title } = req.body as { title: string };
    const [conversation] = await db.insert(conversations).values({ title: title || "Chat Session" }).returning();
    res.status(201).json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/conversations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    const msgs = await db.select().from(messages).where(eq(messages.conversationId, id));
    res.json({ ...conversation, messages: msgs });
  } catch (error) {
    console.error("Error getting conversation:", error);
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

router.post("/conversations/:id/messages", async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const { content } = req.body as { content: string };

    if (!content?.trim()) return res.status(400).json({ error: "Message content required" });

    await db.insert(messages).values({ conversationId, role: "user", content });

    const history = await db.select().from(messages).where(eq(messages.conversationId, conversationId));

    const chatMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    await db.insert(messages).values({ conversationId, role: "assistant", content: fullResponse });
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Error sending message:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process message" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Failed to process message" })}\n\n`);
      res.end();
    }
  }
});

export { router as openaiRouter };
