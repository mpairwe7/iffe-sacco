import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createBankAccountSchema, updateBankAccountSchema, paginationSchema } from "@iffe/shared";
import { BankAccountRepository } from "../repositories/bank-account.repository";
import { authMiddleware, requireRole } from "../middleware/auth";
import { HTTPException } from "hono/http-exception";

const bankAccounts = new Hono();
const repo = new BankAccountRepository();

bankAccounts.use("*", authMiddleware);

bankAccounts.get("/", zValidator("query", paginationSchema), async (c) => {
  const params = c.req.valid("query");
  const result = await repo.findAll(params);
  return c.json({ success: true, data: result });
});

bankAccounts.get("/stats", async (c) => {
  const stats = await repo.getStats();
  return c.json({ success: true, data: stats });
});

bankAccounts.get("/:id", async (c) => {
  const account = await repo.findById(c.req.param("id"));
  if (!account) throw new HTTPException(404, { message: "Bank account not found" });
  return c.json({ success: true, data: account });
});

bankAccounts.post("/", requireRole("admin"), zValidator("json", createBankAccountSchema), async (c) => {
  const data = c.req.valid("json");
  const account = await repo.create(data);
  return c.json({ success: true, data: account }, 201);
});

bankAccounts.put("/:id", requireRole("admin"), zValidator("json", updateBankAccountSchema), async (c) => {
  const data = c.req.valid("json");
  const account = await repo.update(c.req.param("id"), data);
  return c.json({ success: true, data: account });
});

bankAccounts.delete("/:id", requireRole("admin"), async (c) => {
  await repo.delete(c.req.param("id"));
  return c.json({ success: true, message: "Bank account deleted" });
});

export { bankAccounts as bankAccountRoutes };
