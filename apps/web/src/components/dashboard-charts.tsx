"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useTheme } from "next-themes";

const COLORS = ["#006622", "#F1C40F", "#3b82f6", "#10b981", "#6366f1", "#f97316"];

// Theme-aware chart colors
function useChartColors() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return {
    grid: isDark ? "#374151" : "#e5e7eb",
    tick: isDark ? "#9ca3af" : "#374151",
    tooltipBg: isDark ? "#111827" : "#ffffff",
    tooltipBorder: isDark ? "#374151" : "#e5e7eb",
    cardBg: isDark ? "bg-gray-950" : "bg-white",
  };
}

/* ===== Typed server-aggregated props ===== */
interface MonthlyPoint {
  month: string;
  label: string;
  deposits: number;
  withdrawals: number;
}
interface ExpenseSlice {
  name: string;
  value: number;
}
interface LoanPoint {
  month: string;
  label: string;
  disbursed: number;
  repaid: number;
}

/* ===== Deposits vs Withdrawals — 12 month area chart ===== */
export function DepositsWithdrawalsChart({ monthlyData }: { monthlyData: MonthlyPoint[] }) {
  const c = useChartColors();
  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6">
      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-0.5">Deposits vs Withdrawals</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">Monthly comparison — last 12 months</p>
      {monthlyData.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-sm text-gray-500 dark:text-gray-400">
          No transaction data available
        </div>
      ) : (
        <figure role="figure" aria-label="Monthly deposits vs withdrawals chart">
          <div className="sr-only" role="img" aria-label="Deposits and Withdrawals area chart">
            <ul>
              {monthlyData.map((d) => (
                <li key={d.month}>
                  {d.label}: Deposits USh {d.deposits.toLocaleString()}, Withdrawals USh{" "}
                  {d.withdrawals.toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="depositGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006622" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#006622" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="withdrawGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F1C40F" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#F1C40F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: c.tick }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: c.tick }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
                }
              />
              <Tooltip
                formatter={(value) => `USh ${Number(value || 0).toLocaleString()}`}
                contentStyle={{
                  borderRadius: 8,
                  border: `1px solid ${c.tooltipBorder}`,
                  background: c.tooltipBg,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                }}
              />
              <Area
                type="monotone"
                dataKey="deposits"
                stroke="#006622"
                strokeWidth={2}
                fill="url(#depositGrad)"
                name="Deposits"
              />
              <Area
                type="monotone"
                dataKey="withdrawals"
                stroke="#F1C40F"
                strokeWidth={2}
                fill="url(#withdrawGrad)"
                name="Withdrawals"
              />
            </AreaChart>
          </ResponsiveContainer>
        </figure>
      )}
    </div>
  );
}

/* ===== Expense Breakdown — pie chart ===== */
export function ExpenseChart({ breakdownData }: { breakdownData: ExpenseSlice[] }) {
  const c = useChartColors();
  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6">
      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-0.5">Expense Overview</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">Distribution by category — this year</p>
      {breakdownData.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-sm text-gray-500 dark:text-gray-400">
          No expense data available
        </div>
      ) : (
        <figure role="figure" aria-label="Expense distribution by category chart">
          <div className="sr-only" role="img" aria-label="Expense pie chart">
            <ul>
              {breakdownData.map((d) => (
                <li key={d.name}>
                  {d.name}: {d.value}%
                </li>
              ))}
            </ul>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={breakdownData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name} ${value}%`}
              >
                {breakdownData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{ borderRadius: 8, border: `1px solid ${c.tooltipBorder}`, background: c.tooltipBg }}
              />
            </PieChart>
          </ResponsiveContainer>
        </figure>
      )}
    </div>
  );
}

/* ===== Loan Trends — bar chart ===== */
export function LoanChart({ trendsData }: { trendsData: LoanPoint[] }) {
  const c = useChartColors();
  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6">
      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-0.5">Loan Activity</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">Disbursements vs Repayments — last 12 months</p>
      {trendsData.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-sm text-gray-500 dark:text-gray-400">
          No loan data available
        </div>
      ) : (
        <figure role="figure" aria-label="Loan disbursements vs repayments chart">
          <div className="sr-only" role="img" aria-label="Loan bar chart">
            <ul>
              {trendsData.map((d) => (
                <li key={d.month}>
                  {d.label}: Disbursed USh {d.disbursed.toLocaleString()}, Repaid USh {d.repaid.toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: c.tick }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: c.tick }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
                }
              />
              <Tooltip
                formatter={(value) => `USh ${Number(value || 0).toLocaleString()}`}
                contentStyle={{
                  borderRadius: 8,
                  border: `1px solid ${c.tooltipBorder}`,
                  background: c.tooltipBg,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                }}
              />
              <Bar dataKey="disbursed" fill="#006622" name="Disbursed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="repaid" fill="#3b82f6" name="Repaid" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </figure>
      )}
    </div>
  );
}
