import { execSync } from "child_process";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function run(cmd, label) {
  console.log(`\n⚙️  ${label}`);
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: root });
}

console.log("🔨 Building SOFTWORKS IT FARM for Vercel...\n");

run(
  "pnpm --filter @workspace/softworks run build",
  "Step 1: Building frontend (Vite)..."
);

run(
  "pnpm --filter @workspace/api-server run build",
  "Step 2: Building API server (esbuild)..."
);

console.log("\n📋 Step 3: Copying serverless bundle → api/index.mjs...");
await mkdir(path.resolve(root, "api"), { recursive: true });
await copyFile(
  path.resolve(root, "artifacts/api-server/dist/serverless.mjs"),
  path.resolve(root, "api/index.mjs")
);

console.log("\n✅ Vercel build complete!");
console.log("   Frontend : artifacts/softworks/dist/public/");
console.log("   API      : api/index.mjs  (Vercel serverless function)");
console.log("\n📌 Required env vars in Vercel project settings:");
console.log("   NEON_DATABASE_URL  = postgresql://... (your Neon PostgreSQL URL)");
