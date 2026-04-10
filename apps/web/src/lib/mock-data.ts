export interface Member {
  id: number;
  name: string;
  memberId: string;
  email: string;
  phone: string;
  status: "Active" | "Pending" | "Inactive";
  joinDate: string;
  balance: number;
}

export interface Transaction {
  id: string;
  member: string;
  type: "Deposit" | "Withdrawal" | "Loan Repayment" | "Loan Disbursement" | "Transfer" | "Interest Credit";
  amount: number;
  date: string;
  method: string;
  status: "Completed" | "Pending" | "Rejected";
  account: string;
}

export interface Loan {
  id: string;
  member: string;
  type: string;
  amount: number;
  balance: number;
  rate: string;
  nextPayment: string;
  status: "Active" | "Pending" | "Paid" | "Overdue";
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  approvedBy: string;
  status: "Approved" | "Pending";
}

export interface SavingsAccount {
  id: number;
  accountNo: string;
  member: string;
  type: string;
  balance: number;
  status: "Active" | "Dormant" | "Frozen";
  lastActivity: string;
}

export interface DashboardStats {
  totalMembers: number;
  totalDeposits: string;
  totalWithdrawals: string;
  activeLoans: string;
  membersChange: string;
  depositsChange: string;
  withdrawalsChange: string;
  loansCount: string;
}

export const members: Member[] = [
  {
    id: 1,
    name: "John Mukasa",
    memberId: "IFFE-001",
    email: "john@example.com",
    phone: "+256 700 100 001",
    status: "Active",
    joinDate: "2024-01-15",
    balance: 2500000,
  },
  {
    id: 2,
    name: "Grace Nambi",
    memberId: "IFFE-002",
    email: "grace@example.com",
    phone: "+256 700 100 002",
    status: "Active",
    joinDate: "2024-02-10",
    balance: 1800000,
  },
  {
    id: 3,
    name: "Peter Ochieng",
    memberId: "IFFE-003",
    email: "peter@example.com",
    phone: "+256 700 100 003",
    status: "Active",
    joinDate: "2024-03-05",
    balance: 3200000,
  },
  {
    id: 4,
    name: "Sarah Auma",
    memberId: "IFFE-004",
    email: "sarah@example.com",
    phone: "+256 700 100 004",
    status: "Pending",
    joinDate: "2024-04-20",
    balance: 500000,
  },
  {
    id: 5,
    name: "David Kibet",
    memberId: "IFFE-005",
    email: "david@example.com",
    phone: "+256 700 100 005",
    status: "Active",
    joinDate: "2024-05-12",
    balance: 4100000,
  },
  {
    id: 6,
    name: "Mary Wanjiku",
    memberId: "IFFE-006",
    email: "mary@example.com",
    phone: "+256 700 100 006",
    status: "Active",
    joinDate: "2024-06-01",
    balance: 750000,
  },
  {
    id: 7,
    name: "James Otieno",
    memberId: "IFFE-007",
    email: "james@example.com",
    phone: "+256 700 100 007",
    status: "Inactive",
    joinDate: "2024-06-15",
    balance: 0,
  },
  {
    id: 8,
    name: "Agnes Namutebi",
    memberId: "IFFE-008",
    email: "agnes@example.com",
    phone: "+256 700 100 008",
    status: "Active",
    joinDate: "2024-07-20",
    balance: 1200000,
  },
  {
    id: 9,
    name: "Robert Kamau",
    memberId: "IFFE-009",
    email: "robert@example.com",
    phone: "+256 700 100 009",
    status: "Active",
    joinDate: "2024-08-10",
    balance: 5600000,
  },
  {
    id: 10,
    name: "Florence Achieng",
    memberId: "IFFE-010",
    email: "florence@example.com",
    phone: "+256 700 100 010",
    status: "Active",
    joinDate: "2024-09-01",
    balance: 980000,
  },
  {
    id: 11,
    name: "Joseph Nsubuga",
    memberId: "IFFE-011",
    email: "joseph@example.com",
    phone: "+256 700 100 011",
    status: "Active",
    joinDate: "2024-09-15",
    balance: 2300000,
  },
  {
    id: 12,
    name: "Elizabeth Kendi",
    memberId: "IFFE-012",
    email: "elizabeth@example.com",
    phone: "+256 700 100 012",
    status: "Pending",
    joinDate: "2024-10-05",
    balance: 150000,
  },
];

export const transactions: Transaction[] = [
  {
    id: "TXN-0001",
    member: "John Mukasa",
    type: "Deposit",
    amount: 500000,
    date: "2026-03-25",
    method: "Cash",
    status: "Completed",
    account: "SAV-0001",
  },
  {
    id: "TXN-0002",
    member: "Grace Nambi",
    type: "Withdrawal",
    amount: 200000,
    date: "2026-03-24",
    method: "Mobile Money",
    status: "Completed",
    account: "SAV-0002",
  },
  {
    id: "TXN-0003",
    member: "Peter Ochieng",
    type: "Loan Repayment",
    amount: 350000,
    date: "2026-03-24",
    method: "Bank Transfer",
    status: "Completed",
    account: "SAV-0003",
  },
  {
    id: "TXN-0004",
    member: "Sarah Auma",
    type: "Deposit",
    amount: 1000000,
    date: "2026-03-23",
    method: "Cash",
    status: "Pending",
    account: "SAV-0004",
  },
  {
    id: "TXN-0005",
    member: "David Kibet",
    type: "Withdrawal",
    amount: 150000,
    date: "2026-03-23",
    method: "Cash",
    status: "Completed",
    account: "SAV-0005",
  },
  {
    id: "TXN-0006",
    member: "Mary Wanjiku",
    type: "Deposit",
    amount: 300000,
    date: "2026-03-22",
    method: "Mobile Money",
    status: "Completed",
    account: "SAV-0006",
  },
  {
    id: "TXN-0007",
    member: "James Otieno",
    type: "Transfer",
    amount: 250000,
    date: "2026-03-22",
    method: "Internal",
    status: "Completed",
    account: "SAV-0007",
  },
  {
    id: "TXN-0008",
    member: "Agnes Namutebi",
    type: "Deposit",
    amount: 800000,
    date: "2026-03-21",
    method: "Bank Transfer",
    status: "Completed",
    account: "SAV-0008",
  },
  {
    id: "TXN-0009",
    member: "Robert Kamau",
    type: "Loan Disbursement",
    amount: 5000000,
    date: "2026-03-20",
    method: "Bank Transfer",
    status: "Completed",
    account: "SAV-0009",
  },
  {
    id: "TXN-0010",
    member: "Florence Achieng",
    type: "Withdrawal",
    amount: 100000,
    date: "2026-03-20",
    method: "Cash",
    status: "Rejected",
    account: "SAV-0010",
  },
  {
    id: "TXN-0011",
    member: "Joseph Nsubuga",
    type: "Deposit",
    amount: 450000,
    date: "2026-03-19",
    method: "Mobile Money",
    status: "Completed",
    account: "SAV-0011",
  },
  {
    id: "TXN-0012",
    member: "Elizabeth Kendi",
    type: "Loan Repayment",
    amount: 280000,
    date: "2026-03-19",
    method: "Cash",
    status: "Completed",
    account: "SAV-0012",
  },
];

export const loans: Loan[] = [
  {
    id: "LN-001",
    member: "John Mukasa",
    type: "Business Loan",
    amount: 5000000,
    balance: 3200000,
    rate: "12%",
    nextPayment: "2026-03-28",
    status: "Active",
  },
  {
    id: "LN-002",
    member: "Grace Nambi",
    type: "Personal Loan",
    amount: 2000000,
    balance: 1400000,
    rate: "15%",
    nextPayment: "2026-03-30",
    status: "Active",
  },
  {
    id: "LN-003",
    member: "Peter Ochieng",
    type: "Emergency Loan",
    amount: 1000000,
    balance: 600000,
    rate: "10%",
    nextPayment: "2026-04-01",
    status: "Active",
  },
  {
    id: "LN-004",
    member: "Sarah Auma",
    type: "Business Loan",
    amount: 8000000,
    balance: 8000000,
    rate: "12%",
    nextPayment: "2026-04-05",
    status: "Pending",
  },
  {
    id: "LN-005",
    member: "David Kibet",
    type: "Personal Loan",
    amount: 3000000,
    balance: 0,
    rate: "15%",
    nextPayment: "-",
    status: "Paid",
  },
  {
    id: "LN-006",
    member: "Mary Wanjiku",
    type: "Education Loan",
    amount: 4000000,
    balance: 2800000,
    rate: "8%",
    nextPayment: "2026-04-10",
    status: "Active",
  },
  {
    id: "LN-007",
    member: "James Otieno",
    type: "Emergency Loan",
    amount: 500000,
    balance: 250000,
    rate: "10%",
    nextPayment: "2026-04-12",
    status: "Overdue",
  },
  {
    id: "LN-008",
    member: "Agnes Namutebi",
    type: "Business Loan",
    amount: 10000000,
    balance: 7500000,
    rate: "12%",
    nextPayment: "2026-04-15",
    status: "Active",
  },
];

export const expenses: Expense[] = [
  {
    id: "EXP-001",
    description: "Staff Salaries - March 2026",
    category: "Salaries",
    amount: 4500000,
    date: "2026-03-01",
    approvedBy: "Admin",
    status: "Approved",
  },
  {
    id: "EXP-002",
    description: "Office Rent - March",
    category: "Rent",
    amount: 1200000,
    date: "2026-03-01",
    approvedBy: "Admin",
    status: "Approved",
  },
  {
    id: "EXP-003",
    description: "Internet & Phone",
    category: "Utilities",
    amount: 350000,
    date: "2026-03-05",
    approvedBy: "Admin",
    status: "Approved",
  },
  {
    id: "EXP-004",
    description: "Marketing Campaign",
    category: "Marketing",
    amount: 800000,
    date: "2026-03-10",
    approvedBy: "Admin",
    status: "Pending",
  },
  {
    id: "EXP-005",
    description: "Office Supplies",
    category: "Operations",
    amount: 150000,
    date: "2026-03-12",
    approvedBy: "Admin",
    status: "Approved",
  },
  {
    id: "EXP-006",
    description: "System Maintenance",
    category: "Technical Issues",
    amount: 500000,
    date: "2026-03-15",
    approvedBy: "Admin",
    status: "Approved",
  },
  {
    id: "EXP-007",
    description: "Transport Allowances",
    category: "Operations",
    amount: 280000,
    date: "2026-03-18",
    approvedBy: "Admin",
    status: "Approved",
  },
  {
    id: "EXP-008",
    description: "Training Workshop",
    category: "Training",
    amount: 650000,
    date: "2026-03-20",
    approvedBy: "-",
    status: "Pending",
  },
];

export const savingsAccounts: SavingsAccount[] = [
  {
    id: 1,
    accountNo: "SAV-0001",
    member: "John Mukasa",
    type: "Savings Account",
    balance: 2500000,
    status: "Active",
    lastActivity: "2026-03-25",
  },
  {
    id: 2,
    accountNo: "SAV-0002",
    member: "Grace Nambi",
    type: "Fixed Deposit",
    balance: 5800000,
    status: "Active",
    lastActivity: "2026-03-24",
  },
  {
    id: 3,
    accountNo: "SAV-0003",
    member: "Peter Ochieng",
    type: "Savings Account",
    balance: 3200000,
    status: "Active",
    lastActivity: "2026-03-24",
  },
  {
    id: 4,
    accountNo: "SAV-0004",
    member: "Sarah Auma",
    type: "Current Account",
    balance: 1500000,
    status: "Active",
    lastActivity: "2026-03-23",
  },
  {
    id: 5,
    accountNo: "SAV-0005",
    member: "David Kibet",
    type: "Savings Account",
    balance: 4100000,
    status: "Dormant",
    lastActivity: "2026-01-15",
  },
  {
    id: 6,
    accountNo: "SAV-0006",
    member: "Mary Wanjiku",
    type: "Savings Account",
    balance: 750000,
    status: "Active",
    lastActivity: "2026-03-22",
  },
  {
    id: 7,
    accountNo: "SAV-0007",
    member: "James Otieno",
    type: "Fixed Deposit",
    balance: 10000000,
    status: "Active",
    lastActivity: "2026-03-20",
  },
  {
    id: 8,
    accountNo: "SAV-0008",
    member: "Agnes Namutebi",
    type: "Current Account",
    balance: 1200000,
    status: "Active",
    lastActivity: "2026-03-21",
  },
  {
    id: 9,
    accountNo: "SAV-0009",
    member: "Robert Kamau",
    type: "Savings Account",
    balance: 5600000,
    status: "Active",
    lastActivity: "2026-03-25",
  },
  {
    id: 10,
    accountNo: "SAV-0010",
    member: "Florence Achieng",
    type: "Savings Account",
    balance: 980000,
    status: "Frozen",
    lastActivity: "2026-02-28",
  },
];

export const dashboardStats: DashboardStats = {
  totalMembers: 1247,
  totalDeposits: "USh 2.5B",
  totalWithdrawals: "USh 890M",
  activeLoans: "USh 1.2B",
  membersChange: "+12 this month",
  depositsChange: "+8.3% vs last month",
  withdrawalsChange: "+3.2% vs last month",
  loansCount: "156 active loans",
};
