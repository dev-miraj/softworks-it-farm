#!/usr/bin/env node
/**
 * SOFTWORKS — Password Hash Utility
 * 
 * Usage:
 *   node scripts/hash-password.mjs "YourNewPassword"
 * 
 * Then set the output as ADMIN_PASSWORD in your environment variables.
 * The API server auto-detects bcrypt hashes (starts with $2b$).
 */

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.mjs \"YourPassword\"");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Error: Password must be at least 8 characters long.");
  process.exit(1);
}

let bcrypt;
try {
  bcrypt = require("bcryptjs");
} catch {
  console.error("bcryptjs not found. Run: pnpm add bcryptjs in artifacts/api-server/");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);

console.log("\n✅ Password hashed successfully!\n");
console.log("Set this in your environment variables:");
console.log("─".repeat(60));
console.log(`ADMIN_PASSWORD=${hash}`);
console.log("─".repeat(60));
console.log("\n💡 Also generate a strong JWT secret:");
console.log(`JWT_SECRET=${require("crypto").randomBytes(64).toString("hex")}`);
console.log(`JWT_REFRESH_SECRET=${require("crypto").randomBytes(64).toString("hex")}`);
