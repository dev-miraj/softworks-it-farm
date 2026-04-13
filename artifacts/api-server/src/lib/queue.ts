/**
 * DB-backed job queue — simple, Redis-free, horizontally scalable
 * Jobs are polled every POLL_INTERVAL_MS (default 5s).
 * For high-throughput: swap this with BullMQ + Redis.
 */
import { db } from "./db.js";
import { jobQueueTable } from "@workspace/db/schema";
import { eq, and, lte, lt, or } from "drizzle-orm";
import { logger } from "./logger.js";

export type JobType =
  | "send_email"
  | "generate_report"
  | "ai_process"
  | "voice_task"
  | "export_data"
  | "db_backup";

type JobHandler<T = Record<string, unknown>> = (payload: T, jobId: number) => Promise<void>;

const handlers = new Map<string, JobHandler>();

export function registerHandler<T = Record<string, unknown>>(
  type: JobType,
  handler: JobHandler<T>,
): void {
  handlers.set(type, handler as JobHandler);
}

export async function enqueue(
  type: JobType,
  payload: Record<string, unknown>,
  opts?: { priority?: number; runAfterMs?: number },
): Promise<number> {
  const runAt = new Date(Date.now() + (opts?.runAfterMs ?? 0));
  const result = await db
    .insert(jobQueueTable)
    .values({ type, payload, priority: opts?.priority ?? 0, runAt })
    .returning({ id: jobQueueTable.id });
  return result[0]?.id ?? 0;
}

let _workerTimer: ReturnType<typeof setInterval> | null = null;
let _isRunning = false;

async function processNext(): Promise<void> {
  if (_isRunning) return;
  _isRunning = true;

  try {
    const now = new Date();
    const jobs = await db
      .select()
      .from(jobQueueTable)
      .where(
        and(
          or(
            eq(jobQueueTable.status, "pending"),
            eq(jobQueueTable.status, "retrying"),
          ),
          lte(jobQueueTable.runAt, now),
          lt(jobQueueTable.attempts, jobQueueTable.maxAttempts),
        ),
      )
      .limit(5)
      .orderBy(jobQueueTable.priority, jobQueueTable.runAt);

    for (const job of jobs) {
      await db
        .update(jobQueueTable)
        .set({ status: "processing", startedAt: new Date(), attempts: job.attempts + 1 })
        .where(eq(jobQueueTable.id, job.id));

      const handler = handlers.get(job.type);

      if (!handler) {
        await db
          .update(jobQueueTable)
          .set({ status: "failed", failReason: `No handler for type: ${job.type}`, finishedAt: new Date() })
          .where(eq(jobQueueTable.id, job.id));
        continue;
      }

      try {
        await handler(job.payload as Record<string, unknown>, job.id);
        await db
          .update(jobQueueTable)
          .set({ status: "done", finishedAt: new Date() })
          .where(eq(jobQueueTable.id, job.id));
        logger.info({ jobId: job.id, type: job.type }, "Job completed");
      } catch (err) {
        const willRetry = job.attempts + 1 < job.maxAttempts;
        const retryDelay = Math.pow(2, job.attempts) * 5000;
        await db
          .update(jobQueueTable)
          .set({
            status: willRetry ? "retrying" : "failed",
            failReason: err instanceof Error ? err.message : String(err),
            runAt: willRetry ? new Date(Date.now() + retryDelay) : new Date(),
            finishedAt: willRetry ? null : new Date(),
          })
          .where(eq(jobQueueTable.id, job.id));
        logger.error({ jobId: job.id, type: job.type, err }, willRetry ? "Job failed, will retry" : "Job permanently failed");
      }
    }
  } finally {
    _isRunning = false;
  }
}

const POLL_INTERVAL_MS = 5000;

export function startWorker(): void {
  if (_workerTimer) return;
  _workerTimer = setInterval(processNext, POLL_INTERVAL_MS);
  logger.info({ interval: POLL_INTERVAL_MS }, "Job queue worker started");
}

export function stopWorker(): void {
  if (_workerTimer) {
    clearInterval(_workerTimer);
    _workerTimer = null;
  }
}

export async function getQueueStats() {
  const rows = await db.select().from(jobQueueTable);
  const stats = { pending: 0, processing: 0, done: 0, failed: 0, retrying: 0, total: rows.length };
  for (const r of rows) {
    const s = r.status as keyof typeof stats;
    if (s in stats) (stats as any)[s]++;
  }
  return stats;
}
