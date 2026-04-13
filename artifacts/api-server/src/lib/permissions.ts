export type Permission =
  | "manage_users"
  | "manage_employees"
  | "manage_licenses"
  | "manage_orders"
  | "manage_invoices"
  | "manage_leads"
  | "manage_content"
  | "manage_settings"
  | "view_analytics"
  | "manage_jobs"
  | "manage_payroll"
  | "view_audit_logs"
  | "manage_auth"
  | "*";

export type Role = "admin" | "manager" | "user";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ["*"],
  manager: [
    "manage_employees",
    "manage_leads",
    "manage_orders",
    "manage_invoices",
    "manage_content",
    "view_analytics",
    "manage_jobs",
    "manage_payroll",
  ],
  user: [
    "view_analytics",
    "manage_leads",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  return perms.includes("*") || perms.includes(permission);
}

import type { Request, Response, NextFunction } from "express";
import type { TokenPayload } from "./auth.js";

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as TokenPayload | undefined;

    if (!user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    if (!hasPermission(user.role as Role, permission)) {
      res.status(403).json({
        success: false,
        error: `Permission denied: requires '${permission}'`,
      });
      return;
    }

    next();
  };
}
