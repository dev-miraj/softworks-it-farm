import { pgTable, text, serial, timestamp, integer, index, jsonb } from "drizzle-orm/pg-core";

export type JobStatus = "pending" | "processing" | "done" | "failed" | "retrying";

export const jobQueueTable = pgTable(
  "job_queue",
  {
    id: serial("id").primaryKey(),
    type: text("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    status: text("status").notNull().default("pending"),
    priority: integer("priority").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    runAt: timestamp("run_at", { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    failReason: text("fail_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("jq_status_idx").on(t.status),
    index("jq_type_idx").on(t.type),
    index("jq_run_at_idx").on(t.runAt),
  ],
);

export type Job = typeof jobQueueTable.$inferSelect;
