import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import { logger } from "./logger.js";

const ACCESS_SECRET =
  process.env["JWT_SECRET"] ||
  process.env["SESSION_SECRET"] ||
  "softworks-access-dev-secret-change-in-production";

const REFRESH_SECRET =
  process.env["JWT_REFRESH_SECRET"] ||
  ACCESS_SECRET + "_refresh";

const ADMIN_USERNAME = process.env["ADMIN_USERNAME"] || "admin";
const ADMIN_PASSWORD_ENV = process.env["ADMIN_PASSWORD"] || "Softworks@2024";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";
export const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const ACCESS_COOKIE = "sw_access_token";
const REFRESH_COOKIE = "sw_refresh_token";

export type Role = "admin" | "manager" | "user";

export interface TokenPayload {
  username: string;
  role: Role;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

export function signAccessToken(username: string, role: Role = "admin"): string {
  return jwt.sign({ username, role, type: "access" } as TokenPayload, ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function signRefreshToken(username: string, role: Role = "admin"): string {
  return jwt.sign({ username, role, type: "refresh" } as TokenPayload, REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const p = jwt.verify(token, ACCESS_SECRET) as TokenPayload;
    return p.type === "access" ? p : null;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const p = jwt.verify(token, REFRESH_SECRET) as TokenPayload;
    return p.type === "refresh" ? p : null;
  } catch {
    return null;
  }
}

export async function checkAdminCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  if (username !== ADMIN_USERNAME) return false;

  const isBcryptHash = ADMIN_PASSWORD_ENV.startsWith("$2b$") || ADMIN_PASSWORD_ENV.startsWith("$2a$");
  if (isBcryptHash) {
    return bcrypt.compare(password, ADMIN_PASSWORD_ENV);
  }
  return password === ADMIN_PASSWORD_ENV;
}

const isProd = process.env["NODE_ENV"] === "production";

export function setAuthCookies(res: Response, username: string, role: Role = "admin") {
  const accessToken = signAccessToken(username, role);
  const refreshToken = signRefreshToken(username, role);

  const base = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "strict" : "lax") as "strict" | "lax",
    path: "/",
  };

  res.cookie(ACCESS_COOKIE, accessToken, {
    ...base,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...base,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { accessToken, refreshToken };
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/" });
}

function extractToken(req: Request): string | null {
  const fromCookie = req.cookies?.[ACCESS_COOKIE];
  if (fromCookie) return fromCookie;

  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);

  return null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired session. Please login again." });
    return;
  }

  (req as any).user = payload;
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as TokenPayload | undefined;

    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!roles.includes(user.role)) {
      logger.warn({ username: user.username, required: roles, has: user.role }, "Access denied — insufficient role");
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}

export const adminAuth = [requireAuth, requireRole("admin")];
