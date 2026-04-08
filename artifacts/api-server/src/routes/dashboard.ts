import { Router } from "express";
import { db } from "../lib/db";
import { eq, count, desc } from "drizzle-orm";
import {
  clientsTable,
  projectsTable,
  employeesTable,
  leadsTable,
  leavesTable,
  payrollTable,
  attendanceTable,
} from "@workspace/db";

const router = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const [
    clients,
    projects,
    employees,
    leads,
    pendingLeaves,
    payrollRecords,
  ] = await Promise.all([
    db.select().from(clientsTable),
    db.select().from(projectsTable),
    db.select().from(employeesTable),
    db.select().from(leadsTable),
    db.select().from(leavesTable).where(eq(leavesTable.status, "pending")),
    db.select().from(payrollTable),
  ]);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const monthlyRevenue = payrollRecords
    .filter(p => p.month === thisMonth)
    .reduce((sum, p) => sum + Number(p.netSalary), 0);

  const newLeadsThisMonth = leads.filter(l => {
    const d = new Date(l.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  res.json({
    totalClients: clients.length,
    activeProjects: projects.filter(p => p.status === "active").length,
    totalEmployees: employees.length,
    totalLeads: leads.length,
    pendingLeaves: pendingLeaves.length,
    monthlyRevenue,
    projectsCompleted: projects.filter(p => p.status === "completed").length,
    newLeadsThisMonth,
  });
});

router.get("/dashboard/recent-leads", async (req, res): Promise<void> => {
  const leads = await db.select().from(leadsTable).orderBy(desc(leadsTable.createdAt)).limit(10);
  res.json(leads);
});

router.get("/dashboard/project-summary", async (req, res): Promise<void> => {
  const projects = await db.select().from(projectsTable);
  res.json({
    total: projects.length,
    active: projects.filter(p => p.status === "active").length,
    completed: projects.filter(p => p.status === "completed").length,
    onHold: projects.filter(p => p.status === "on_hold").length,
    cancelled: projects.filter(p => p.status === "cancelled").length,
  });
});

router.get("/dashboard/hr-summary", async (req, res): Promise<void> => {
  const [employees, leaves, attendanceToday] = await Promise.all([
    db.select().from(employeesTable),
    db.select().from(leavesTable).where(eq(leavesTable.status, "pending")),
    db.select().from(attendanceTable).where(eq(attendanceTable.date, new Date().toISOString().split("T")[0])),
  ]);

  const byDepartment: Record<string, number> = {};
  for (const emp of employees) {
    byDepartment[emp.department] = (byDepartment[emp.department] || 0) + 1;
  }

  res.json({
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.status === "active").length,
    presentToday: attendanceToday.filter(a => a.status === "present").length,
    pendingLeaves: leaves.length,
    byDepartment: Object.entries(byDepartment).map(([department, count]) => ({ department, count })),
  });
});

export default router;
