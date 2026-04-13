import { Router } from "express";
import {
  signAdminToken,
  verifyAdminToken,
  checkAdminCredentials,
} from "../lib/auth.js";

const router = Router();

router.post("/auth/login", (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  if (!checkAdminCredentials(String(username), String(password))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signAdminToken(String(username));

  res.cookie("sw_admin_token", token, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  res.json({
    success: true,
    token,
    username: String(username),
    role: "admin",
    message: "Login successful",
  });
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie("sw_admin_token", { path: "/" });
  res.json({ success: true, message: "Logged out successfully" });
});

router.get("/auth/me", (req, res) => {
  const authHeader = req.headers["authorization"];
  const cookieToken = (req as any).cookies?.["sw_admin_token"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : cookieToken;

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const payload = verifyAdminToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  res.json({ username: payload.username, role: payload.role });
});

router.post("/auth/verify", (req, res) => {
  const { token } = req.body ?? {};
  const authHeader = req.headers["authorization"];
  const cookieToken = (req as any).cookies?.["sw_admin_token"];

  const t = token || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : cookieToken);

  if (!t) {
    res.status(401).json({ valid: false, error: "No token provided" });
    return;
  }

  const payload = verifyAdminToken(String(t));
  if (!payload) {
    res.status(401).json({ valid: false, error: "Invalid or expired token" });
    return;
  }

  res.json({ valid: true, username: payload.username, role: payload.role });
});

export default router;
