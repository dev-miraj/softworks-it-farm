import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import router from "./routes";

const app: Express = express();

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.url?.split("?")[0]} ${res.statusCode} ${ms}ms`);
  });
  next();
});

const allowedOrigins: (string | RegExp)[] = [
  "https://softworksit.vercel.app",
  /\.vercel\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  console.error("Unhandled route error:", message, "url:", req.url);
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error", detail: message });
  }
});

export default app;
