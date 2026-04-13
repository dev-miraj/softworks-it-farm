import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET =
  process.env["JWT_SECRET"] ||
  process.env["SESSION_SECRET"] ||
  "softworks-dev-secret-change-in-production";

const ADMIN_USERNAME = process.env["ADMIN_USERNAME"] || "admin";
const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] || "Softworks@2024";

export interface AdminTokenPayload {
  username: string;
  role: "admin";
  iat?: number;
  exp?: number;
}

export function signAdminToken(username: string): string {
  return jwt.sign({ username, role: "admin" } as AdminTokenPayload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
  } catch {
    return null;
  }
}

export function checkAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  const cookieToken = (req as any).cookies?.["sw_admin_token"];

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : cookieToken;

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const payload = verifyAdminToken(token);
  if (!payload || payload.role !== "admin") {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }

  (req as any).admin = payload;
  next();
}
