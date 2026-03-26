import { MemberRepository } from "../repositories/member.repository";
import { prisma } from "../config/db";
import { HTTPException } from "hono/http-exception";
import type { CreateMemberInput, PaginationInput } from "@iffe/shared";
import { INTEREST_RATES } from "@iffe/shared";

const repo = new MemberRepository();

export class MemberService {
  async getAll(params: PaginationInput) {
    return repo.findAll(params);
  }

  async getById(id: string) {
    const member = await repo.findById(id);
    if (!member) throw new HTTPException(404, { message: "Member not found" });
    return member;
  }

  async create(input: CreateMemberInput) {
    // Check for duplicate email
    const existing = await prisma.member.findFirst({ where: { email: input.email } });
    if (existing) throw new HTTPException(409, { message: "A member with this email already exists" });

    const member = await repo.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      gender: input.gender,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      nationalId: input.nationalId,
      occupation: input.occupation,
      address: input.address,
      city: input.city,
      district: input.district,
      country: input.country,
    });

    // Auto-create savings account
    const count = await prisma.account.count();
    const accountNo = `SAV-${String(count + 1).padStart(4, "0")}`;
    const rate = INTEREST_RATES[input.accountType as keyof typeof INTEREST_RATES] || 12;

    await prisma.account.create({
      data: {
        accountNo,
        memberId: member.id,
        type: input.accountType,
        balance: input.initialDeposit || 0,
        interestRate: rate,
        status: "active",
      },
    });

    return member;
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.getById(id); // ensures exists
    return repo.update(id, data);
  }

  async delete(id: string) {
    await this.getById(id);
    return repo.delete(id);
  }

  async getStats() {
    return repo.countByStatus();
  }
}
