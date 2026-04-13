/**
 * Audit log system — tracks auth events and admin actions to DB
 */
import type { Request } from "express";
import { db } from "./db.js";
import { auditLogsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { logger } from "./logger.js";

export type AuditAction =
  | "login"
  | "logout"
  | "logout_all"
  | "token_refresh"
  | "session_revoke"
  | "login_failed"
  | "admin_action"
  | "create"
  | "update"
  | "delete"
  | "view";

interface AuditOptions {
  username: string;
  action: AuditAction;
  resource?: string;
  resourceId?: string | number;
  details?: string;
  status?: "success" | "failure";
  req?: Request;
}

export async function auditLog(opts: AuditOptions): Promise<void> {
  const ip = opts.req
    ? (opts.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      opts.req.socket?.remoteAddress ||
      null
    : null;

  const ua = opts.req
    ? opts.req.headers["user-agent"]?.substring(0, 512) ?? null
    : null;

  logger.info(
    { audit: true, action: opts.action, username: opts.username, resource: opts.resource },
    `[audit] ${opts.action}`,
  );

  try {
    await db.insert(auditLogsTable).values({
      username: opts.username,
      action: opts.action,
      resource: opts.resource ?? null,
      resourceId: opts.resourceId != null ? String(opts.resourceId) : null,
      ipAddress: ip,
      userAgent: ua,
      details: opts.details ?? null,
      status: opts.status ?? "success",
    });
  } catch (err) {
    logger.error({ err }, "auditLog: failed to write to DB");
  }
}

export async function getAuditLogs(opts: {
  username?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const query = db
      .select()
      .from(auditLogsTable)
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(opts.limit ?? 50)
      .offset(opts.offset ?? 0);

    if (opts.username) {
      return db
        .select()
        .from(auditLogsTable)
        .where(eq(auditLogsTable.username, opts.username))
        .orderBy(desc(auditLogsTable.createdAt))
        .limit(opts.limit ?? 50)
        .offset(opts.offset ?? 0);
    }

    return query;
  } catch (err) {
    logger.error({ err }, "auditLog: failed to query logs");
    return [];
  }
}
