import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

function daysAgo(n: number) { return new Date(Date.now() - n * 86400000); }
function daysFromNow(n: number) { return new Date(Date.now() + n * 86400000); }
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function main() {
  console.log("Cleaning existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.pledge.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.account.deleteMany();
  await prisma.depositRequest.deleteMany();
  await prisma.withdrawRequest.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.welfareProgram.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.paymentGateway.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding...\n");
  const pw = await bcrypt.hash("password123", 12);

  // ===== USERS (8) =====
  const users = await Promise.all([
    prisma.user.create({ data: { name: "Admin User", email: "admin@iffeds.org", phone: "+256700000001", password: pw, role: "admin", isActive: true, lastLogin: daysAgo(0) } }),
    prisma.user.create({ data: { name: "Super Admin", email: "superadmin@iffeds.org", phone: "+256700000002", password: pw, role: "admin", isActive: true, lastLogin: daysAgo(1) } }),
    prisma.user.create({ data: { name: "Jane Teller", email: "staff@iffeds.org", phone: "+256700000003", password: pw, role: "staff", isActive: true, lastLogin: daysAgo(0) } }),
    prisma.user.create({ data: { name: "Mike Cashier", email: "mike@iffeds.org", phone: "+256700000004", password: pw, role: "staff", isActive: true, lastLogin: daysAgo(2) } }),
    prisma.user.create({ data: { name: "Sarah Support", email: "sarah@iffeds.org", phone: "+256700000005", password: pw, role: "staff", isActive: false } }),
    prisma.user.create({ data: { name: "John Mukasa", email: "john@example.com", phone: "+256700100001", password: pw, role: "member", isActive: true, lastLogin: daysAgo(0) } }),
    prisma.user.create({ data: { name: "Grace Nambi", email: "grace@example.com", phone: "+256700100002", password: pw, role: "member", isActive: true, lastLogin: daysAgo(3) } }),
    prisma.user.create({ data: { name: "Tom Inactive", email: "tom@iffeds.org", phone: "+256700000006", password: pw, role: "staff", isActive: false } }),
  ]);
  console.log(`  ${users.length} users created`);

  // ===== MEMBERS (16) =====
  const memberData = [
    { firstName: "John", lastName: "Mukasa", email: "john@example.com", phone: "+256700100001", gender: "male", nationalId: "CM000001", occupation: "Farmer", city: "Kampala", district: "Central", country: "UG", status: "active", userId: users[5].id },
    { firstName: "Grace", lastName: "Nambi", email: "grace@example.com", phone: "+256700100002", gender: "female", nationalId: "CM000002", occupation: "Teacher", city: "Entebbe", district: "Wakiso", country: "UG", status: "active", userId: users[6].id },
    { firstName: "Peter", lastName: "Ochieng", email: "peter@example.com", phone: "+256700100003", gender: "male", occupation: "Engineer", city: "Jinja", district: "Jinja", country: "UG", status: "active" },
    { firstName: "Sarah", lastName: "Auma", email: "sarah@example.com", phone: "+256700100004", gender: "female", occupation: "Nurse", city: "Gulu", district: "Gulu", country: "UG", status: "pending" },
    { firstName: "David", lastName: "Kibet", email: "david@example.com", phone: "+256700100005", gender: "male", occupation: "Businessman", city: "Mbale", district: "Mbale", country: "UG", status: "active" },
    { firstName: "Mary", lastName: "Wanjiku", email: "mary@example.com", phone: "+256700100006", gender: "female", occupation: "Accountant", city: "Kampala", district: "Central", country: "UG", status: "active" },
    { firstName: "James", lastName: "Otieno", email: "james@example.com", phone: "+256700100007", gender: "male", occupation: "Driver", city: "Kampala", district: "Central", country: "UG", status: "inactive" },
    { firstName: "Agnes", lastName: "Namutebi", email: "agnes@example.com", phone: "+256700100008", gender: "female", occupation: "Trader", city: "Kampala", district: "Central", country: "UG", status: "active" },
    { firstName: "Robert", lastName: "Kamau", email: "robert@example.com", phone: "+256700100009", gender: "male", occupation: "Lawyer", city: "Kampala", district: "Central", country: "UG", status: "active" },
    { firstName: "Florence", lastName: "Achieng", email: "florence@example.com", phone: "+256700100010", gender: "female", occupation: "Doctor", city: "Kampala", district: "Central", country: "UG", status: "active" },
    { firstName: "Joseph", lastName: "Nsubuga", email: "joseph@example.com", phone: "+256700100011", gender: "male", occupation: "Mechanic", city: "Mukono", district: "Mukono", country: "UG", status: "active" },
    { firstName: "Elizabeth", lastName: "Kendi", email: "elizabeth@example.com", phone: "+256700100012", gender: "female", occupation: "Student", city: "Kampala", district: "Central", country: "UG", status: "pending" },
    { firstName: "Charles", lastName: "Okello", email: "charles@example.com", phone: "+256700100013", gender: "male", occupation: "Electrician", city: "Lira", district: "Lira", country: "UG", status: "active" },
    { firstName: "Diana", lastName: "Akoth", email: "diana@example.com", phone: "+256700100014", gender: "female", occupation: "Chef", city: "Kampala", district: "Central", country: "UG", status: "active" },
    { firstName: "Patrick", lastName: "Were", email: "patrick@example.com", phone: "+256700100015", gender: "male", occupation: "Pilot", city: "Entebbe", district: "Wakiso", country: "UG", status: "suspended" },
    { firstName: "Betty", lastName: "Namugenyi", email: "betty@example.com", phone: "+256700100016", gender: "female", occupation: "Pharmacist", city: "Kampala", district: "Central", country: "UG", status: "pending" },
  ];
  const members: Array<{ id: string }> = [];
  for (let i = 0; i < memberData.length; i++) {
    const m = await prisma.member.create({ data: { ...memberData[i], memberId: `IFFE-${String(i + 1).padStart(3, "0")}` } });
    members.push(m);
  }
  console.log(`  ${members.length} members created`);

  // ===== ACCOUNTS (20) =====
  const balances = [2500000, 1800000, 3200000, 500000, 4100000, 750000, 0, 1200000, 5600000, 980000, 2300000, 150000, 3800000, 620000, 0, 1500000, 8200000, 4500000, 950000, 2100000];
  const types = ["savings", "fixed_deposit", "savings", "current", "savings", "savings", "savings", "current", "savings", "savings", "savings", "savings", "savings", "fixed_deposit", "current", "savings", "fixed_deposit", "savings", "current", "savings"];
  const statuses = ["active", "active", "active", "active", "active", "active", "dormant", "active", "active", "frozen", "active", "active", "active", "active", "closed", "active", "active", "active", "active", "active"];
  const accounts: Array<{ id: string }> = [];
  for (let i = 0; i < 20; i++) {
    const mIdx = i < members.length ? i : i % members.length;
    const prefix = types[i] === "current" ? "CUR" : types[i] === "fixed_deposit" ? "FIX" : "SAV";
    const rate = types[i] === "savings" ? 12 : types[i] === "fixed_deposit" ? 15 : 5;
    const acc = await prisma.account.create({
      data: { accountNo: `${prefix}-${String(i + 1).padStart(4, "0")}`, memberId: members[mIdx].id, type: types[i], balance: balances[i], interestRate: rate, status: statuses[i], lastActivity: daysAgo(rand(0, 30)) },
    });
    accounts.push(acc);
  }
  console.log(`  ${accounts.length} accounts created`);

  // ===== TRANSACTIONS (40) =====
  const txnTypes = ["deposit", "withdrawal", "deposit", "loan_repayment", "deposit", "withdrawal", "transfer", "deposit", "loan_disbursement", "withdrawal", "deposit", "loan_repayment", "deposit", "withdrawal", "deposit", "fee", "deposit", "withdrawal", "interest_credit", "deposit", "deposit", "withdrawal", "deposit", "loan_repayment", "deposit", "withdrawal", "deposit", "transfer", "deposit", "withdrawal", "deposit", "deposit", "withdrawal", "deposit", "loan_repayment", "deposit", "withdrawal", "deposit", "interest_credit", "deposit"];
  const txnStatuses = ["completed", "completed", "completed", "completed", "pending", "completed", "completed", "completed", "completed", "rejected", "completed", "completed", "pending", "pending", "completed", "completed", "completed", "completed", "completed", "completed", "completed", "pending", "completed", "completed", "completed", "completed", "pending", "completed", "completed", "rejected", "completed", "completed", "completed", "pending", "completed", "completed", "completed", "reversed", "completed", "completed"];
  const methods = ["cash", "mobile_money", "bank_transfer", "cash", "mobile_money", "cash", "internal", "bank_transfer", "bank_transfer", "cash", "mobile_money", "cash", "mobile_money", "cash", "bank_transfer", "internal", "mobile_money", "cash", "internal", "cash"];
  for (let i = 0; i < 40; i++) {
    const accIdx = i % accounts.length;
    const amount = rand(50000, 2000000);
    await prisma.transaction.create({
      data: {
        accountId: accounts[accIdx].id,
        type: txnTypes[i],
        amount,
        method: methods[i % methods.length],
        status: txnStatuses[i],
        description: `${txnTypes[i].replace(/_/g, " ")} via ${methods[i % methods.length].replace(/_/g, " ")}`,
        processedBy: txnStatuses[i] === "completed" ? users[0].id : undefined,
        reference: `REF-${String(i + 1).padStart(6, "0")}`,
        createdAt: daysAgo(40 - i),
      },
    });
  }
  console.log("  40 transactions created");

  // ===== LOANS (16) =====
  const loanData = [
    { mIdx: 0, type: "business", amount: 5000000, balance: 3200000, rate: 12, term: 24, monthly: 235000, status: "active", days: 3 },
    { mIdx: 1, type: "personal", amount: 2000000, balance: 1400000, rate: 15, term: 12, monthly: 181000, status: "active", days: 5 },
    { mIdx: 2, type: "emergency", amount: 1000000, balance: 600000, rate: 10, term: 6, monthly: 172000, status: "active", days: 8 },
    { mIdx: 3, type: "business", amount: 8000000, balance: 8000000, rate: 12, term: 36, monthly: 266000, status: "pending", days: 0 },
    { mIdx: 4, type: "personal", amount: 3000000, balance: 0, rate: 15, term: 12, monthly: 271000, status: "paid", days: 0 },
    { mIdx: 5, type: "education", amount: 4000000, balance: 2800000, rate: 8, term: 18, monthly: 238000, status: "active", days: 15 },
    { mIdx: 6, type: "emergency", amount: 500000, balance: 250000, rate: 10, term: 3, monthly: 173000, status: "overdue", days: -5 },
    { mIdx: 7, type: "business", amount: 10000000, balance: 7500000, rate: 12, term: 24, monthly: 470000, status: "active", days: 20 },
    { mIdx: 8, type: "housing", amount: 15000000, balance: 12000000, rate: 10, term: 36, monthly: 484000, status: "active", days: 10 },
    { mIdx: 9, type: "personal", amount: 1500000, balance: 1500000, rate: 15, term: 6, monthly: 265000, status: "pending", days: 0 },
    { mIdx: 10, type: "business", amount: 6000000, balance: 6000000, rate: 12, term: 24, monthly: 282000, status: "rejected", days: 0 },
    { mIdx: 11, type: "education", amount: 2500000, balance: 2500000, rate: 8, term: 12, monthly: 218000, status: "pending", days: 0 },
    { mIdx: 12, type: "emergency", amount: 800000, balance: 400000, rate: 10, term: 6, monthly: 138000, status: "active", days: 12 },
    { mIdx: 13, type: "personal", amount: 1200000, balance: 0, rate: 15, term: 6, monthly: 212000, status: "paid", days: 0 },
    { mIdx: 0, type: "education", amount: 3500000, balance: 800000, rate: 8, term: 12, monthly: 304000, status: "active", days: 7 },
    { mIdx: 4, type: "business", amount: 7000000, balance: 7000000, rate: 12, term: 24, monthly: 329000, status: "defaulted", days: -30 },
  ];
  for (const l of loanData) {
    const nextPay = l.days > 0 ? daysFromNow(l.days) : l.days < 0 ? daysAgo(-l.days) : null;
    await prisma.loan.create({
      data: {
        memberId: members[l.mIdx].id, type: l.type, amount: l.amount, balance: l.balance,
        interestRate: l.rate, term: l.term, monthlyPayment: l.monthly, status: l.status,
        nextPaymentDate: nextPay,
        approvedBy: ["active", "paid", "overdue", "defaulted"].includes(l.status) ? users[0].id : undefined,
        disbursedAt: ["active", "paid", "overdue", "defaulted"].includes(l.status) ? daysAgo(90) : undefined,
      },
    });
  }
  console.log(`  ${loanData.length} loans created`);

  // ===== EXPENSES (20) =====
  const expData = [
    { desc: "Staff Salaries - March 2026", cat: "Salaries", amount: 4500000, status: "approved" },
    { desc: "Office Rent - March", cat: "Rent", amount: 1200000, status: "approved" },
    { desc: "Internet & Phone", cat: "Utilities", amount: 350000, status: "approved" },
    { desc: "Marketing Campaign Q1", cat: "Marketing", amount: 800000, status: "pending" },
    { desc: "Office Supplies", cat: "Operations", amount: 150000, status: "approved" },
    { desc: "System Maintenance", cat: "IT", amount: 500000, status: "approved" },
    { desc: "Transport Allowances", cat: "Operations", amount: 280000, status: "approved" },
    { desc: "Training Workshop", cat: "Training", amount: 650000, status: "pending" },
    { desc: "Staff Salaries - February", cat: "Salaries", amount: 4500000, status: "approved" },
    { desc: "Office Rent - February", cat: "Rent", amount: 1200000, status: "approved" },
    { desc: "Generator Fuel", cat: "Utilities", amount: 120000, status: "approved" },
    { desc: "Business Cards Printing", cat: "Marketing", amount: 80000, status: "approved" },
    { desc: "Security Services", cat: "Operations", amount: 400000, status: "approved" },
    { desc: "Software Licenses", cat: "IT", amount: 750000, status: "pending" },
    { desc: "Annual Audit Fee", cat: "Operations", amount: 2000000, status: "approved" },
    { desc: "Water & Electricity", cat: "Utilities", amount: 180000, status: "approved" },
    { desc: "Team Building Event", cat: "Training", amount: 350000, status: "rejected" },
    { desc: "Insurance Premium", cat: "Insurance", amount: 1500000, status: "approved" },
    { desc: "Legal Consultation", cat: "Operations", amount: 600000, status: "approved" },
    { desc: "Social Media Ads", cat: "Marketing", amount: 200000, status: "pending" },
  ];
  for (let i = 0; i < expData.length; i++) {
    await prisma.expense.create({
      data: { description: expData[i].desc, category: expData[i].cat, amount: expData[i].amount, status: expData[i].status, date: daysAgo(expData.length * 3 - i * 3), approvedBy: expData[i].status === "approved" ? users[0].id : undefined },
    });
  }
  console.log(`  ${expData.length} expenses created`);

  // ===== DEPOSIT REQUESTS (10) =====
  for (let i = 0; i < 10; i++) {
    const mIdx = i % members.length;
    const status = i < 4 ? "pending" : i < 8 ? "approved" : "rejected";
    await prisma.depositRequest.create({
      data: { memberId: members[mIdx].id, accountId: accounts[mIdx].id, amount: rand(100000, 2000000), method: ["cash", "mobile_money", "bank_transfer"][i % 3], description: `Deposit request #${i + 1}`, status, processedBy: status !== "pending" ? users[0].id : undefined, createdAt: daysAgo(10 - i) },
    });
  }
  console.log("  10 deposit requests created");

  // ===== WITHDRAW REQUESTS (10) =====
  for (let i = 0; i < 10; i++) {
    const mIdx = (i + 3) % members.length;
    const status = i < 3 ? "pending" : i < 7 ? "approved" : "rejected";
    await prisma.withdrawRequest.create({
      data: { memberId: members[mIdx].id, accountId: accounts[mIdx].id, amount: rand(50000, 1000000), method: ["cash", "mobile_money", "bank_transfer"][i % 3], reason: `Withdrawal request #${i + 1}`, status, processedBy: status !== "pending" ? users[0].id : undefined, createdAt: daysAgo(10 - i) },
    });
  }
  console.log("  10 withdraw requests created");

  // ===== PAYMENT GATEWAYS (5) =====
  await prisma.paymentGateway.createMany({
    data: [
      { name: "MTN Mobile Money", type: "mobile_money", currency: "UGX", fee: "1.5%", isActive: true },
      { name: "Airtel Money", type: "mobile_money", currency: "UGX", fee: "1.5%", isActive: true },
      { name: "Stanbic FlexiPay", type: "bank", currency: "UGX", fee: "0.5%", isActive: false },
      { name: "Visa/Mastercard", type: "card", currency: "USD", fee: "2.5%", isActive: false },
      { name: "PayPal", type: "online", currency: "USD", fee: "3.0%", isActive: false },
    ],
  });
  console.log("  5 payment gateways created");

  // ===== WELFARE PROGRAMS (4) + PLEDGES (25) =====
  const w1 = await prisma.welfareProgram.create({ data: { name: "Medical Emergency Fund", description: "Emergency medical support for members and families", targetAmount: 50000000, raisedAmount: 32000000, contributorCount: 45, status: "active" } });
  const w2 = await prisma.welfareProgram.create({ data: { name: "Education Scholarship", description: "Supporting member children's education through bursaries", targetAmount: 30000000, raisedAmount: 18000000, contributorCount: 30, status: "active" } });
  const w3 = await prisma.welfareProgram.create({ data: { name: "Bereavement Support", description: "Financial support during loss of a family member", targetAmount: 20000000, raisedAmount: 15000000, contributorCount: 55, status: "active" } });
  const w4 = await prisma.welfareProgram.create({ data: { name: "Housing Support Fund", description: "Help members with housing construction and improvements", targetAmount: 100000000, raisedAmount: 45000000, contributorCount: 22, status: "active" } });

  const pledgeStatuses = ["pledged", "paid", "pledged", "paid", "cancelled", "pledged", "paid", "pledged", "pledged", "paid"];
  for (let i = 0; i < 25; i++) {
    const prog = [w1, w2, w3, w4][i % 4];
    const mIdx = i % members.length;
    await prisma.pledge.create({ data: { programId: prog.id, memberId: members[mIdx].id, amount: rand(100000, 1000000), status: pledgeStatuses[i % pledgeStatuses.length] } });
  }
  console.log("  4 welfare programs + 25 pledges created");

  // ===== BANK ACCOUNTS (5) =====
  await prisma.bankAccount.createMany({
    data: [
      { bankName: "Stanbic Bank", accountName: "IFFE SACCO Main Account", accountNo: "9030012345678", branch: "Kampala Main", balance: 125000000, status: "active" },
      { bankName: "DFCU Bank", accountName: "IFFE SACCO Operations", accountNo: "02012345678", branch: "Garden City", balance: 45000000, status: "active" },
      { bankName: "Centenary Bank", accountName: "IFFE SACCO Reserve", accountNo: "34012345678", branch: "Entebbe Road", balance: 80000000, status: "active" },
      { bankName: "Equity Bank", accountName: "IFFE SACCO Loans", accountNo: "56012345678", branch: "Ndeeba", balance: 35000000, status: "active" },
      { bankName: "Bank of Africa", accountName: "IFFE SACCO Savings", accountNo: "78012345678", branch: "City Square", balance: 18000000, status: "inactive" },
    ],
  });
  console.log("  5 bank accounts created");

  // ===== SETTINGS (15) =====
  const settings = [
    { key: "company_name", value: "IFFE SACCO" },
    { key: "tagline", value: "Empowering Financial Freedom" },
    { key: "email", value: "info@iffeds.org" },
    { key: "phone", value: "+256 700 000 000" },
    { key: "currency", value: "USh" },
    { key: "currency_code", value: "UGX" },
    { key: "date_format", value: "Y-m-d" },
    { key: "language", value: "en" },
    { key: "timezone", value: "Africa/Kampala" },
    { key: "address", value: "Plot 10, Kampala Road, Kampala, Uganda" },
    { key: "min_savings_balance", value: "10000" },
    { key: "max_daily_withdrawal", value: "5000000" },
    { key: "loan_approval_required", value: "true" },
    { key: "two_factor_auth", value: "false" },
    { key: "session_timeout_minutes", value: "30" },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }
  console.log("  15 settings created");

  // ===== AUDIT LOGS (15) =====
  const actions = ["login", "create_member", "approve_loan", "create_transaction", "update_settings", "approve_expense", "reject_withdrawal", "create_member", "login", "approve_deposit", "deactivate_user", "create_loan", "approve_transaction", "update_member", "login"];
  const entities = ["user", "member", "loan", "transaction", "setting", "expense", "withdraw_request", "member", "user", "deposit_request", "user", "loan", "transaction", "member", "user"];
  for (let i = 0; i < 15; i++) {
    await prisma.auditLog.create({
      data: { userId: users[i % 3].id, action: actions[i], entity: entities[i], entityId: members[i % members.length].id, ipAddress: `192.168.1.${rand(1, 254)}`, createdAt: daysAgo(15 - i) },
    });
  }
  console.log("  15 audit logs created");

  console.log("\n=== SEED COMPLETE ===");
  console.log("  Login credentials (all password: password123):");
  console.log("  Admin:  admin@iffeds.org");
  console.log("  Staff:  staff@iffeds.org");
  console.log("  Member: john@example.com / grace@example.com");
  console.log("\n  Data summary:");
  console.log("  8 users | 16 members | 20 accounts | 40 transactions");
  console.log("  16 loans | 20 expenses | 10 deposit reqs | 10 withdraw reqs");
  console.log("  5 gateways | 4 welfare programs | 25 pledges | 5 bank accounts");
  console.log("  15 settings | 15 audit logs");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
