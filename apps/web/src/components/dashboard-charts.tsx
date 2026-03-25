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

const monthlyData = [
  { month: "Jan", deposits: 4200000, withdrawals: 2100000 },
  { month: "Feb", deposits: 5100000, withdrawals: 2800000 },
  { month: "Mar", deposits: 4800000, withdrawals: 2400000 },
  { month: "Apr", deposits: 6200000, withdrawals: 3100000 },
  { month: "May", deposits: 5500000, withdrawals: 2900000 },
  { month: "Jun", deposits: 7100000, withdrawals: 3500000 },
  { month: "Jul", deposits: 6800000, withdrawals: 3200000 },
  { month: "Aug", deposits: 7500000, withdrawals: 3800000 },
  { month: "Sep", deposits: 8200000, withdrawals: 4100000 },
  { month: "Oct", deposits: 7900000, withdrawals: 3900000 },
  { month: "Nov", deposits: 8800000, withdrawals: 4500000 },
  { month: "Dec", deposits: 9500000, withdrawals: 4800000 },
];

const expenseData = [
  { name: "Salaries", value: 35 },
  { name: "Operations", value: 25 },
  { name: "Marketing", value: 15 },
  { name: "Utilities", value: 12 },
  { name: "Others", value: 13 },
];

const COLORS = ["#006622", "#F1C40F", "#3b82f6", "#10b981", "#94a3b8"];

const loanData = [
  { month: "Jan", disbursed: 3200000, repaid: 2800000 },
  { month: "Feb", disbursed: 2800000, repaid: 3100000 },
  { month: "Mar", disbursed: 4100000, repaid: 2900000 },
  { month: "Apr", disbursed: 3500000, repaid: 3300000 },
  { month: "May", disbursed: 4800000, repaid: 3700000 },
  { month: "Jun", disbursed: 3900000, repaid: 4200000 },
];

export function DepositsWithdrawalsChart() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-base font-semibold text-text mb-1">Deposits vs Withdrawals</h3>
      <p className="text-sm text-text-muted mb-6">Monthly comparison for the year</p>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={monthlyData}>
          <defs>
            <linearGradient id="depositGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#006622" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#006622" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="withdrawGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F1C40F" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#F1C40F" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
          <Tooltip formatter={(value) => `USh ${Number(value).toLocaleString()}`} />
          <Area type="monotone" dataKey="deposits" stroke="#006622" strokeWidth={2} fill="url(#depositGrad)" name="Deposits" />
          <Area type="monotone" dataKey="withdrawals" stroke="#F1C40F" strokeWidth={2} fill="url(#withdrawGrad)" name="Withdrawals" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExpenseChart() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-base font-semibold text-text mb-1">Expense Overview</h3>
      <p className="text-sm text-text-muted mb-6">Distribution by category</p>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={expenseData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
            {expenseData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LoanChart() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-base font-semibold text-text mb-1">Loan Activity</h3>
      <p className="text-sm text-text-muted mb-6">Disbursements vs Repayments</p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={loanData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
          <Tooltip formatter={(value) => `USh ${Number(value).toLocaleString()}`} />
          <Bar dataKey="disbursed" fill="#006622" name="Disbursed" radius={[4, 4, 0, 0]} />
          <Bar dataKey="repaid" fill="#3b82f6" name="Repaid" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
