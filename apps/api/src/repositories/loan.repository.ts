import { prisma } from "../config/db";
import type { PaginationInput } from "@iffe/shared";

export class LoanRepository {
  async findAll(params: PaginationInput & { status?: string; memberId?: string }) {
    const { page = 1, limit = 20, search, sortBy = "createdAt", sortOrder = "desc", status, memberId } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (memberId) where.memberId = memberId;
    if (search) {
      where.OR = [
        { type: { contains: search, mode: "insensitive" } },
        { member: { firstName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.loan.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder }, include: { member: true } }),
      prisma.loan.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    return prisma.loan.findUnique({ where: { id }, include: { member: true } });
  }

  async create(data: {
    memberId: string; type: string; amount: number; interestRate: number; term: number;
  }) {
    const monthlyRate = data.interestRate / 100 / 12;
    const monthlyPayment = monthlyRate > 0
      ? (data.amount * monthlyRate * Math.pow(1 + monthlyRate, data.term)) / (Math.pow(1 + monthlyRate, data.term) - 1)
      : data.amount / data.term;

    return prisma.loan.create({
      data: {
        ...data,
        balance: data.amount,
        monthlyPayment: Math.round(monthlyPayment),
        status: "pending",
      },
    });
  }

  async approve(id: string, approvedBy: string) {
    const nextPayment = new Date();
    nextPayment.setMonth(nextPayment.getMonth() + 1);

    return prisma.loan.update({
      where: { id },
      data: { status: "active", approvedBy, disbursedAt: new Date(), nextPaymentDate: nextPayment },
    });
  }

  async reject(id: string) {
    return prisma.loan.update({ where: { id }, data: { status: "rejected" } });
  }

  async getStats() {
    const [activeCount, activeAmount, overdue, totalDisbursed] = await Promise.all([
      prisma.loan.count({ where: { status: "active" } }),
      prisma.loan.aggregate({ where: { status: "active" }, _sum: { balance: true } }),
      prisma.loan.count({ where: { status: "overdue" } }),
      prisma.loan.aggregate({ where: { status: { in: ["active", "paid"] } }, _sum: { amount: true } }),
    ]);
    return {
      activeCount,
      activeAmount: activeAmount._sum.balance || 0,
      overdue,
      totalDisbursed: totalDisbursed._sum.amount || 0,
    };
  }
}
