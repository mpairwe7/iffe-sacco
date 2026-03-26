import { WelfareRepository } from "../repositories/welfare.repository";
import { PledgeRepository } from "../repositories/pledge.repository";
import { HTTPException } from "hono/http-exception";
import type { CreateWelfareInput, PledgeInput, PaginationInput } from "@iffe/shared";

const welfareRepo = new WelfareRepository();
const pledgeRepo = new PledgeRepository();

export class WelfareService {
  async getAll(params: PaginationInput & { status?: string }) {
    return welfareRepo.findAll(params);
  }

  async getById(id: string) {
    const program = await welfareRepo.findById(id);
    if (!program) throw new HTTPException(404, { message: "Welfare program not found" });
    return program;
  }

  async create(input: CreateWelfareInput) {
    return welfareRepo.create(input);
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.getById(id);
    return welfareRepo.update(id, data);
  }

  async updateStatus(id: string, status: string) {
    await this.getById(id);
    return welfareRepo.updateStatus(id, status);
  }

  async createPledge(input: PledgeInput & { memberId: string }) {
    const program = await this.getById(input.programId);
    if (program.status !== "active") throw new HTTPException(400, { message: "Program is not active" });
    return pledgeRepo.create({ programId: input.programId, memberId: input.memberId, amount: input.amount });
  }

  async getPledges(programId: string, params: PaginationInput) {
    return pledgeRepo.findByProgram(programId, params);
  }

  async getMemberPledges(memberId: string, params: PaginationInput) {
    return pledgeRepo.findByMember(memberId, params);
  }

  async getStats() {
    return welfareRepo.getStats();
  }
}
