import { Router } from "express";
import { z } from "zod";
import {
  checkAdminCredentials,
  setAuthCookies,
  clearAuthCookies,
  verifyRefreshToken,
  verifyAccessToken,
  requireAuth,
  signAccessToken,
  signRefreshToken,
} from "../lib/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

const LoginSchema = z.object({
  username: z.string().min(1).max(64).trim(),
  password: z.string().min(1).max(128),
});

router.post("/auth/login", async (req, res) => {
  const parse = LoginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid input", details: parse.error.flatten().fieldErrors });
    return;
  }

  const { username, password } = parse.data;
  const valid = await checkAdminCredentials(username, password);

  if (!valid) {
    logger.warn({ username, ip: req.ip }, "Failed login attempt");
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const { accessToken } = setAuthCookies(res, username, "admin");

  logger.info({ username, ip: req.ip }, "Admin login successful");

  res.json({
    success: true,
    username,
    role: "admin",
    message: "Login successful",
    token: accessToken,
  });
});

router.post("/auth/refresh", (req, res) => {
  const refreshToken = req.cookies?.["sw_refresh_token"];

  if (!refreshToken) {
    res.status(401).json({ error: "No refresh token provided" });
    return;
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    clearAuthCookies(res);
    res.status(401).json({ error: "Invalid or expired refresh token. Please login again." });
    return;
  }

  const newAccessToken = signAccessToken(payload.username, payload.role);
  const newRefreshToken = signRefreshToken(payload.username, payload.role);
  const isProd = process.env["NODE_ENV"] === "production";
  const base = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "strict" : "lax") as "strict" | "lax",
    path: "/",
  };
  res.cookie("sw_access_token", newAccessToken, { ...base, maxAge: 15 * 60 * 1000 });
  res.cookie("sw_refresh_token", newRefreshToken, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 });

  res.json({ success: true, token: newAccessToken });
});

router.post("/auth/logout", (req, res) => {
  const user = (req as any).user;
  if (user) logger.info({ username: user.username }, "Admin logout");
  clearAuthCookies(res);
  res.json({ success: true, message: "Logged out successfully" });
});

router.get("/auth/me", requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json({ username: user.username, role: user.role });
});

router.post("/auth/verify", (req, res) => {
  const cookieToken = req.cookies?.["sw_access_token"];
  const authHeader = req.headers["authorization"];
  const bodyToken = req.body?.token;
  const t = cookieToken || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null) || bodyToken;

  if (!t) {
    res.status(401).json({ valid: false, error: "No token provided" });
    return;
  }

  const payload = verifyAccessToken(t);
  if (!payload) {
    res.status(401).json({ valid: false, error: "Invalid or expired token" });
    return;
  }

  res.json({ valid: true, username: payload.username, role: payload.role });
});

export default router;
