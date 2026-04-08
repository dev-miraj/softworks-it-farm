import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { leavesTable, insertLeaveSchema } from "@workspace/db";

const router = Router();

const updateLeaveSchema = insertLeaveSchema.partial().pick({ status: true, approvedBy: true });

router.get("/leaves", async (req, res): Promise<void> => {
  const { employeeId, status } = req.query;
  let records = await db.select().from(leavesTable).orderBy(leavesTable.id);
  if (employeeId) {
    records = records.filter(r => r.employeeId === parseInt(employeeId as string));
  }
  if (status && typeof status === "string") {
    records = records.filter(r => r.status === status);
  }
  res.json(records);
});

router.post("/leaves", async (req, res): Promise<void> => {
  const body = insertLeaveSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [record] = await db.insert(leavesTable).values(body.data).returning();
  res.status(201).json(record);
});

router.put("/leaves/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const body = updateLeaveSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [record] = await db.update(leavesTable).set(body.data).where(eq(leavesTable.id, id)).returning();
  if (!record) { res.status(404).json({ error: "Leave request not found" }); return; }
  res.json(record);
});

export default router;
