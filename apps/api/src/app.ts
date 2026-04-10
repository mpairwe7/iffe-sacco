/**
 * IFFE SACCO API — Hono App Definition
 *
 * Separated from index.ts so it can be imported by both the Bun server
 * and the Vercel serverless adapter without triggering Bun.serve().
 */
// @ts-nocheck
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { errorHandler } from "./middleware/error-handler";
import { requestContext } from "./middleware/request-id";
import { csrfProtect, csrfTokenIssuer } from "./middleware/csrf";
import { healthRoutes } from "./routes/health.routes";
import { cronRoutes } from "./routes/cron.routes";
import { gdprRoutes } from "./routes/gdpr.routes";
import { assistantRoutes } from "./routes/assistant.routes";
import { notificationRoutes } from "./routes/notifications.routes";
import { anomalyInboxRoutes } from "./routes/anomaly-inbox.routes";
import { realtimeRoutes } from "./routes/realtime.routes";
import { passkeyRoutes } from "./routes/passkey.routes";
import { authRoutes } from "./routes/auth.routes";
import { memberRoutes } from "./routes/member.routes";
import { transactionRoutes } from "./routes/transaction.routes";
import { loanRoutes } from "./routes/loan.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { expenseRoutes } from "./routes/expense.routes";
import { welfareRoutes } from "./routes/welfare.routes";
import { accountRoutes } from "./routes/account.routes";
import { bankAccountRoutes } from "./routes/bank-account.routes";
import { userRoutes } from "./routes/user.routes";
import { settingRoutes } from "./routes/setting.routes";
import { interestRoutes } from "./routes/interest.routes";
import { reportRoutes } from "./routes/report.routes";
import { depositRequestRoutes } from "./routes/deposit-request.routes";
import { withdrawRequestRoutes } from "./routes/withdraw-request.routes";
import { paymentGatewayRoutes } from "./routes/payment-gateway.routes";
import { auditLogRoutes } from "./routes/audit-log.routes";
import { applicationRoutes } from "./routes/application.routes";

const app = new Hono().basePath("/api/v1");

// ===== Global Middleware =====
app.use("*", requestContext);
app.use("*", secureHeaders());
// CSRF token issued on every authenticated read; verified on every mutation.
// Login / register / password reset are explicitly opted out via c.set("csrf:skip").
app.use("*", csrfTokenIssuer);
app.use("*", csrfProtect);
app.use("*", cors({
  origin: (origin) => {
    const allowed = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",");
    if (!origin) {
      return allowed[0];
    }

    return allowed.includes(origin) ? origin : allowed[0];
  },
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// ===== Routes =====
app.route("/health", healthRoutes);
app.route("/cron", cronRoutes);
app.route("/gdpr", gdprRoutes);
app.route("/assistant", assistantRoutes);
app.route("/notifications", notificationRoutes);
app.route("/anomaly-inbox", anomalyInboxRoutes);
app.route("/realtime", realtimeRoutes);
app.route("/passkeys", passkeyRoutes);
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
app.route("/applications", applicationRoutes);

// ===== Error Handler =====
app.onError(errorHandler);
app.notFound((c) => c.json({ success: false, message: "Route not found" }, 404));

export { app };
