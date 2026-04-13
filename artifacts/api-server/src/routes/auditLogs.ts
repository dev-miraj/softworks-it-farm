import { Router } from "express";
import { requireAuth, requireRole } from "../lib/auth.js";
import { getAuditLogs } from "../lib/auditLog.js";

const router = Router();
const adminOnly = [requireAuth, requireRole("admin")];

router.get("/audit-logs", ...adminOnly, async (req, res) => {
  const limit = Math.min(Number(req.query["limit"] ?? 50), 200);
  const offset = Number(req.query["offset"] ?? 0);
  const username = req.query["username"] as string | undefined;

  const logs = await getAuditLogs({ username, limit, offset });
  res.json({ success: true, data: logs, meta: { limit, offset } });
});

export default router;
