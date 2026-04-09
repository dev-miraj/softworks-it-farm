import { defineConfig } from "drizzle-kit";
import path from "path";

function getUrl(): string {
  const url =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL;

  if (!url) throw new Error("No database URL found in environment variables.");
  try {
    const u = new URL(url);
    u.searchParams.delete("channel_binding");
    return u.toString();
  } catch {
    return url;
  }
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: { url: getUrl() },
});
