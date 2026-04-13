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
import { requestTimeout } from "./lib/requestTimeout.js";
import { ipSecurityMiddleware, suspiciousActivityDetection } from "./lib/ipSecurity.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

app.set("trust proxy", 1);

app.use(compression({ threshold: 1024 }));
app.use(metricsMiddleware);
app.use(requestTimeout(30_000));

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const urlPath = req.url?.split("?")[0];
    if (urlPath !== "/api/health" && urlPath !== "/api/healthz" && urlPath !== "/api/ready") {
      logger.info({ method: req.method, path: urlPath, status: res.statusCode, ms }, "request");
    }
  });
  next();
});

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }),
);

app.use(ipSecurityMiddleware);
app.use(suspiciousActivityDetection);

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later." },
  skip: (req) => {
    const p = req.path;
    return p === "/api/health" || p === "/api/healthz" || p === "/api/ready";
  },
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many login attempts, please try again later." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/v1/auth/login", authLimiter);

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
app.use("/api/v1", router);

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
    logger.info({ frontendDist }, "[static] Serving frontend");
    app.use(express.static(frontendDist, { maxAge: "1d", etag: true }));
    app.get("/{*path}", (_req: Request, res: Response) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  } else {
    logger.warn("[static] Frontend dist not found. Only API will be served.");
  }
}

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  if (message !== "CORS: origin not allowed") {
    logger.error({ err: message, url: req.url, method: req.method }, "Unhandled route error");
  }
  if (!res.headersSent) {
    const status = (err as any)?.status || 500;
    res.status(status).json({ success: false, error: "Internal server error" });
  }
});

export default app;
