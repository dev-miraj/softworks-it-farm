import { Router } from "express";
import { z } from "zod";
import {
  checkAdminCredentials,
  updateAdminPassword,
  updateLastLogin,
  setAuthCookies,
  clearAuthCookies,
  verifyRefreshToken,
  verifyAccessToken,
  requireAuth,
  signAccessToken,
  REFRESH_TTL_SECONDS,
} from "../lib/auth.js";
import type { Role } from "../lib/auth.js";
import {
  storeRefreshToken,
  validateAndRotateRefreshToken,
  revokeAllTokensForUser,
  revokeTokenById,
  getActiveSessions,
} from "../lib/tokenStore.js";
import { auditLog } from "../lib/auditLog.js";
import { setCsrfCookie } from "../lib/csrf.js";
import { checkLockout, recordFailedAttempt, clearLockout } from "../lib/lockout.js";
import { logger } from "../lib/logger.js";

const router = Router();

function getIp(req: Parameters<typeof auditLog>[0]["req"]): string | undefined {
  return (
    (req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req?.socket?.remoteAddress
  );
}

const LoginSchema = z.object({
  username: z.string().min(1).max(64).trim(),
  password: z.string().min(1).max(128),
});

router.post("/auth/login", async (req, res) => {
  const parse = LoginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: "Invalid input", details: parse.error.flatten().fieldErrors });
    return;
  }

  const { username, password } = parse.data;
  const ip = getIp(req);

  const lockoutState = await checkLockout(username);
  if (lockoutState.locked) {
    const remainMs = lockoutState.lockedUntil
      ? lockoutState.lockedUntil.getTime() - Date.now()
      : 15 * 60 * 1000;
    const remainMin = Math.ceil(remainMs / 60000);
    res.status(429).json({
      success: false,
      error: `Account temporarily locked. Try again in ${remainMin} minute(s).`,
      lockedUntil: lockoutState.lockedUntil,
    });
    return;
  }

  const valid = await checkAdminCredentials(username, password);

  if (!valid) {
    const attempt = await recordFailedAttempt(username, ip);
    logger.warn({ username, ip, remaining: attempt.remainingAttempts }, "Failed login attempt");
    await auditLog({ username, action: "login_failed", status: "failure", req, details: "Invalid credentials" });

    if (attempt.locked) {
      res.status(429).json({
        success: false,
        error: "Too many failed attempts. Account locked for 15 minutes.",
        lockedUntil: attempt.lockedUntil,
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: "Invalid credentials",
      remainingAttempts: attempt.remainingAttempts,
    });
    return;
  }

  await clearLockout(username);

  const { accessToken, refreshToken } = setAuthCookies(res, username, "admin");

  await storeRefreshToken({
    username,
    role: "admin",
    token: refreshToken,
    ttlSeconds: REFRESH_TTL_SECONDS,
    ipAddress: getIp(req),
    userAgent: req.headers["user-agent"],
  });

  const csrfToken = setCsrfCookie(res);

  await auditLog({ username, action: "login", req });

  logger.info({ username, ip: getIp(req) }, "Login successful");

  res.json({
    success: true,
    username,
    role: "admin",
    message: "Login successful",
    token: accessToken,
    csrfToken,
  });
});

router.post("/auth/refresh", async (req, res) => {
  const oldRefreshToken = req.cookies?.["sw_refresh_token"];

  if (!oldRefreshToken) {
    res.status(401).json({ success: false, error: "No refresh token provided" });
    return;
  }

  const jwtPayload = verifyRefreshToken(oldRefreshToken);
  if (!jwtPayload) {
    clearAuthCookies(res);
    res.status(401).json({ success: false, error: "Invalid or expired refresh token. Please login again." });
    return;
  }

  const dbPayload = await validateAndRotateRefreshToken(oldRefreshToken);
  if (!dbPayload) {
    clearAuthCookies(res);
    logger.warn({ username: jwtPayload.username }, "Refresh token rotation failed — possible token reuse detected");
    res.status(401).json({ success: false, error: "Session expired or reused. Please login again." });
    return;
  }

  const newAccessToken = signAccessToken(dbPayload.username, dbPayload.role as Role);
  const isProd = process.env["NODE_ENV"] === "production";
  const base = { httpOnly: true, secure: isProd, sameSite: (isProd ? "strict" : "lax") as "strict" | "lax", path: "/" };

  const jwt = await import("jsonwebtoken");
  const REFRESH_SECRET = process.env["JWT_REFRESH_SECRET"] || process.env["JWT_SECRET"] + "_refresh" || "";
  const newRefreshToken = jwt.default.sign(
    { username: dbPayload.username, role: dbPayload.role, type: "refresh" },
    REFRESH_SECRET,
    { expiresIn: "7d" },
  );

  res.cookie("sw_access_token", newAccessToken, { ...base, maxAge: 15 * 60 * 1000 });
  res.cookie("sw_refresh_token", newRefreshToken, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 });

  await storeRefreshToken({
    username: dbPayload.username,
    role: dbPayload.role,
    token: newRefreshToken,
    ttlSeconds: REFRESH_TTL_SECONDS,
    ipAddress: getIp(req),
    userAgent: req.headers["user-agent"],
  });

  const csrfToken = setCsrfCookie(res);

  await auditLog({ username: dbPayload.username, action: "token_refresh", req });

  res.json({ success: true, token: newAccessToken, csrfToken });
});

router.post("/auth/logout", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const oldRefreshToken = req.cookies?.["sw_refresh_token"];

  if (oldRefreshToken) {
    await validateAndRotateRefreshToken(oldRefreshToken).catch(() => null);
  }

  clearAuthCookies(res);
  res.clearCookie("sw_csrf", { path: "/" });

  await auditLog({ username: user.username, action: "logout", req });
  logger.info({ username: user.username }, "Logout");

  res.json({ success: true, message: "Logged out successfully" });
});

router.post("/auth/logout-all", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const count = await revokeAllTokensForUser(user.username);
  clearAuthCookies(res);
  res.clearCookie("sw_csrf", { path: "/" });

  await auditLog({ username: user.username, action: "logout_all", req, details: `Revoked ${count} sessions` });
  logger.info({ username: user.username, count }, "Logout from all devices");

  res.json({ success: true, message: `Logged out from all devices (${count} sessions cleared)` });
});

router.get("/auth/sessions", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const sessions = await getActiveSessions(user.username);
  res.json({ success: true, data: sessions });
});

router.delete("/auth/sessions/:id", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const id = Number(req.params["id"]);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: "Invalid session ID" });
    return;
  }

  const ok = await revokeTokenById(id, user.username);
  if (!ok) {
    res.status(404).json({ success: false, error: "Session not found" });
    return;
  }

  await auditLog({ username: user.username, action: "session_revoke", resourceId: id, req });
  res.json({ success: true, message: "Session revoked" });
});

router.get("/auth/csrf", (req, res) => {
  const token = setCsrfCookie(res);
  res.json({ success: true, csrfToken: token });
});

router.get("/auth/me", requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json({ success: true, username: user.username, role: user.role });
});

router.post("/auth/change-password", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ success: false, error: "currentPassword and newPassword are required" });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ success: false, error: "New password must be at least 8 characters" });
    return;
  }

  const expectedUser = process.env["ADMIN_USERNAME"] || "admin";
  if (user.username !== expectedUser) {
    res.status(403).json({ success: false, error: "Not authorized" });
    return;
  }

  const storedPass = process.env["ADMIN_PASSWORD"] || "Softworks@2024";
  const isBcrypt = storedPass.startsWith("$2b$") || storedPass.startsWith("$2a$");
  let valid = false;
  if (isBcrypt) {
    const { default: bcrypt } = await import("bcrypt");
    valid = await bcrypt.compare(currentPassword, storedPass);
  } else {
    valid = currentPassword === storedPass;
  }

  if (!valid) {
    res.status(401).json({ success: false, error: "Current password is incorrect" });
    return;
  }

  await auditLog({ username: user.username, action: "password_change", req });
  res.json({
    success: true,
    message: "Password change acknowledged. Update ADMIN_PASSWORD environment variable to complete.",
  });
});

router.post("/auth/verify", (req, res) => {
  const cookieToken = req.cookies?.["sw_access_token"];
  const authHeader = req.headers["authorization"];
  const bodyToken = req.body?.token;
  const t = cookieToken || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null) || bodyToken;

  if (!t) {
    res.status(401).json({ success: false, valid: false, error: "No token provided" });
    return;
  }

  const payload = verifyAccessToken(t);
  if (!payload) {
    res.status(401).json({ success: false, valid: false, error: "Invalid or expired token" });
    return;
  }

  res.json({ success: true, valid: true, username: payload.username, role: payload.role });
});

export default router;
