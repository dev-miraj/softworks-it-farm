import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const payrollTable = pgTable("payroll", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  month: text("month").notNull(),
  basicSalary: numeric("basic_salary").notNull(),
  bonus: numeric("bonus").notNull().default("0"),
  deductions: numeric("deductions").notNull().default("0"),
  netSalary: numeric("net_salary").notNull(),
  status: text("status").notNull().default("pending"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPayrollSchema = createInsertSchema(payrollTable).omit({ id: true, createdAt: true });
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type Payroll = typeof payrollTable.$inferSelect;
