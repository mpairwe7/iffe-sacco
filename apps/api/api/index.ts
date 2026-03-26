import { handle } from "hono/vercel";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { errorHandler } from "../src/middleware/error-handler";
import { authRoutes } from "../src/routes/auth.routes";
import { memberRoutes } from "../src/routes/member.routes";
import { transactionRoutes } from "../src/routes/transaction.routes";
import { loanRoutes } from "../src/routes/loan.routes";
import { dashboardRoutes } from "../src/routes/dashboard.routes";
import { expenseRoutes } from "../src/routes/expense.routes";
import { welfareRoutes } from "../src/routes/welfare.routes";
import { accountRoutes } from "../src/routes/account.routes";
import { bankAccountRoutes } from "../src/routes/bank-account.routes";
import { userRoutes } from "../src/routes/user.routes";
import { settingRoutes } from "../src/routes/setting.routes";
import { interestRoutes } from "../src/routes/interest.routes";
import { reportRoutes } from "../src/routes/report.routes";
import { depositRequestRoutes } from "../src/routes/deposit-request.routes";
import { withdrawRequestRoutes } from "../src/routes/withdraw-request.routes";
import { paymentGatewayRoutes } from "../src/routes/payment-gateway.routes";
import { auditLogRoutes } from "../src/routes/audit-log.routes";

const app = new Hono().basePath("/api/v1");

// ===== Global Middleware =====
app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", cors({
  origin: (origin) => origin || "*",
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// ===== Routes =====
app.route("/auth", authRoutes);
app.route("/members", memberRoutes);
app.route("/transactions", transactionRoutes);
app.route("/loans", loanRoutes);
app.route("/dashboard", dashboardRoutes);
app.route("/expenses", expenseRoutes);
app.route("/welfare", welfareRoutes);
app.route("/accounts", accountRoutes);
app.route("/bank-accounts", bankAccountRoutes);
app.route("/users", userRoutes);
app.route("/settings", settingRoutes);
app.route("/interest", interestRoutes);
app.route("/reports", reportRoutes);
app.route("/deposit-requests", depositRequestRoutes);
app.route("/withdraw-requests", withdrawRequestRoutes);
app.route("/payment-gateways", paymentGatewayRoutes);
app.route("/audit-logs", auditLogRoutes);

// ===== Health Check =====
app.get("/health", (c) => c.json({
  status: "ok",
  timestamp: new Date().toISOString(),
  version: "1.0.0",
}));

// ===== Error Handler =====
app.onError(errorHandler);
app.notFound((c) => c.json({ success: false, message: "Route not found" }, 404));

export default handle(app);
