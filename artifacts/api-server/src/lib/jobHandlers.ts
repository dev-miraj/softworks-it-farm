/**
 * Job Handlers — registers all background job processors
 * Called once at startup from index.ts
 */
import { registerHandler } from "./queue.js";
import { sendEmail } from "./email.js";
import { logger } from "./logger.js";
import { toCsv } from "./export.js";
import { db } from "./db.js";
import { sql } from "drizzle-orm";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

export function registerAllHandlers(): void {
  // ── Email Handler ─────────────────────────────────────────────
  registerHandler<{
    to: string;
    subject: string;
    html?: string;
    text?: string;
    replyTo?: string;
  }>("send_email", async (payload) => {
    if (!payload.to || !payload.subject) {
      throw new Error("Email job: 'to' and 'subject' are required");
    }
    const sent = await sendEmail({
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo,
    });
    if (!sent) {
      logger.warn({ to: payload.to }, "Email job: SMTP not configured, skipped");
    }
  });

  // ── Report Generation Handler ─────────────────────────────────
  registerHandler<{
    reportType: string;
    username: string;
    params?: Record<string, unknown>;
  }>("generate_report", async (payload, jobId) => {
    logger.info({ jobId, reportType: payload.reportType }, "Generating report...");

    const reportDir = path.resolve(process.cwd(), "reports");
    mkdirSync(reportDir, { recursive: true });

    const filename = `report-${payload.reportType}-${Date.now()}.csv`;
    const outPath = path.join(reportDir, filename);

    // Generate a basic summary report
    const uptime = Math.floor(process.uptime());
    const rows = [
      { metric: "report_type", value: payload.reportType },
      { metric: "generated_by", value: payload.username },
      { metric: "generated_at", value: new Date().toISOString() },
      { metric: "server_uptime_s", value: String(uptime) },
    ];

    writeFileSync(outPath, toCsv(rows), "utf-8");
    logger.info({ jobId, outPath }, "Report generated");
  });

  // ── AI Processing Handler ─────────────────────────────────────
  registerHandler<{
    task: string;
    input: string;
    username?: string;
  }>("ai_process", async (payload, jobId) => {
    logger.info({ jobId, task: payload.task }, "AI processing task started");
    // Placeholder — wire up OpenAI/custom AI here
    await new Promise((r) => setTimeout(r, 500));
    logger.info({ jobId, task: payload.task }, "AI processing task completed");
  });

  // ── Voice Task Handler ────────────────────────────────────────
  registerHandler<{
    sessionToken: string;
    action: string;
    payload?: Record<string, unknown>;
  }>("voice_task", async (payload, jobId) => {
    logger.info({ jobId, sessionToken: payload.sessionToken, action: payload.action }, "Voice task processing");
    await new Promise((r) => setTimeout(r, 200));
    logger.info({ jobId }, "Voice task completed");
  });

  // ── Export Data Handler ───────────────────────────────────────
  registerHandler<{
    table: string;
    username: string;
    format?: "csv" | "json";
  }>("export_data", async (payload, jobId) => {
    logger.info({ jobId, table: payload.table }, "Exporting data...");

    const exportDir = path.resolve(process.cwd(), "exports");
    mkdirSync(exportDir, { recursive: true });

    const ext = payload.format === "json" ? "json" : "csv";
    const filename = `export-${payload.table}-${Date.now()}.${ext}`;
    const outPath = path.join(exportDir, filename);

    // Safety: only allow known tables
    const allowedTables = [
      "leads", "employees", "clients", "projects",
      "invoices", "licenses", "voice_call_sessions",
    ];
    if (!allowedTables.includes(payload.table)) {
      throw new Error(`Export not allowed for table: ${payload.table}`);
    }

    const rows = await db.execute(sql.raw(`SELECT * FROM ${payload.table} LIMIT 10000`));
    const data = rows.rows as Record<string, unknown>[];

    if (payload.format === "json") {
      writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
    } else {
      writeFileSync(outPath, toCsv(data), "utf-8");
    }

    logger.info({ jobId, outPath, rows: data.length }, "Export completed");
  });

  // ── DB Backup Handler ─────────────────────────────────────────
  registerHandler<{ note?: string }>("db_backup", async (_payload, jobId) => {
    logger.info({ jobId }, "DB backup job started");
    const { execSync } = await import("node:child_process");
    const backupDir = process.env["BACKUP_DIR"] || path.resolve(process.cwd(), "backups");
    mkdirSync(backupDir, { recursive: true });

    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `softworks-backup-${stamp}.sql`;
    const outPath = path.join(backupDir, filename);

    const dbUrl =
      process.env["DATABASE_URL_UNPOOLED"] ||
      process.env["NEON_DATABASE_URL"] ||
      process.env["DATABASE_URL"] ||
      "";

    if (!dbUrl) {
      logger.warn({ jobId }, "DB backup: no DATABASE_URL configured, skipping");
      return;
    }

    try {
      execSync(`pg_dump "${dbUrl}" --no-owner --no-acl --format=plain --file="${outPath}"`, {
        stdio: "pipe",
        timeout: 120_000,
      });
      logger.info({ jobId, outPath }, "DB backup completed");
    } catch (err) {
      logger.error({ jobId, err }, "DB backup: pg_dump failed (pg_dump may not be installed)");
    }
  });

  logger.info("Job handlers registered: send_email, generate_report, ai_process, voice_task, export_data, db_backup");
}
