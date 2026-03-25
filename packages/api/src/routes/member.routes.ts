import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createMemberSchema, updateMemberSchema, paginationSchema } from "../../../shared/src";
import { MemberService } from "../services/member.service";
import { authMiddleware, requireRole } from "../middleware/auth";

const members = new Hono();
const service = new MemberService();

members.use("*", authMiddleware);

members.get("/", zValidator("query", paginationSchema), async (c) => {
  const params = c.req.valid("query");
  const result = await service.getAll(params);
  return c.json({ success: true, data: result });
});

members.get("/stats", async (c) => {
  const stats = await service.getStats();
  return c.json({ success: true, data: stats });
});

members.get("/:id", async (c) => {
  const member = await service.getById(c.req.param("id"));
  return c.json({ success: true, data: member });
});

members.post("/", requireRole("admin", "staff"), zValidator("json", createMemberSchema), async (c) => {
  const data = c.req.valid("json");
  const member = await service.create(data);
  return c.json({ success: true, data: member }, 201);
});

members.put("/:id", requireRole("admin", "staff"), zValidator("json", updateMemberSchema), async (c) => {
  const data = c.req.valid("json");
  const member = await service.update(c.req.param("id"), data);
  return c.json({ success: true, data: member });
});

members.delete("/:id", requireRole("admin"), async (c) => {
  await service.delete(c.req.param("id"));
  return c.json({ success: true, message: "Member deleted" });
});

export { members as memberRoutes };
