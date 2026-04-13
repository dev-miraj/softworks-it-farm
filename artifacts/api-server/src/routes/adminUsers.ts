/**
 * Admin User Management API
 * CRUD operations for admin users stored in the database.
 * All credentials are DB-backed with bcrypt hashing.
 */
import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireAuth, requireRole, createAdminUser, updateAdminPassword } from "../lib/auth.js";
import { db } from "../lib/db.js";
import { adminUsersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { auditLog } from "../lib/auditLog.js";

const router = Router();
const adminOnly = [requireAuth, requireRole("admin")];

const CreateUserSchema = z.object({
  username: z.string().min(3).max(64).trim().regex(/^[a-zA-Z0-9_.-]+$/, "Only letters, numbers, _ . - allowed"),
  password: z.string().min(8).max(128),
  role: z.enum(["admin", "manager", "user"]).default("admin"),
  displayName: z.string().max(100).optional(),
  email: z.string().email().optional(),
});

const UpdatePasswordSchema = z.object({
  password: z.string().min(8).max(128),
});

router.get("/admin-users", ...adminOnly, async (_req, res) => {
  try {
    const users = await db
      .select({
        id: adminUsersTable.id,
        username: adminUsersTable.username,
        role: adminUsersTable.role,
        displayName: adminUsersTable.displayName,
        email: adminUsersTable.email,
        isActive: adminUsersTable.isActive,
        lastLoginAt: adminUsersTable.lastLoginAt,
        createdAt: adminUsersTable.createdAt,
      })
      .from(adminUsersTable)
      .orderBy(adminUsersTable.createdAt);

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch users" });
  }
});

router.post("/admin-users", ...adminOnly, async (req, res) => {
  const parse = CreateUserSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: "Invalid input", details: parse.error.flatten().fieldErrors });
    return;
  }

  const { username, password, role, displayName, email } = parse.data;

  const result = await createAdminUser(username, password, role as any, displayName, email);
  if (!result.ok) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  const actingUser = (req as any).user;
  await auditLog({ username: actingUser.username, action: "admin_user_create", resourceId: username, req });

  res.status(201).json({ success: true, message: `Admin user '${username}' created successfully` });
});

router.patch("/admin-users/:username/password", ...adminOnly, async (req, res) => {
  const { username } = req.params;
  const parse = UpdatePasswordSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: "Password must be at least 8 characters" });
    return;
  }

  const result = await updateAdminPassword(username!, parse.data.password);
  if (!result.ok) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  const actingUser = (req as any).user;
  await auditLog({ username: actingUser.username, action: "admin_user_password_change", resourceId: username, req });

  res.json({ success: true, message: `Password updated for '${username}'` });
});

router.patch("/admin-users/:username/status", ...adminOnly, async (req, res) => {
  const { username } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    res.status(400).json({ success: false, error: "isActive (boolean) required" });
    return;
  }

  const actingUser = (req as any).user;
  if (username === actingUser.username) {
    res.status(400).json({ success: false, error: "Cannot deactivate your own account" });
    return;
  }

  try {
    await db
      .update(adminUsersTable)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(adminUsersTable.username, username!));

    await auditLog({
      username: actingUser.username,
      action: isActive ? "admin_user_activate" : "admin_user_deactivate",
      resourceId: username,
      req,
    });

    res.json({ success: true, message: `User '${username}' ${isActive ? "activated" : "deactivated"}` });
  } catch {
    res.status(500).json({ success: false, error: "Failed to update status" });
  }
});

router.delete("/admin-users/:username", ...adminOnly, async (req, res) => {
  const { username } = req.params;
  const actingUser = (req as any).user;

  if (username === actingUser.username) {
    res.status(400).json({ success: false, error: "Cannot delete your own account" });
    return;
  }

  try {
    await db.delete(adminUsersTable).where(eq(adminUsersTable.username, username!));
    await auditLog({ username: actingUser.username, action: "admin_user_delete", resourceId: username, req });
    res.json({ success: true, message: `User '${username}' deleted` });
  } catch {
    res.status(500).json({ success: false, error: "Failed to delete user" });
  }
});

router.post("/admin-users/seed", ...adminOnly, async (req, res) => {
  const { username, password, displayName, email } = req.body;

  if (!username || !password) {
    res.status(400).json({ success: false, error: "username and password required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ success: false, error: "Password must be at least 8 characters" });
    return;
  }

  const result = await createAdminUser(username, password, "admin", displayName, email);

  if (!result.ok) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.status(201).json({
    success: true,
    message: `Admin user '${username}' created in database. You can now login with DB credentials.`,
  });
});

export default router;
