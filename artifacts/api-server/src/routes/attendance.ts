import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../lib/db";
import { attendanceTable, insertAttendanceSchema } from "@workspace/db";

const router = Router();

router.get("/attendance", async (req, res): Promise<void> => {
  const { employeeId, month } = req.query;
  let records = await db.select().from(attendanceTable).orderBy(attendanceTable.date);
  if (employeeId) {
    records = records.filter(r => r.employeeId === parseInt(employeeId as string));
  }
  if (month && typeof month === "string") {
    records = records.filter(r => r.date.startsWith(month));
  }
  res.json(records);
});

router.post("/attendance", async (req, res): Promise<void> => {
  const body = insertAttendanceSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [record] = await db.insert(attendanceTable).values(body.data).returning();
  res.status(201).json(record);
});

export default router;
