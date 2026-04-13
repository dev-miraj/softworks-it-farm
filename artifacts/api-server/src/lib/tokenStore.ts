/**
 * DB-backed refresh token store — enables rotation, revocation, session tracking
 */
import crypto from "node:crypto";
import { db } from "./db.js";
import { refreshTokensTable } from "@workspace/db/schema";
import { eq, and, lt, lte } from "drizzle-orm";
import { logger } from "./logger.js";

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

interface StoreOptions {
  username: string;
  role: string;
  token: string;
  ttlSeconds: number;
  ipAddress?: string;
  userAgent?: string;
}

export async function storeRefreshToken(opts: StoreOptions): Promise<void> {
  const hash = hashToken(opts.token);
  const expiresAt = new Date(Date.now() + opts.ttlSeconds * 1000);
  try {
    await db.insert(refreshTokensTable).values({
      tokenHash: hash,
      username: opts.username,
      role: opts.role,
      ipAddress: opts.ipAddress ?? null,
      userAgent: opts.userAgent?.substring(0, 512) ?? null,
      expiresAt,
    });
  } catch (err) {
    logger.error({ err }, "tokenStore: failed to store refresh token");
  }
}

export async function validateAndRotateRefreshToken(
  token: string,
): Promise<{ username: string; role: string } | null> {
  const hash = hashToken(token);
  try {
    const rows = await db
      .select()
      .from(refreshTokensTable)
      .where(and(eq(refreshTokensTable.tokenHash, hash), eq(refreshTokensTable.isRevoked, false)))
      .limit(1);

    if (!rows[0]) return null;
    const row = rows[0];

    if (row.expiresAt < new Date()) {
      await db.delete(refreshTokensTable).where(eq(refreshTokensTable.id, row.id));
      return null;
    }

    await db.delete(refreshTokensTable).where(eq(refreshTokensTable.id, row.id));

    return { username: row.username, role: row.role };
  } catch (err) {
    logger.error({ err }, "tokenStore: failed to validate/rotate refresh token");
    return null;
  }
}

export async function revokeAllTokensForUser(username: string): Promise<number> {
  try {
    const result = await db
      .delete(refreshTokensTable)
      .where(eq(refreshTokensTable.username, username));
    return (result as any).rowCount ?? 0;
  } catch (err) {
    logger.error({ err }, "tokenStore: failed to revoke all tokens");
    return 0;
  }
}

export async function revokeTokenById(id: number, username: string): Promise<boolean> {
  try {
    const result = await db
      .delete(refreshTokensTable)
      .where(and(eq(refreshTokensTable.id, id), eq(refreshTokensTable.username, username)));
    return ((result as any).rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function getActiveSessions(username: string) {
  try {
    const rows = await db
      .select({
        id: refreshTokensTable.id,
        ipAddress: refreshTokensTable.ipAddress,
        userAgent: refreshTokensTable.userAgent,
        createdAt: refreshTokensTable.createdAt,
        expiresAt: refreshTokensTable.expiresAt,
      })
      .from(refreshTokensTable)
      .where(
        and(
          eq(refreshTokensTable.username, username),
          eq(refreshTokensTable.isRevoked, false),
        ),
      )
      .orderBy(refreshTokensTable.createdAt);

    const now = new Date();
    return rows.filter((r) => r.expiresAt > now);
  } catch (err) {
    logger.error({ err }, "tokenStore: failed to get sessions");
    return [];
  }
}

export async function cleanupExpiredTokens(): Promise<void> {
  try {
    await db.delete(refreshTokensTable).where(lte(refreshTokensTable.expiresAt, new Date()));
  } catch (err) {
    logger.error({ err }, "tokenStore: cleanup failed");
  }
}
