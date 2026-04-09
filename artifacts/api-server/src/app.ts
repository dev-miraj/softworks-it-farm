import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import router from "./routes";

const app: Express = express();

// Simple request logger — no pino workers/threads (safe for Vercel Lambda cold starts)
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.url?.split("?")[0]} ${res.statusCode} ${ms}ms`);
  });
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Global error handler — catches all thrown errors from async routes (Express 5)
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("Unhandled route error:", message, "url:", req.url);
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error", detail: message });
  }
});

export default app;
