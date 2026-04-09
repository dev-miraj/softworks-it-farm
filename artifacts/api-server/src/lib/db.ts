import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@workspace/db/schema";

function getConnectionUrl(): string {
  const url =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL;

  if (!url) throw new Error("No database URL configured.");

  try {
    const u = new URL(url);
    u.searchParams.delete("channel_binding");
    u.searchParams.delete("sslmode");
    return u.toString();
  } catch {
    return url;
  }
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    const url = getConnectionUrl();
    const sql = neon(url, {
      fetchOptions: () => ({ signal: AbortSignal.timeout(12_000) }),
    });
    _db = drizzle(sql, { schema });
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_t, prop) {
    const d = getDb();
    const v = (d as unknown as Record<string | symbol, unknown>)[prop];
    return typeof v === "function" ? (v as Function).bind(d) : v;
  },
});

// pool alias — not used with Neon HTTP driver, kept for any legacy compat
export const pool = db as unknown as Record<string, unknown>;
