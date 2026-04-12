#!/usr/bin/env node
/**
 * github-push.mjs — Smart push via GitHub Git Data API
 * Uses Replit GitHub Connector (OAuth) — no GITHUB_PAT needed.
 * Compares local git tree with GitHub's tree and only uploads changed blobs.
 */

import { execSync } from "child_process";
import { readFileSync, statSync, readdirSync } from "fs";
import { join } from "path";
import { ReplitConnectors } from "@replit/connectors-sdk";

const OWNER  = "dev-miraj";
const REPO   = "softworks-it-farm";
const BRANCH = "main";

const connectors = new ReplitConnectors();

async function api(method, path, body) {
  const opts = { method };
  if (body) {
    opts.body = JSON.stringify(body);
    opts.headers = { "Content-Type": "application/json" };
  }
  // Uses Replit GitHub Connector — token injected automatically
  const res = await connectors.proxy("github", `/repos/${OWNER}/${REPO}${path}`, opts);
  const json = await res.json();
  if (!res.ok) {
    console.error(`❌ ${res.status} ${method} ${path}: ${json.message}`);
    process.exit(1);
  }
  return json;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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

async function main() {
  console.log("🚀  SOFTWORKS → GitHub push\n");

  const localSHA  = execSync("git rev-parse HEAD").toString().trim();
  const commitMsg = execSync("git log -1 --pretty=%s").toString().trim();

  // Remote branch ref
  const remoteRef = await api("GET", `/git/ref/heads/${BRANCH}`);
  const remoteSHA = remoteRef.object.sha;
  console.log(`📌 Local : ${localSHA.slice(0,7)} — "${commitMsg}"`);
  console.log(`☁️  Remote: ${remoteSHA.slice(0,7)}\n`);

  // Get full remote tree (recursive)
  console.log("🔍 Fetching remote tree...");
  const remoteCommit = await api("GET", `/git/commits/${remoteSHA}`);
  const remoteTreeSHA = remoteCommit.tree.sha;
  const remoteTreeResp = await api("GET", `/git/trees/${remoteTreeSHA}?recursive=1`);

  // Build map: path → sha
  const remoteFiles = {};
  for (const item of remoteTreeResp.tree) {
    if (item.type === "blob") remoteFiles[item.path] = item.sha;
  }
  console.log(`  Remote has ${Object.keys(remoteFiles).length} files\n`);

  // Get local tree from HEAD
  const localTreeLines = execSync("git ls-tree -r HEAD", { maxBuffer: 20*1024*1024 })
    .toString().trim().split("\n").filter(Boolean);

  const localFiles = {};
  for (const line of localTreeLines) {
    const [meta, filePath] = line.split("\t");
    const parts = meta.split(" ");
    const mode  = parts[0];
    const sha   = parts[2];
    localFiles[filePath] = { sha, mode };
  }

  // Merge uncommitted working-tree changes
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

  // Find changed/added/deleted files
  const toUpload = [];
  const toDelete = [];

  for (const [path, { sha, mode, fromDisk }] of Object.entries(localFiles)) {
    if (remoteFiles[path] !== sha) toUpload.push({ path, sha, mode, fromDisk });
  }
  for (const path of Object.keys(remoteFiles)) {
    if (!localFiles[path]) toDelete.push(path);
  }

  console.log(`📝 Changed/new: ${toUpload.length} files  |  Deleted: ${toDelete.length} files\n`);

  if (toUpload.length === 0 && toDelete.length === 0) {
    console.log("✅ Already up to date. Nothing to push.");
    return;
  }

  // Upload only changed blobs
  const treeItems = [];
  for (let i = 0; i < toUpload.length; i++) {
    const { path, sha, mode, fromDisk } = toUpload[i];
    let content;
    try {
      content = (fromDisk || !sha)
        ? readFileSync(path)
        : execSync(`git cat-file blob ${sha}`, { maxBuffer: 50*1024*1024 });
    } catch {
      console.warn(`  ⚠️  Skip: ${path}`); continue;
    }

    const blob = await api("POST", "/git/blobs", {
      content: content.toString("base64"),
      encoding: "base64",
    });

    treeItems.push({
      path,
      mode: mode === "100755" ? "100755" : "100644",
      type: "blob",
      sha: blob.sha,
    });

    process.stdout.write(`  ✔ ${i+1}/${toUpload.length}  ${path}\n`);
    if ((i + 1) % 20 === 0) await sleep(500);
  }

  // Mark deleted
  for (const path of toDelete) {
    treeItems.push({ path, mode: "100644", type: "blob", sha: null });
  }

  // Create tree on top of remote tree
  console.log("\n🌳 Creating tree...");
  const tree = await api("POST", "/git/trees", {
    base_tree: remoteTreeSHA,
    tree: treeItems,
  });
  console.log(`✅ Tree: ${tree.sha.slice(0,7)}`);

  // Create commit
  console.log("💾 Creating commit...");
  const commit = await api("POST", "/git/commits", {
    message: commitMsg,
    tree: tree.sha,
    parents: [remoteSHA],
  });
  console.log(`✅ Commit: ${commit.sha.slice(0,7)}`);

  // Update branch ref
  console.log(`🔀 Updating ${BRANCH}...`);
  await api("PATCH", `/git/refs/heads/${BRANCH}`, {
    sha: commit.sha,
    force: true,
  });

  console.log(`\n🎉 Done! → https://github.com/${OWNER}/${REPO}/commit/${commit.sha.slice(0,7)}`);
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
