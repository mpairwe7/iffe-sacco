import { Hono } from "hono";
import { DashboardService } from "../services/dashboard.service";
import { authMiddleware, requireRole } from "../middleware/auth";
import { prisma } from "../config/db";

const dashboard = new Hono();
const service = new DashboardService();

dashboard.use("*", authMiddleware);

dashboard.get("/stats", async (c) => {
  const stats = await service.getStats();
  return c.json({ success: true, data: stats });
});

dashboard.get("/recent-transactions", async (c) => {
  const limit = Number(c.req.query("limit") || 10);
  const txns = await service.getRecentTransactions(limit);
  return c.json({ success: true, data: txns });
});

dashboard.get("/upcoming-payments", async (c) => {
  const days = Number(c.req.query("days") || 7);
  const payments = await service.getUpcomingLoanPayments(days);
  return c.json({ success: true, data: payments });
});

// Chairman oversight dashboard
dashboard.get("/chairman", requireRole("chairman", "admin"), async (c) => {
  const [stats, pendingExpenses, recentMembers] = await Promise.all([
    service.getStats(),
    prisma.expense.findMany({ where: { status: "pending" }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.member.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  return c.json({
    success: true,
    data: { ...stats, pendingExpenses, recentMembers },
  });
});

export { dashboard as dashboardRoutes };
