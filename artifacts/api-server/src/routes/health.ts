import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "../lib/db";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  try {
    await (pool as unknown as { query: (sql: string) => Promise<unknown> }).query("SELECT 1");
    const data = HealthCheckResponse.parse({ status: "ok" });
    res.json(data);
  } catch (err) {
    res.status(503).json({ status: "error", message: String(err) });
  }
});

export default router;
