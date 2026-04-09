import { prisma } from "../config/db";
import type { PaginationInput } from "@iffe/shared";
import { getNextMemberNumber } from "../utils/identifiers";

export class MemberRepository {
  async findAll(params: PaginationInput) {
    const { page = 1, limit = 20, search, sortBy = "createdAt", sortOrder = "desc" } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { memberId: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.member.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder }, include: { accounts: { select: { id: true, accountNo: true, type: true, status: true, balance: true } } } }),
      prisma.member.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    return prisma.member.findUnique({ where: { id }, include: { accounts: true, user: true } });
  }

  async findByMemberId(memberId: string) {
    return prisma.member.findUnique({ where: { memberId } });
  }

  async create(data: {
    firstName: string; lastName: string; email: string; phone: string;
    gender?: string; dateOfBirth?: Date; nationalId?: string; occupation?: string;
    address?: string; city?: string; district?: string; country?: string; userId?: string;
    shareCount?: number; weddingSupportStatus?: string; weddingSupportDebt?: number;
    condolenceSupportStatus?: string; condolenceSupportDebt?: number; remarks?: string;
  }) {
    return prisma.member.create({
      data: {
        ...data,
        memberId: await getNextMemberNumber(prisma),
        status: "pending",
      },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    return prisma.member.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.member.delete({ where: { id } });
  }

  async countByStatus() {
    const [active, pending, inactive, total] = await Promise.all([
      prisma.member.count({ where: { status: "active" } }),
      prisma.member.count({ where: { status: "pending" } }),
      prisma.member.count({ where: { status: "inactive" } }),
      prisma.member.count(),
    ]);
    return { active, pending, inactive, total };
  }
}
