import { prisma } from "../config/db";
import { HTTPException } from "hono/http-exception";
import type { PaginationInput } from "../../../shared/src";

export class LoanService {
  async getAll(params: PaginationInput & { status?: string; memberId?: string }) {
    const { page = 1, limit = 20, search, sortBy = "createdAt", sortOrder = "desc", status, memberId } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (memberId) where.memberId = memberId;
    if (search) where.OR = [
      { type: { contains: search, mode: "insensitive" } },
      { member: { firstName: { contains: search, mode: "insensitive" } } },
    ];
    const [data, total] = await Promise.all([
      prisma.loan.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder }, include: { member: true } }),
      prisma.loan.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: string) {
    const loan = await prisma.loan.findUnique({ where: { id }, include: { member: true } });
    if (!loan) throw new HTTPException(404, { message: "Loan not found" });
    return loan;
  }

  async create(data: { memberId: string; type: string; amount: number; interestRate: number; term: number }) {
    const member = await prisma.member.findUnique({ where: { id: data.memberId } });
    if (!member) throw new HTTPException(404, { message: "Member not found" });
    if (member.status !== "active") throw new HTTPException(400, { message: "Member must be active to apply for a loan" });

    const monthlyRate = data.interestRate / 100 / 12;
    const monthlyPayment = monthlyRate > 0
      ? (data.amount * monthlyRate * Math.pow(1 + monthlyRate, data.term)) / (Math.pow(1 + monthlyRate, data.term) - 1)
      : data.amount / data.term;

    return prisma.loan.create({
      data: { ...data, balance: data.amount, monthlyPayment: Math.round(monthlyPayment), status: "pending" },
      include: { member: true },
    });
  }

  async approve(id: string, approvedBy: string) {
    const loan = await this.getById(id);
    if (loan.status !== "pending") throw new HTTPException(400, { message: "Loan is not pending approval" });

    const nextPayment = new Date();
    nextPayment.setMonth(nextPayment.getMonth() + 1);

    return prisma.loan.update({
      where: { id },
      data: { status: "active", approvedBy, disbursedAt: new Date(), nextPaymentDate: nextPayment },
      include: { member: true },
    });
  }

  async reject(id: string) {
    const loan = await this.getById(id);
    if (loan.status !== "pending") throw new HTTPException(400, { message: "Loan is not pending" });
    return prisma.loan.update({ where: { id }, data: { status: "rejected" }, include: { member: true } });
  }

  async recordRepayment(id: string, amount: number, processedBy: string) {
    const loan = await this.getById(id);
    if (!["active", "overdue"].includes(loan.status)) throw new HTTPException(400, { message: "Loan is not active" });
    if (amount > Number(loan.balance)) throw new HTTPException(400, { message: "Payment exceeds outstanding balance" });

    const newBalance = Number(loan.balance) - amount;
    const isPaidOff = newBalance <= 0;
    const nextPayment = isPaidOff ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return prisma.loan.update({
      where: { id },
      data: {
        balance: Math.max(0, newBalance),
        status: isPaidOff ? "paid" : "active",
        nextPaymentDate: nextPayment,
      },
      include: { member: true },
    });
  }

  async getStats() {
    const [activeCount, activeAmount, overdue, totalDisbursed] = await Promise.all([
      prisma.loan.count({ where: { status: "active" } }),
      prisma.loan.aggregate({ where: { status: "active" }, _sum: { balance: true } }),
      prisma.loan.count({ where: { status: "overdue" } }),
      prisma.loan.aggregate({ where: { status: { in: ["active", "paid"] } }, _sum: { amount: true } }),
    ]);
    return { activeCount, activeAmount: activeAmount._sum.balance || 0, overdue, totalDisbursed: totalDisbursed._sum.amount || 0 };
  }
}
