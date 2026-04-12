#!/usr/bin/env node
/**
 * github-watch.mjs — Auto-push to GitHub via polling.
 * Uses Replit GitHub Connector. Skips files >400KB to avoid proxy limits.
 * Falls back gracefully on rate-limit errors and retries on next change.
 */

import { execSync } from "child_process";
import { readFileSync, statSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { ReplitConnectors } from "@replit/connectors-sdk";

const ROOT          = resolve(process.cwd());
const OWNER         = "dev-miraj";
const REPO          = "softworks-it-farm";
const BRANCH        = "main";
const QUIET_SECONDS = 30;
const POLL_SECONDS  = 30;
const MAX_FILE_BYTES = 400 * 1024; // Skip files > 400KB (lock files etc)

const connectors = new ReplitConnectors();

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function githubApi(method, path, body, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const opts = { method };
    if (body) {
      opts.body = JSON.stringify(body);
      opts.headers = { "Content-Type": "application/json" };
    }
    const res = await connectors.proxy("github", `/repos/${OWNER}/${REPO}${path}`, opts);

    let json;
    try { json = await res.json(); } catch {
      if (attempt < retries) { await sleep(2000 * attempt); continue; }
      throw new Error(`GitHub ${res.status} ${method} ${path}: non-JSON response`);
    }

    if (res.status === 429 || res.status === 403) {
      if (attempt < retries) {
        console.warn(`  ⚠ Rate limited, waiting ${5 * attempt}s...`);
        await sleep(5000 * attempt); continue;
      }
    }
    if (!res.ok) throw new Error(`GitHub ${res.status} ${method} ${path}: ${json.message}`);
    return json;
  }
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

async function push() {
  const commitMsg = execSync("git log -1 --pretty=%s", { cwd: ROOT }).toString().trim();

  const remoteRef     = await githubApi("GET", `/git/ref/heads/${BRANCH}`);
  const remoteSHA     = remoteRef.object.sha;
  const remoteCommit  = await githubApi("GET", `/git/commits/${remoteSHA}`);
  const remoteTreeSHA = remoteCommit.tree.sha;
  const remoteTree    = await githubApi("GET", `/git/trees/${remoteTreeSHA}?recursive=1`);

  const remoteFiles = {};
  for (const item of remoteTree.tree) {
    if (item.type === "blob") remoteFiles[item.path] = item.sha;
  }

  const localFiles = {};
  for (const line of execSync("git ls-tree -r HEAD", { maxBuffer: 20*1024*1024, cwd: ROOT }).toString().trim().split("\n").filter(Boolean)) {
    const [meta, fp] = line.split("\t");
    const parts = meta.split(" ");
    localFiles[fp] = { sha: parts[2], mode: parts[0] };
  }

  try {
    for (const line of execSync("git status --porcelain", { maxBuffer: 5*1024*1024, cwd: ROOT }).toString().split("\n").filter(Boolean)) {
      const xy = line.slice(0, 2);
      const fp = line.slice(3).trim().replace(/^"(.*)"$/, "$1");
      if (xy.includes("D")) {
        delete localFiles[fp];
      } else if (!xy.startsWith("!")) {
        for (const f of expandPath(fp)) {
          localFiles[f] = { sha: null, mode: "100644", fromDisk: true };
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
    return false; // nothing to push
  }

  console.log(`📝 Changed: ${toUpload.length} | Deleted: ${toDelete.length}`);

  const treeItems = [];
  let skipped = 0;

  for (let i = 0; i < toUpload.length; i++) {
    const { path, sha, mode, fromDisk } = toUpload[i];
    let content;
    try {
      content = (fromDisk || !sha)
        ? readFileSync(join(ROOT, path))
        : execSync(`git cat-file blob ${sha}`, { maxBuffer: 50*1024*1024, cwd: ROOT });
    } catch { console.warn(`  ⚠ Skip (read error): ${path}`); skipped++; continue; }

    // Skip files exceeding proxy size limit
    if (content.length > MAX_FILE_BYTES) {
      console.log(`  ⏭ Skip (${Math.round(content.length/1024)}KB, too large): ${path}`);
      skipped++;
      continue;
    }

    const blob = await githubApi("POST", "/git/blobs", {
      content: content.toString("base64"),
      encoding: "base64",
    });
    treeItems.push({ path, mode: mode === "100755" ? "100755" : "100644", type: "blob", sha: blob.sha });
    process.stdout.write(`  ✔ ${i+1-skipped}/${toUpload.length-skipped} ${path}\n`);
    // Small pause between uploads
    if ((i + 1) % 10 === 0) await sleep(300);
  }

  for (const path of toDelete) {
    treeItems.push({ path, mode: "100644", type: "blob", sha: null });
  }

  if (treeItems.length === 0) {
    console.log("  ℹ Only large files changed (will be pushed manually).\n");
    return false;
  }

  const tree   = await githubApi("POST", "/git/trees", { base_tree: remoteTreeSHA, tree: treeItems });
  const commit = await githubApi("POST", "/git/commits", { message: commitMsg, tree: tree.sha, parents: [remoteSHA] });
  await githubApi("PATCH", `/git/refs/heads/${BRANCH}`, { sha: commit.sha, force: true });

  console.log(`🎉 Pushed → https://github.com/${OWNER}/${REPO}/commit/${commit.sha.slice(0,7)}\n`);
  return true;
}

// ── Polling ───────────────────────────────────────────────────────────────────
let quietTimer = null;
let isPushing  = false;
let lastStatus = "";

function getGitStatus() {
  try {
    return execSync("git status --porcelain", { maxBuffer: 1024*1024, cwd: ROOT }).toString().trim();
  } catch { return ""; }
}

async function triggerPush() {
  if (isPushing) { quietTimer = setTimeout(triggerPush, 10_000); return; }
  isPushing = true;
  console.log("\n🚀 Pushing to GitHub...");
  try {
    await push();
  } catch (err) {
    console.error("❌ Push failed:", err.message, "\n");
  } finally {
    isPushing = false;
    lastStatus = getGitStatus();
  }
}

function poll() {
  const status = getGitStatus();
  if (status === lastStatus) return;
  lastStatus = status;

  const count = status.split("\n").filter(Boolean).length;
  process.stdout.write(`\r📁 ${count} change(s) detected — pushing in ${QUIET_SECONDS}s...   `);

  if (quietTimer) clearTimeout(quietTimer);
  quietTimer = setTimeout(triggerPush, QUIET_SECONDS * 1000);
}

// ── Start ─────────────────────────────────────────────────────────────────────
console.log("👀 SOFTWORKS Auto-Push (polling, every 30s)");
console.log(`   Files >400KB are skipped (push manually for lock files)\n`);

console.log("🔄 Initial push...");
isPushing = true;
push()
  .then(() => { console.log("✅ Watching...\n"); })
  .catch(err => console.error("Initial push error:", err.message))
  .finally(() => { isPushing = false; lastStatus = getGitStatus(); setInterval(poll, POLL_SECONDS * 1000); });

process.on("SIGINT", () => { console.log("\n👋 Stopped."); process.exit(0); });
