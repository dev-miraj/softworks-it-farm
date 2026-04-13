/**
 * Account Lockout — brute-force protection
 * Tracks failed login attempts per username + IP.
 * After MAX_FAILURES within WINDOW_MS, locks account for LOCKOUT_MS.
 */
import { db } from "./db.js";
import { loginAttemptsTable } from "@workspace/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { logger } from "./logger.js";

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

export interface LockoutCheck {
  locked: boolean;
  lockedUntil?: Date;
  remainingAttempts?: number;
}

export async function checkLockout(identifier: string): Promise<LockoutCheck> {
  try {
    const rows = await db
      .select()
      .from(loginAttemptsTable)
      .where(eq(loginAttemptsTable.identifier, identifier))
      .limit(1);

    if (!rows[0]) return { locked: false, remainingAttempts: MAX_FAILURES };

    const row = rows[0];

    if (row.lockedUntil && row.lockedUntil > new Date()) {
      return { locked: true, lockedUntil: row.lockedUntil };
    }

    const windowStart = new Date(Date.now() - WINDOW_MS);
    if (row.lastAttemptAt < windowStart) {
      return { locked: false, remainingAttempts: MAX_FAILURES };
    }

    const remaining = Math.max(0, MAX_FAILURES - row.failCount);
    return { locked: false, remainingAttempts: remaining };
  } catch (err) {
    logger.error({ err }, "lockout: checkLockout failed");
    return { locked: false };
  }
}

export async function recordFailedAttempt(identifier: string, ip?: string): Promise<LockoutCheck> {
  try {
    const rows = await db
      .select()
      .from(loginAttemptsTable)
      .where(eq(loginAttemptsTable.identifier, identifier))
      .limit(1);

    const now = new Date();

    if (!rows[0]) {
      await db.insert(loginAttemptsTable).values({
        identifier,
        ipAddress: ip ?? null,
        failCount: 1,
        lastAttemptAt: now,
      });
      return { locked: false, remainingAttempts: MAX_FAILURES - 1 };
    }

    const row = rows[0];
    const windowStart = new Date(Date.now() - WINDOW_MS);
    const resetCount = row.lastAttemptAt < windowStart;
    const newCount = resetCount ? 1 : row.failCount + 1;
    const shouldLock = newCount >= MAX_FAILURES;
    const lockedUntil = shouldLock ? new Date(Date.now() + LOCKOUT_MS) : null;

    if (shouldLock) {
      logger.warn({ identifier, ip, failures: newCount }, "Account temporarily locked due to failed login attempts");
    }

    await db
      .update(loginAttemptsTable)
      .set({
        failCount: newCount,
        ipAddress: ip ?? row.ipAddress,
        lockedUntil,
        lastAttemptAt: now,
      })
      .where(eq(loginAttemptsTable.id, row.id));

    return {
      locked: shouldLock,
      lockedUntil: lockedUntil ?? undefined,
      remainingAttempts: Math.max(0, MAX_FAILURES - newCount),
    };
  } catch (err) {
    logger.error({ err }, "lockout: recordFailedAttempt failed");
    return { locked: false };
  }
}

export async function clearLockout(identifier: string): Promise<void> {
  try {
    await db
      .delete(loginAttemptsTable)
      .where(eq(loginAttemptsTable.identifier, identifier));
  } catch (err) {
    logger.error({ err }, "lockout: clearLockout failed");
  }
}
