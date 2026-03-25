import { AccountRepository } from "../repositories/account.repository";
import { HTTPException } from "hono/http-exception";
import type { PaginationInput } from "@iffe/shared";

const repo = new AccountRepository();

export class AccountService {
  async getAll(params: PaginationInput & { type?: string; status?: string; memberId?: string }) {
    return repo.findAll(params);
  }

  async getById(id: string) {
    const account = await repo.findById(id);
    if (!account) throw new HTTPException(404, { message: "Account not found" });
    return account;
  }

  async create(data: { memberId: string; type: string; interestRate?: number }) {
    return repo.create(data);
  }

  async updateStatus(id: string, status: string) {
    await this.getById(id);
    return repo.updateStatus(id, status);
  }

  async getStats() {
    return repo.getStats();
  }
}
