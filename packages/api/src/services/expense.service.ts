import { ExpenseRepository } from "../repositories/expense.repository";
import { HTTPException } from "hono/http-exception";
import type { CreateExpenseInput, PaginationInput } from "@iffe/shared";

const repo = new ExpenseRepository();

export class ExpenseService {
  async getAll(params: PaginationInput & { category?: string; status?: string }) {
    return repo.findAll(params);
  }

  async getById(id: string) {
    const expense = await repo.findById(id);
    if (!expense) throw new HTTPException(404, { message: "Expense not found" });
    return expense;
  }

  async create(input: CreateExpenseInput) {
    return repo.create({ ...input, status: "pending" });
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.getById(id);
    return repo.update(id, data);
  }

  async approve(id: string, userId: string) {
    const expense = await this.getById(id);
    if (expense.status !== "pending") throw new HTTPException(400, { message: "Only pending expenses can be approved" });
    return repo.updateStatus(id, "approved", userId);
  }

  async reject(id: string) {
    const expense = await this.getById(id);
    if (expense.status !== "pending") throw new HTTPException(400, { message: "Only pending expenses can be rejected" });
    return repo.updateStatus(id, "rejected");
  }

  async delete(id: string) {
    await this.getById(id);
    return repo.delete(id);
  }

  async getStats() {
    return repo.getStats();
  }
}
