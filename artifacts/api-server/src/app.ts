import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import cookieParser from "cookie-parser";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import path from "node:path";
import fs from "node:fs";
import router from "./routes";
import { csrfProtection } from "./lib/csrf.js";
import { metricsMiddleware } from "./lib/metrics.js";
import { swaggerSpec } from "./lib/swagger.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

app.set("trust proxy", 1);

app.use(compression({ threshold: 1024 }));
app.use(metricsMiddleware);

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const urlPath = req.url?.split("?")[0];
    logger.info({ method: req.method, path: urlPath, status: res.statusCode, ms }, "request");
  });
  next();
});

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
);

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: (req) => req.path === "/api/health" || req.path === "/api/healthz",
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later." },
});
app.use("/api/auth/login", authLimiter);

const allowedOrigins: (string | RegExp)[] = [
  "https://softworksit.vercel.app",
  /\.vercel\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

const extraOrigins = process.env["ALLOWED_ORIGINS"];
if (extraOrigins) {
  extraOrigins.split(",").forEach((o) => allowedOrigins.push(o.trim()));
}

if (process.env["NODE_ENV"] !== "production") {
  allowedOrigins.push(/\.replit\.dev$/, /\.replit\.app$/);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const ok = allowedOrigins.some((o) =>
        typeof o === "string" ? o === origin : o.test(origin),
      );
      callback(ok ? null : new Error("CORS: origin not allowed"), ok);
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use(csrfProtection);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "SOFTWORKS API Docs",
  customCss: ".swagger-ui .topbar { background: #0a0a1a; } .swagger-ui .topbar-wrapper img { content: none; }",
}));

app.use("/api", router);

const isProduction = process.env["NODE_ENV"] === "production";
const isVercel = !!process.env["VERCEL"];

if (isProduction && !isVercel) {
  const candidatePaths = [
    process.env["FRONTEND_DIST"],
    path.resolve(__dirname, "public"),
    path.resolve(process.cwd(), "artifacts/api-server/dist/public"),
    path.resolve(process.cwd(), "dist/public"),
    path.resolve(process.cwd(), "../softworks/dist/public"),
  ].filter(Boolean) as string[];

  const frontendDist = candidatePaths.find((p) => fs.existsSync(path.join(p, "index.html")));

  if (frontendDist) {
    console.log(`[static] Serving frontend from: ${frontendDist}`);
    app.use(express.static(frontendDist, { maxAge: "1d", etag: true }));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  } else {
    console.warn("[static] Frontend dist not found. Only API will be served.");
  }
}

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  if (message !== "CORS: origin not allowed") {
    console.error("Unhandled route error:", message, "url:", req.url);
  }
  if (!res.headersSent) {
    const status = (err as any)?.status || 500;
    res.status(status).json({ error: "Internal server error", detail: message });
  }
});

export default app;
