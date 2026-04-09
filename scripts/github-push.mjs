#!/usr/bin/env node
/**
 * github-push.mjs  — diff-only push via GitHub Git Data API
 * Only uploads blobs that changed between remote HEAD and local HEAD.
 */

import { execSync } from "child_process";

const OWNER  = "dev-miraj";
const REPO   = "softworks-it-farm";
const BRANCH = "main";
const TOKEN  = process.env.GITHUB_PAT || process.argv[2];

if (!TOKEN) { console.error("❌ No token."); process.exit(1); }

const BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;
const H = {
  Authorization: `token ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
  "User-Agent": "softworks-push-script",
};

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method, headers: H, body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    console.error(`❌ API ${res.status} ${method} ${path}: ${json.message}`);
    process.exit(1);
  }
  return json;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("🚀  GitHub push (diff-only)...\n");

  const localSHA  = execSync("git rev-parse HEAD").toString().trim();
  const commitMsg = execSync("git log -1 --pretty=%s").toString().trim();

  // Get remote ref
  const remoteRef = await api("GET", `/git/ref/heads/${BRANCH}`);
  const remoteSHA = remoteRef.object.sha;
  console.log(`📌 Local : ${localSHA.slice(0,7)}  "${commitMsg}"`);
  console.log(`☁️  Remote: ${remoteSHA.slice(0,7)}\n`);

  if (localSHA === remoteSHA) {
    console.log("✅ Already up to date."); return;
  }

  // Get changed files between remote SHA and local HEAD
  let changedLines;
  try {
    changedLines = execSync(`git diff --name-status ${remoteSHA} HEAD`, { maxBuffer: 20*1024*1024 })
      .toString().trim().split("\n").filter(Boolean);
  } catch {
    // If remote SHA not in local history, fall back to all files
    console.log("⚠️  Remote SHA not in local history — uploading all files.");
    changedLines = execSync("git ls-tree -r HEAD --name-only", { maxBuffer: 20*1024*1024 })
      .toString().trim().split("\n").filter(Boolean)
      .map(f => `M\t${f}`);
  }

  const deleted = [];
  const upserted = [];

  for (const line of changedLines) {
    const [status, ...rest] = line.split("\t");
    const filePath = rest[rest.length - 1];
    if (status.startsWith("D")) {
      deleted.push(filePath);
    } else {
      upserted.push(filePath);
    }
  }

  console.log(`📝 Changed: ${upserted.length} files, deleted: ${deleted.length} files\n`);

  if (upserted.length === 0 && deleted.length === 0) {
    console.log("✅ No changes to push."); return;
  }

  // Get remote tree SHA for base
  const remoteCommit = await api("GET", `/git/commits/${remoteSHA}`);
  const remoteTreeSHA = remoteCommit.tree.sha;

  // Upload new/modified blobs
  const treeItems = [];

  for (let i = 0; i < upserted.length; i++) {
    const filePath = upserted[i];
    let content;
    try {
      content = execSync(`git show HEAD:"${filePath}"`, { maxBuffer: 50*1024*1024 });
    } catch {
      console.warn(`  ⚠️  Skip: ${filePath}`); continue;
    }

    const blob = await api("POST", "/git/blobs", {
      content: content.toString("base64"),
      encoding: "base64",
    });

    // Get file mode
    let mode = "100644";
    try {
      const info = execSync(`git ls-tree HEAD -- "${filePath}"`).toString().trim();
      if (info.startsWith("100755")) mode = "100755";
    } catch {}

    treeItems.push({ path: filePath, mode, type: "blob", sha: blob.sha });
    process.stdout.write(`  ✔ ${i+1}/${upserted.length} ${filePath}\n`);

    // Small delay every 10 to avoid secondary rate limits
    if ((i + 1) % 10 === 0) await sleep(300);
  }

  // Mark deleted files
  for (const filePath of deleted) {
    treeItems.push({ path: filePath, mode: "100644", type: "blob", sha: null });
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

  // Update ref
  console.log(`🔀 Updating ${BRANCH}...`);
  await api("PATCH", `/git/refs/heads/${BRANCH}`, {
    sha: commit.sha,
    force: true,
  });

  console.log(`\n🎉 Pushed! → https://github.com/${OWNER}/${REPO}/commit/${commit.sha}`);
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
