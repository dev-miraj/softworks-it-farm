/**
 * System routes: /ready, /metrics, /events (SSE), /queue
 */
import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "../lib/db.js";
import { metrics } from "../lib/metrics.js";
import { sseHandler, getSseStats } from "../lib/sse.js";
import { getQueueStats } from "../lib/queue.js";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();
const adminOnly = [requireAuth, requireRole("admin")];

router.get("/ready", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({
      status: "ready",
      db: "connected",
      ts: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      memory: {
        heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + "MB",
      },
    });
  } catch (err) {
    res.status(503).json({ status: "not_ready", error: "DB unreachable" });
  }
});

router.get("/metrics", ...adminOnly, (_req, res) => {
  res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.send(metrics.toPrometheus());
});

router.get("/metrics/json", ...adminOnly, (_req, res) => {
  res.json({
    success: true,
    data: {
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage(),
      sse: getSseStats(),
    },
  });
});

router.get("/events", requireAuth, sseHandler);

router.get("/queue/stats", ...adminOnly, async (_req, res) => {
  const stats = await getQueueStats();
  res.json({ success: true, data: stats });
});

export default router;
