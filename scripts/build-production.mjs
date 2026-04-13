/**
 * SOFTWORKS IT FARM — Production Build Script
 * Builds frontend (Vite) + API server (esbuild) and combines them.
 * Run: node scripts/build-production.mjs
 */
import { execSync } from "node:child_process";
import { cpSync, mkdirSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, opts = {}) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: ROOT, ...opts });
}

console.log("🏗️  SOFTWORKS IT FARM — Production Build\n");

console.log("📦 Step 1: Installing dependencies...");
run("pnpm install --frozen-lockfile");

console.log("\n🎨 Step 2: Building frontend (Vite)...");
run("pnpm --filter @workspace/softworks run build", {
  env: {
    ...process.env,
    NODE_ENV: "production",
    VITE_API_URL: process.env.VITE_API_URL ?? "",
  },
});

console.log("\n⚙️  Step 3: Building API server (esbuild)...");
run("pnpm --filter @workspace/api-server run build");

console.log("\n📋 Step 4: Copying frontend build into API server dist...");
const frontendDist = path.join(ROOT, "artifacts/softworks/dist/public");
const apiPublicDist = path.join(ROOT, "artifacts/api-server/dist/public");

if (!existsSync(frontendDist)) {
  console.error("❌ Frontend build not found at:", frontendDist);
  process.exit(1);
}

if (existsSync(apiPublicDist)) rmSync(apiPublicDist, { recursive: true });
mkdirSync(apiPublicDist, { recursive: true });
cpSync(frontendDist, apiPublicDist, { recursive: true });

console.log("\n✅ Production build complete!");
console.log(`   API server: artifacts/api-server/dist/index.mjs`);
console.log(`   Frontend:   artifacts/api-server/dist/public/`);
console.log(`\n🚀 Start with:`);
console.log(`   NODE_ENV=production DATABASE_URL=<neon-url> node artifacts/api-server/dist/index.mjs`);
