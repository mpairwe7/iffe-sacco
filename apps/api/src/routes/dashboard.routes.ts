import { Hono } from "hono";
import { DashboardService } from "../services/dashboard.service";
import { authMiddleware, requireRole, type AuthEnv } from "../middleware/auth";
import { prisma } from "../config/db";

const dashboard = new Hono<AuthEnv>();
const service = new DashboardService();

dashboard.use("*", authMiddleware);

dashboard.get("/stats", async (c) => {
  const user = c.get("user");
  if (user.role === "member") {
    return c.json({ success: false, message: "Insufficient permissions" }, 403);
  }
  const stats = await service.getStats();
  return c.json({ success: true, data: stats });
});

dashboard.get("/recent-transactions", async (c) => {
  const user = c.get("user");
  if (user.role === "member") {
    return c.json({ success: false, message: "Insufficient permissions" }, 403);
  }
  const limit = Number(c.req.query("limit") || 10);
  const txns = await service.getRecentTransactions(limit);
  return c.json({ success: true, data: txns });
});

dashboard.get("/upcoming-payments", async (c) => {
  const user = c.get("user");
  if (user.role === "member") {
    return c.json({ success: false, message: "Insufficient permissions" }, 403);
  }
  const days = Number(c.req.query("days") || 7);
  const payments = await service.getUpcomingLoanPayments(days);
  return c.json({ success: true, data: payments });
});

// Chart data — server-aggregated, no raw records sent to client
dashboard.get("/charts/monthly-transactions", async (c) => {
  const user = c.get("user");
  if (user.role === "member") return c.json({ success: false, message: "Insufficient permissions" }, 403);
  const months = Number(c.req.query("months") || 12);
  const data = await service.getMonthlyTransactions(months);
  return c.json({ success: true, data });
});

dashboard.get("/charts/expense-breakdown", async (c) => {
  const user = c.get("user");
  if (user.role === "member") return c.json({ success: false, message: "Insufficient permissions" }, 403);
  const data = await service.getExpenseBreakdown();
  return c.json({ success: true, data });
});

dashboard.get("/charts/loan-trends", async (c) => {
  const user = c.get("user");
  if (user.role === "member") return c.json({ success: false, message: "Insufficient permissions" }, 403);
  const months = Number(c.req.query("months") || 12);
  const data = await service.getLoanTrends(months);
  return c.json({ success: true, data });
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

// Notifications — recent audit logs as notifications for any authenticated user
dashboard.get("/notifications", async (c) => {
  const user = c.get("user");
  const limit = Number(c.req.query("limit") || 10);

  // Admin/staff/chairman see all recent activity, members see only their own
  const where = user.role === "member" ? { userId: user.id } : {};

  const notifications = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true } } },
  });

  // Count unread (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const unreadCount = await prisma.auditLog.count({
    where: { ...where, createdAt: { gte: oneDayAgo } },
  });

  return c.json({
    success: true,
    data: { notifications, unreadCount },
  });
});

export { dashboard as dashboardRoutes };
