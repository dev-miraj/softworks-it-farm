// Simple logger — avoids pino's thread-stream/worker_threads which hang on Vercel Lambda cold starts
const level = process.env.LOG_LEVEL ?? "info";

const LEVELS: Record<string, number> = { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60 };
const currentLevel = LEVELS[level] ?? 30;

function log(lvl: string, obj: unknown, msg?: string) {
  if ((LEVELS[lvl] ?? 30) < currentLevel) return;
  const out = msg ? { level: lvl, msg, ...(typeof obj === "object" && obj !== null ? obj : { data: obj }) } : { level: lvl, ...(typeof obj === "object" && obj !== null ? obj : { msg: String(obj) }) };
  if (lvl === "error" || lvl === "fatal") {
    console.error(JSON.stringify(out));
  } else {
    console.log(JSON.stringify(out));
  }
}

export const logger = {
  trace: (obj: unknown, msg?: string) => log("trace", obj, msg),
  debug: (obj: unknown, msg?: string) => log("debug", obj, msg),
  info:  (obj: unknown, msg?: string) => log("info",  obj, msg),
  warn:  (obj: unknown, msg?: string) => log("warn",  obj, msg),
  error: (obj: unknown, msg?: string) => log("error", obj, msg),
  fatal: (obj: unknown, msg?: string) => log("fatal", obj, msg),
};
