#!/usr/bin/env node
/**
 * github-push.mjs — Smart push via GitHub Git Data API
 * Compares local git tree (HEAD + working-tree changes) with GitHub's tree via API.
 * Only uploads blobs that actually changed. No rate-limit issues.
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";

const OWNER  = "dev-miraj";
const REPO   = "softworks-it-farm";
const BRANCH = "main";
const TOKEN  = process.env.GITHUB_PAT || process.argv[2];

if (!TOKEN) { console.error("❌ GITHUB_PAT not set."); process.exit(1); }

const BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;
const H = {
  Authorization: `token ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
  "User-Agent": "softworks-push-script",
};

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method, headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    console.error(`❌ ${res.status} ${method} ${path}: ${json.message}`);
    process.exit(1);
  }
  return json;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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

  const localFiles = {}; // path → { gitSha, mode, fromDisk? }
  for (const line of localTreeLines) {
    // format: <mode> SP blob SP <sha> TAB <path>
    const [meta, filePath] = line.split("\t");
    const parts = meta.split(" ");
    const mode  = parts[0];
    const sha   = parts[2];
    localFiles[filePath] = { sha, mode };
  }

  // Merge uncommitted working-tree changes (modified + new untracked files)
  try {
    const statusOut = execSync("git status --porcelain", { maxBuffer: 5*1024*1024 }).toString();
    for (const line of statusOut.split("\n").filter(Boolean)) {
      const xy = line.slice(0, 2);
      const filePath = line.slice(3).trim().replace(/^"(.*)"$/, "$1");
      if (xy.includes("D")) {
        // Deleted in working tree
        delete localFiles[filePath];
      } else if (!xy.startsWith("!")) {
        // Modified or new — mark to read from disk
        localFiles[filePath] = { sha: null, mode: "100644", fromDisk: true };
      }
    }
  } catch { /* ignore */ }

  // Find changed/added/deleted files
  const toUpload = [];
  const toDelete = [];

  for (const [path, { sha, mode, fromDisk }] of Object.entries(localFiles)) {
    if (remoteFiles[path] !== sha) {
      toUpload.push({ path, sha, mode, fromDisk });
    }
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
      if (fromDisk || !sha) {
        content = readFileSync(path);
      } else {
        content = execSync(`git cat-file blob ${sha}`, { maxBuffer: 50*1024*1024 });
      }
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

    // Rate-limit safety: small pause every 20 uploads
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
