#!/usr/bin/env node
/**
 * github-watch.mjs — Auto-push to GitHub on file changes
 * Watches the project for code changes and auto-pushes after a debounce delay.
 * Uses Replit GitHub Connector via proxy — no GITHUB_PAT needed.
 */

import { watch, existsSync } from "fs";
import { execSync } from "child_process";
import { join, resolve } from "path";
import { ReplitConnectors } from "@replit/connectors-sdk";

const ROOT    = resolve(process.cwd());
const OWNER   = "dev-miraj";
const REPO    = "softworks-it-farm";
const BRANCH  = "main";
const DEBOUNCE_MS = 20_000; // 20s quiet period before pushing

const connectors = new ReplitConnectors();

// ── Paths to ignore ──────────────────────────────────────────────────────────
const IGNORE_DIRS = new Set([".git","node_modules","dist",".cache","tmp","out-tsc",".local","attached_assets"]);
const IGNORE_EXT  = [".log",".lock",".map",".tsbuildinfo"];

function shouldIgnore(filename) {
  if (!filename) return true;
  const parts = filename.split(/[/\\]/);
  for (const seg of parts) {
    if (IGNORE_DIRS.has(seg)) return true;
    if (seg.startsWith(".") && seg !== ".env.example") return true;
  }
  for (const ext of IGNORE_EXT) {
    if (filename.endsWith(ext)) return true;
  }
  if (filename.match(/\.env(\.|$)/)) return true;
  return false;
}

// ── GitHub API via Replit Connector ─────────────────────────────────────────
async function api(method, path, body) {
  const opts = { method };
  if (body) {
    opts.body = JSON.stringify(body);
    opts.headers = { "Content-Type": "application/json" };
  }
  const res = await connectors.proxy("github", `/repos/${OWNER}/${REPO}${path}`, opts);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} ${method} ${path}: ${json.message}`);
  }
  return json;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Push logic ───────────────────────────────────────────────────────────────
async function pushToGitHub() {
  const { readFileSync, statSync, readdirSync } = await import("fs");

  const localSHA  = execSync("git rev-parse HEAD").toString().trim();
  const commitMsg = execSync("git log -1 --pretty=%s").toString().trim();

  const remoteRef    = await api("GET", `/git/ref/heads/${BRANCH}`);
  const remoteSHA    = remoteRef.object.sha;
  const remoteCommit = await api("GET", `/git/commits/${remoteSHA}`);
  const remoteTreeSHA = remoteCommit.tree.sha;
  const remoteTreeResp = await api("GET", `/git/trees/${remoteTreeSHA}?recursive=1`);

  const remoteFiles = {};
  for (const item of remoteTreeResp.tree) {
    if (item.type === "blob") remoteFiles[item.path] = item.sha;
  }

  const localTreeLines = execSync("git ls-tree -r HEAD", { maxBuffer: 20*1024*1024 })
    .toString().trim().split("\n").filter(Boolean);

  const localFiles = {};
  for (const line of localTreeLines) {
    const [meta, filePath] = line.split("\t");
    const parts = meta.split(" ");
    localFiles[filePath] = { sha: parts[2], mode: parts[0] };
  }

  function expandPath(p) {
    try {
      if (statSync(p).isDirectory()) {
        const entries = [];
        for (const item of readdirSync(p, { withFileTypes: true })) {
          entries.push(...expandPath(join(p, item.name)));
        }
        return entries;
      }
      return [p];
    } catch { return []; }
  }

  try {
    const statusOut = execSync("git status --porcelain", { maxBuffer: 5*1024*1024 }).toString();
    for (const line of statusOut.split("\n").filter(Boolean)) {
      const xy = line.slice(0, 2);
      const filePath = line.slice(3).trim().replace(/^"(.*)"$/, "$1");
      if (xy.includes("D")) {
        delete localFiles[filePath];
      } else if (!xy.startsWith("!")) {
        for (const fp of expandPath(filePath)) {
          localFiles[fp] = { sha: null, mode: "100644", fromDisk: true };
        }
      }
    }
  } catch { /* ignore */ }

  const toUpload = [];
  const toDelete = [];
  for (const [path, { sha, mode, fromDisk }] of Object.entries(localFiles)) {
    if (remoteFiles[path] !== sha) toUpload.push({ path, sha, mode, fromDisk });
  }
  for (const path of Object.keys(remoteFiles)) {
    if (!localFiles[path]) toDelete.push(path);
  }

  if (toUpload.length === 0 && toDelete.length === 0) {
    console.log("✅ Already up to date. Nothing to push.");
    return;
  }

  console.log(`📝 Changed/new: ${toUpload.length}  |  Deleted: ${toDelete.length}`);

  const treeItems = [];
  for (let i = 0; i < toUpload.length; i++) {
    const { path, sha, mode, fromDisk } = toUpload[i];
    let content;
    try {
      content = (fromDisk || !sha)
        ? readFileSync(path)
        : execSync(`git cat-file blob ${sha}`, { maxBuffer: 50*1024*1024 });
    } catch { console.warn(`  ⚠ Skip: ${path}`); continue; }

    const blob = await api("POST", "/git/blobs", {
      content: content.toString("base64"),
      encoding: "base64",
    });
    treeItems.push({ path, mode: mode === "100755" ? "100755" : "100644", type: "blob", sha: blob.sha });
    process.stdout.write(`  ✔ ${i+1}/${toUpload.length} ${path}\n`);
    if ((i + 1) % 20 === 0) await sleep(500);
  }

  for (const path of toDelete) {
    treeItems.push({ path, mode: "100644", type: "blob", sha: null });
  }

  const tree   = await api("POST", "/git/trees", { base_tree: remoteTreeSHA, tree: treeItems });
  const commit = await api("POST", "/git/commits", { message: commitMsg, tree: tree.sha, parents: [remoteSHA] });
  await api("PATCH", `/git/refs/heads/${BRANCH}`, { sha: commit.sha, force: true });

  console.log(`🎉 Pushed → https://github.com/${OWNER}/${REPO}/commit/${commit.sha.slice(0,7)}\n`);
}

// ── Watcher state ────────────────────────────────────────────────────────────
let debounceTimer = null;
let changedFiles  = new Set();
let isPushing     = false;

function scheduleAutoPush(filename) {
  if (shouldIgnore(filename)) return;
  changedFiles.add(filename);
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(triggerPush, DEBOUNCE_MS);
  process.stdout.write(`\r📝 ${changedFiles.size} change(s) detected — pushing in ${DEBOUNCE_MS/1000}s...   `);
}

async function triggerPush() {
  if (isPushing) { debounceTimer = setTimeout(triggerPush, 5000); return; }
  const files = [...changedFiles];
  changedFiles.clear();
  debounceTimer = null;
  isPushing = true;
  console.log(`\n\n🚀 Auto-pushing (${files.length} file(s) changed)...`);
  try {
    await pushToGitHub();
  } catch (err) {
    console.error("❌ Push failed:", err.message);
  } finally {
    isPushing = false;
  }
}

// ── Keep-alive poll (every 5 min, in case watcher misses events) ─────────────
setInterval(() => {
  try {
    const changes = execSync("git status --porcelain", { maxBuffer: 1024*1024 }).toString().trim();
    if (changes) scheduleAutoPush("poll-check");
  } catch { /* ignore */ }
}, 5 * 60_000);

// ── Start watcher ─────────────────────────────────────────────────────────────
console.log("👀 SOFTWORKS Auto-Push watcher started");
console.log(`   Pushes ${DEBOUNCE_MS/1000}s after the last file change\n`);

// Initial push on startup
(async () => {
  console.log("🔄 Initial push on startup...");
  try { await pushToGitHub(); } catch (e) { console.error("Initial push error:", e.message); }
  console.log("👀 Watching for changes...\n");
})();

// Set up file watcher
try {
  watch(ROOT, { recursive: true }, (_event, filename) => {
    if (filename) scheduleAutoPush(filename);
  });
  console.log("✅ File watcher active (recursive)");
} catch {
  // Fallback to watching specific dirs
  const dirs = ["artifacts/softworks/src","artifacts/api-server/src","lib/db/src","scripts"];
  let watchCount = 0;
  for (const dir of dirs) {
    const full = join(ROOT, dir);
    if (!existsSync(full)) continue;
    try {
      watch(full, { recursive: true }, (_e, f) => { if (f) scheduleAutoPush(join(dir, f)); });
      watchCount++;
    } catch { /* skip */ }
  }
  console.log(`✅ File watcher active (${watchCount} directories)`);
}

process.on("SIGINT", () => { console.log("\n👋 Watcher stopped."); process.exit(0); });
