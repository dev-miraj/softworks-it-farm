import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "../lib/db";

const router: IRouter = Router();

router.get(["/health", "/healthz"], async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    const data = HealthCheckResponse.parse({ status: "ok" });
    res.json(data);
  } catch (err) {
    res.status(503).json({ status: "error", message: String(err) });
  }
});

// Debug endpoint — shows which env vars are present (not their values)
router.get("/debug-env", (_req, res) => {
  const vars = [
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
    "NEON_DATABASE_URL",
    "DATABASE_URL",
    "POSTGRES_URL",
    "VERCEL",
    "NODE_ENV",
  ];
  const found: Record<string, string | boolean> = {};
  for (const v of vars) {
    const val = process.env[v];
    if (v === "VERCEL" || v === "NODE_ENV") {
      found[v] = val ?? "(not set)";
    } else {
      found[v] = val ? `SET (${val.length} chars)` : "(not set)";
    }
  }
  res.json({ env: found });
});

export default router;
