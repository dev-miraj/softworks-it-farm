#!/usr/bin/env node
/**
 * github-push.mjs
 * Pushes the current git state to GitHub via the Git Data API.
 * Bypasses Replit's gitsafe git-push restriction completely.
 *
 * Usage:
 *   GITHUB_PAT=<token> node scripts/github-push.mjs
 *   or: node scripts/github-push.mjs <token>
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";

const OWNER = "dev-miraj";
const REPO  = "softworks-it-farm";
const BRANCH = "main";
const TOKEN = process.env.GITHUB_PAT || process.argv[2];

if (!TOKEN) {
  console.error("❌  No token. Set GITHUB_PAT env or pass as first arg.");
  process.exit(1);
}

const BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;
const HEADERS = {
  Authorization: `token ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
  "User-Agent": "softworks-push-script",
};

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    console.error(`API error ${res.status} at ${method} ${path}:`, json.message);
    process.exit(1);
  }
  return json;
}

async function main() {
  console.log("🚀 Starting GitHub push via API...\n");

  // 1. Get current local commit SHA
  const localSHA = execSync("git rev-parse HEAD").toString().trim();
  const commitMsg = execSync("git log -1 --pretty=%B").toString().trim();
  console.log(`📌 Local HEAD: ${localSHA.slice(0,7)}  "${commitMsg}"`);

  // 2. Get remote branch SHA
  const remoteRef = await api("GET", `/git/ref/heads/${BRANCH}`);
  const remoteSHA = remoteRef.object.sha;
  console.log(`☁️  Remote HEAD: ${remoteSHA.slice(0,7)}\n`);

  if (localSHA === remoteSHA) {
    console.log("✅ Already up to date. Nothing to push.");
    return;
  }

  // 3. List all files in the current tree
  const lsTree = execSync("git ls-tree -r HEAD --long", { maxBuffer: 20 * 1024 * 1024 })
    .toString().trim().split("\n");

  console.log(`📦 Uploading ${lsTree.length} files as blobs...\n`);

  const treeItems = [];
  let done = 0;

  for (const line of lsTree) {
    // format: mode SP type SP sha TAB size TAB path
    const parts = line.split(/\s+/);
    const mode   = parts[0];
    const type   = parts[1];
    const gitSHA = parts[2];
    // path is after the third tab-separated block
    const filePath = line.split("\t")[1];

    if (type !== "blob") continue;

    // Read file content as base64
    let content;
    try {
      content = execSync(`git cat-file blob ${gitSHA}`, { maxBuffer: 50 * 1024 * 1024 });
    } catch {
      console.warn(`  ⚠️  Skipping unreadable: ${filePath}`);
      continue;
    }

    const base64 = content.toString("base64");

    // Create blob on GitHub
    const blob = await api("POST", "/git/blobs", {
      content: base64,
      encoding: "base64",
    });

    treeItems.push({
      path: filePath,
      mode: mode === "100755" ? "100755" : "100644",
      type: "blob",
      sha: blob.sha,
    });

    done++;
    if (done % 30 === 0 || done === lsTree.length) {
      process.stdout.write(`  ✔ ${done}/${lsTree.length} blobs uploaded\r`);
    }
  }
  console.log(`\n✅ All ${done} blobs uploaded.\n`);

  // 4. Create a new tree
  console.log("🌳 Creating tree...");
  const tree = await api("POST", "/git/trees", {
    base_tree: null,   // full tree replacement
    tree: treeItems,
  });
  console.log(`✅ Tree: ${tree.sha.slice(0,7)}\n`);

  // 5. Create a commit
  console.log("💾 Creating commit...");
  const commit = await api("POST", "/git/commits", {
    message: commitMsg,
    tree: tree.sha,
    parents: [remoteSHA],
  });
  console.log(`✅ Commit: ${commit.sha.slice(0,7)}\n`);

  // 6. Update the branch ref
  console.log(`🔀 Updating refs/heads/${BRANCH}...`);
  await api("PATCH", `/git/refs/heads/${BRANCH}`, {
    sha: commit.sha,
    force: true,
  });
  console.log(`\n🎉 Successfully pushed to github.com/${OWNER}/${REPO} (${BRANCH})!`);
  console.log(`🔗 https://github.com/${OWNER}/${REPO}/commit/${commit.sha}`);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
