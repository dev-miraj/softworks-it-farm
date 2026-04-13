/**
 * Admin Security Management API
 * IP blocking, whitelist management, circuit breaker status
 */
import { Router } from "express";
import { requireAuth, requireRole } from "../lib/auth.js";
import { blockIp, unblockIp } from "../lib/ipSecurity.js";
import { dbCircuit } from "../lib/circuitBreaker.js";
import { getUsageStats } from "../lib/usageTracking.js";
import { getSseStats } from "../lib/sse.js";
import { getQueueStats } from "../lib/queue.js";
import { metrics } from "../lib/metrics.js";

const router = Router();
const adminOnly = [requireAuth, requireRole("admin")];

router.get("/admin/system-status", ...adminOnly, async (_req, res) => {
  const [queueStats] = await Promise.all([getQueueStats()]);

  res.json({
    success: true,
    data: {
      server: {
        uptime: Math.floor(process.uptime()),
        memory: {
          heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + "MB",
        },
        nodeVersion: process.version,
        pid: process.pid,
      },
      circuitBreakers: {
        database: {
          state: dbCircuit.getState(),
          failures: dbCircuit.getFailures(),
        },
      },
      sse: getSseStats(),
      queue: queueStats,
    },
  });
});

router.post("/admin/security/block-ip", ...adminOnly, (req, res) => {
  const { ip } = req.body;
  if (!ip || typeof ip !== "string") {
    res.status(400).json({ success: false, error: "ip required" });
    return;
  }
  blockIp(ip);
  res.json({ success: true, message: `IP ${ip} blocked` });
});

router.post("/admin/security/unblock-ip", ...adminOnly, (req, res) => {
  const { ip } = req.body;
  if (!ip || typeof ip !== "string") {
    res.status(400).json({ success: false, error: "ip required" });
    return;
  }
  unblockIp(ip);
  res.json({ success: true, message: `IP ${ip} unblocked` });
});

router.post("/admin/circuit-breaker/reset", ...adminOnly, (_req, res) => {
  dbCircuit.reset();
  res.json({ success: true, message: "DB circuit breaker reset to CLOSED" });
});

router.get("/admin/usage/:username", ...adminOnly, (req, res) => {
  const stats = getUsageStats(req.params["username"]!);
  res.json({ success: true, data: stats });
});

export default router;
