import {
  members, transactions, loans, expenses, savingsAccounts, dashboardStats,
  type Member, type Transaction, type Loan, type Expense, type SavingsAccount, type DashboardStats,
} from "./mock-data";

// Simulate network delay
const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms + Math.random() * 300));

// Members
export async function getMembers(): Promise<Member[]> {
  await delay();
  return members;
}

export async function getMember(id: number): Promise<Member | undefined> {
  await delay(300);
  return members.find((m) => m.id === id);
}

export async function createMember(data: Partial<Member>): Promise<Member> {
  await delay(800);
  const newMember: Member = {
    id: members.length + 1,
    name: `${data.name || "New Member"}`,
    memberId: `IFFE-${String(members.length + 1).padStart(3, "0")}`,
    email: data.email || "",
    phone: data.phone || "",
    status: "Pending",
    joinDate: new Date().toISOString().split("T")[0],
    balance: 0,
  };
  return newMember;
}

// Transactions
export async function getTransactions(): Promise<Transaction[]> {
  await delay();
  return transactions;
}

export async function createTransaction(data: Partial<Transaction>): Promise<Transaction> {
  await delay(800);
  return {
    id: `TXN-${String(transactions.length + 1).padStart(4, "0")}`,
    member: data.member || "",
    type: data.type || "Deposit",
    amount: data.amount || 0,
    date: new Date().toISOString().split("T")[0],
    method: data.method || "Cash",
    status: "Pending",
    account: data.account || "",
  };
}

// Loans
export async function getLoans(): Promise<Loan[]> {
  await delay();
  return loans;
}

// Expenses
export async function getExpenses(): Promise<Expense[]> {
  await delay();
  return expenses;
}

// Savings Accounts
export async function getSavingsAccounts(): Promise<SavingsAccount[]> {
  await delay();
  return savingsAccounts;
}

// Dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(400);
  return dashboardStats;
}

export async function getRecentTransactions(): Promise<Transaction[]> {
  await delay(400);
  return transactions.slice(0, 5);
}
