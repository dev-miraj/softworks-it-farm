import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { payrollTable, insertPayrollSchema } from "@workspace/db";

const router = Router();

router.get("/payroll", async (req, res): Promise<void> => {
  const { month, employeeId } = req.query;
  let records = await db.select().from(payrollTable).orderBy(payrollTable.id);
  if (month && typeof month === "string") {
    records = records.filter(r => r.month === month);
  }
  if (employeeId) {
    records = records.filter(r => r.employeeId === parseInt(employeeId as string));
  }
  res.json(records);
});

router.post("/payroll", async (req, res): Promise<void> => {
  const body = insertPayrollSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [record] = await db.insert(payrollTable).values(body.data).returning();
  res.status(201).json(record);
});

export default router;
