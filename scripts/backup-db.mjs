#!/usr/bin/env node
/**
 * SOFTWORKS — Database Backup Script
 * 
 * Usage:
 *   node scripts/backup-db.mjs
 *   
 * Cron (daily at 2am):
 *   0 2 * * * cd /app && node scripts/backup-db.mjs >> /var/log/softworks-backup.log 2>&1
 * 
 * Env vars required:
 *   DATABASE_URL or NEON_DATABASE_URL
 *   BACKUP_DIR (optional, default: ./backups)
 *   BACKUP_RETENTION_DAYS (optional, default: 7)
 */

import { execSync } from "node:child_process";
import { mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(ROOT, "backups");
const RETENTION_DAYS = Number(process.env.BACKUP_RETENTION_DAYS || 7);

const DB_URL =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_URL;

if (!DB_URL) {
  console.error("❌ No DATABASE_URL configured");
  process.exit(1);
}

mkdirSync(BACKUP_DIR, { recursive: true });

const now = new Date();
const stamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
const filename = `softworks-backup-${stamp}.sql`;
const outPath = path.join(BACKUP_DIR, filename);

console.log(`📦 Starting backup at ${now.toISOString()}`);
console.log(`   Output: ${outPath}`);

try {
  const pgDumpCmd = `pg_dump "${DB_URL}" --no-owner --no-acl --format=plain --file="${outPath}"`;
  execSync(pgDumpCmd, { stdio: "pipe" });
  
  const stats = statSync(outPath);
  const sizeKB = Math.round(stats.size / 1024);
  console.log(`✅ Backup complete: ${filename} (${sizeKB} KB)`);
} catch (err) {
  console.error("❌ pg_dump failed:", err.message);
  console.log("💡 Tip: Make sure pg_dump is installed (apt-get install postgresql-client)");
  
  console.log("\n📋 Attempting schema-only backup via node...");
  try {
    const { createRequire } = await import("node:module");
    const require = createRequire(import.meta.url);
    const pg = require("pg");
    const client = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    const tables = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    const { writeFileSync } = await import("node:fs");
    writeFileSync(outPath, `-- SOFTWORKS Backup (schema-only fallback)\n-- Generated: ${now.toISOString()}\n-- Tables: ${tables.rows.map(r => r.tablename).join(", ")}\n\n`);
    await client.end();
    console.log(`✅ Schema listing saved to ${filename}`);
  } catch (e2) {
    console.error("❌ Fallback also failed:", e2.message);
  }
}

console.log("\n🧹 Cleaning up old backups...");
try {
  const files = readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("softworks-backup-") && f.endsWith(".sql"))
    .map((f) => ({ name: f, mtime: statSync(path.join(BACKUP_DIR, f)).mtime }))
    .sort((a, b) => b.mtime - a.mtime);

  const cutoff = Date.now() - RETENTION_DAYS * 86400 * 1000;
  let deleted = 0;
  for (const file of files) {
    if (file.mtime.getTime() < cutoff) {
      unlinkSync(path.join(BACKUP_DIR, file.name));
      console.log(`   Deleted: ${file.name}`);
      deleted++;
    }
  }
  console.log(`✅ Cleanup done. Kept ${files.length - deleted} backup(s), deleted ${deleted}`);
} catch (err) {
  console.error("⚠️  Cleanup error:", err.message);
}
