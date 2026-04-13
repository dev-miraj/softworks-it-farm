/**
 * Chat API — Powered by SOFTWORKS Custom AI Engine
 * No third-party AI APIs required. 100% self-hosted.
 * Optional: Set OPENAI_API_KEY to enable enhanced OpenAI responses.
 */
import { Router } from "express";
import { db } from "../lib/db.js";
import { conversations, messages } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateResponse, type ChatMessage } from "../lib/customChat.js";
import { openai, isAiEnabled } from "../lib/ai.js";

const router = Router();

const SYSTEM_PROMPT = `You are the AI assistant for SOFTWORKS IT FARM — a premium IT consulting and software development company based in Bangladesh.

About SOFTWORKS IT FARM:
- Full-service tech studio: web apps, AI/ML, SaaS, mobile, e-commerce, IT consulting
- Technologies: React, Next.js, Node.js, TypeScript, Python, Flutter, Docker, AWS, PostgreSQL
- Stats: 65+ clients, 123+ projects, 12+ team members, founded 2019
- Contact: hello@softworks.dev
- Remote-first, global team, headquartered in Dhaka, Bangladesh
- Payment gateways: bKash, Nagad, SSLCommerz, Stripe, PayPal

Guidelines:
- Answer questions about services, pricing, technologies, process, and capabilities
- Be concise (2-4 sentences), professional, and helpful
- For pricing: mention ৳15K-৳50K small, ৳50K-৳2L medium, ৳2L+ large projects
- Encourage contacting hello@softworks.dev for custom quotes
- Support both English and Bangla
- Keep responses short and focused`;

router.get("/conversations", async (_req, res) => {
  try {
    const all = await db.select().from(conversations).orderBy(conversations.id);
    res.json(all);
  } catch {
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.post("/conversations", async (req, res) => {
  try {
    const { title } = req.body as { title: string };
    const [conversation] = await db
      .insert(conversations)
      .values({ title: title || "Chat Session" })
      .returning();
    res.status(201).json(conversation);
  } catch {
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
  } catch {
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

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    let fullResponse = "";

    if (isAiEnabled() && openai) {
      try {
        const chatMessages = [
          { role: "system" as const, content: SYSTEM_PROMPT },
          ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        ];
        const stream = await openai.chat.completions.create({
          model: process.env["OPENAI_MODEL"] || "gpt-4o-mini",
          max_completion_tokens: 512,
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
      } catch (aiErr) {
        console.warn("[Chat] OpenAI failed, falling back to custom engine:", aiErr);
        fullResponse = generateResponse(content, history as ChatMessage[]);
        await streamCustomResponse(res, fullResponse);
      }
    } else {
      const chatHistory = history.slice(0, -1).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      fullResponse = generateResponse(content, chatHistory);
      await streamCustomResponse(res, fullResponse);
    }

    await db.insert(messages).values({ conversationId, role: "assistant", content: fullResponse });
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("[Chat] Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process message" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Failed to process message" })}\n\n`);
      res.end();
    }
  }
});

async function streamCustomResponse(res: any, text: string): Promise<void> {
  const words = text.split(" ");
  for (const word of words) {
    res.write(`data: ${JSON.stringify({ content: word + " " })}\n\n`);
    await new Promise(r => setTimeout(r, 18));
  }
}

router.delete("/conversations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

export { router as openaiRouter };
