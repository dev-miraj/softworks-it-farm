import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { employeesTable, insertEmployeeSchema } from "@workspace/db/schema";

const router = Router();

router.get("/employees", async (req, res): Promise<void> => {
  const employees = await db.select().from(employeesTable).orderBy(employeesTable.id);
  res.json(employees);
});

router.post("/employees", async (req, res): Promise<void> => {
  const body = insertEmployeeSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [emp] = await db.insert(employeesTable).values(body.data).returning();
  res.status(201).json(emp);
});

router.get("/employees/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [emp] = await db.select().from(employeesTable).where(eq(employeesTable.id, id));
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  res.json(emp);
});

router.put("/employees/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const body = insertEmployeeSchema.partial().safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const [emp] = await db.update(employeesTable).set(body.data).where(eq(employeesTable.id, id)).returning();
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  res.json(emp);
});

router.delete("/employees/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(employeesTable).where(eq(employeesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Employee not found" }); return; }
  res.status(204).end();
});

export default router;
