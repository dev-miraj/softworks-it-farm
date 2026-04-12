#!/usr/bin/env node
/**
 * github-watch.mjs — Auto-push to GitHub on file changes
 * Watches the project for code changes and auto-pushes after a debounce delay.
 * Uses Replit GitHub Connector — no GITHUB_PAT needed.
 */

import { watch } from "fs";
import { execSync, spawn } from "child_process";
import { join, resolve } from "path";

const ROOT = resolve(process.cwd());
const DEBOUNCE_MS = 15_000; // Wait 15s after last change before pushing

// Paths / patterns to ignore
const IGNORE = [
  ".git",
  "node_modules",
  "dist",
  ".cache",
  "tmp",
  "out-tsc",
  ".local",
  "attached_assets",
];

// File extensions to also ignore
const IGNORE_EXT = [".log", ".lock", ".map"];

function shouldIgnore(filename) {
  if (!filename) return true;
  const parts = filename.split(/[/\\]/);
  for (const seg of parts) {
    if (IGNORE.includes(seg)) return true;
    if (seg.startsWith(".") && seg !== ".env.example") return true;
  }
  for (const ext of IGNORE_EXT) {
    if (filename.endsWith(ext)) return true;
  }
  // Ignore .env files (secrets)
  if (filename.match(/\.env(\.|$)/)) return true;
  return false;
}

let debounceTimer = null;
let changedFiles = new Set();
let isPushing = false;

function scheduleAutoPush(filename) {
  if (shouldIgnore(filename)) return;

  changedFiles.add(filename);

  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    if (isPushing) {
      console.log("⏳ Push already in progress, rescheduling...");
      scheduleAutoPush(filename);
      return;
    }

    const files = [...changedFiles];
    changedFiles.clear();
    debounceTimer = null;

    console.log(`\n📁 Changed files (${files.length}):`);
    for (const f of files.slice(0, 10)) console.log(`   • ${f}`);
    if (files.length > 10) console.log(`   ... and ${files.length - 10} more`);
    console.log("\n🚀 Auto-pushing to GitHub...\n");

    isPushing = true;
    try {
      await runPush();
    } finally {
      isPushing = false;
    }
  }, DEBOUNCE_MS);

  const remaining = Math.round(DEBOUNCE_MS / 1000);
  process.stdout.write(`\r⏱  Change detected: ${filename} — pushing in ${remaining}s...`);
}

function runPush() {
  return new Promise((resolve) => {
    const child = spawn("node", [join(ROOT, "scripts/github-push.mjs")], {
      stdio: "inherit",
      cwd: ROOT,
    });
    child.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Auto-push complete.\n");
      } else {
        console.error(`❌ Push failed (exit ${code}). Will retry on next change.\n`);
      }
      resolve();
    });
  });
}

// ── Start watching ──────────────────────────────────────────────────────────
console.log("👀 SOFTWORKS Auto-Push — Watching for changes...");
console.log(`   Root: ${ROOT}`);
console.log(`   Debounce: ${DEBOUNCE_MS / 1000}s after last change\n`);

// Do an initial push on startup (push any pending changes)
console.log("🔄 Initial push on startup...\n");
runPush().then(() => {
  console.log("👀 Now watching for code changes. Any change will auto-push after 15s of inactivity.\n");
});

try {
  watch(ROOT, { recursive: true }, (event, filename) => {
    if (filename) scheduleAutoPush(filename);
  });
} catch (err) {
  // Fallback: watch specific important directories if recursive fails
  console.warn("Recursive watch not supported, watching key dirs...");
  const dirs = ["artifacts/softworks/src", "artifacts/api-server/src", "lib", "scripts"];
  for (const dir of dirs) {
    try {
      watch(join(ROOT, dir), { recursive: true }, (event, filename) => {
        if (filename) scheduleAutoPush(join(dir, filename));
      });
    } catch { /* skip */ }
  }
}

// Keep process alive
process.on("SIGINT", () => {
  console.log("\n\n👋 Auto-push watcher stopped.");
  process.exit(0);
});
