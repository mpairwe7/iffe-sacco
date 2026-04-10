import { prisma, withTx } from "../config/db";
import type { PaginationInput } from "@iffe/shared";

export class PledgeRepository {
  async findByProgram(programId: string, params: PaginationInput) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where = { programId };
    const [data, total] = await Promise.all([
      prisma.pledge.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.pledge.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByMember(memberId: string, params: PaginationInput) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where = { memberId };
    const [data, total] = await Promise.all([
      prisma.pledge.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { program: true },
      }),
      prisma.pledge.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(data: { programId: string; memberId: string; amount: number }) {
    return withTx(async (tx: any) => {
      const pledge = await tx.pledge.create({ data: { ...data, status: "pledged" } });
      await tx.welfareProgram.update({
        where: { id: data.programId },
        data: {
          raisedAmount: { increment: data.amount },
          contributorCount: { increment: 1 },
        },
      });
      return pledge;
    });
  }

  async updateStatus(id: string, status: string) {
    return withTx(async (tx: any) => {
      const pledge = await tx.pledge.findUniqueOrThrow({ where: { id } });
      const updated = await tx.pledge.update({ where: { id }, data: { status } });

      if (status === "cancelled" && pledge.status !== "cancelled") {
        await tx.welfareProgram.update({
          where: { id: pledge.programId },
          data: {
            raisedAmount: { decrement: pledge.amount },
            contributorCount: { decrement: 1 },
          },
        });
      }

      return updated;
    });
  }
}
