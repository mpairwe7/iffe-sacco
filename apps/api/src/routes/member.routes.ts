import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createMemberSchema, updateMemberSchema, paginationSchema } from "@iffe/shared";
import { MemberService } from "../services/member.service";
import { authMiddleware, requireRole, type AuthEnv } from "../middleware/auth";
import { writeAuditLog } from "../utils/audit";

const members = new Hono<AuthEnv>();
const service = new MemberService();

members.use("*", authMiddleware);

members.get("/", requireRole("admin", "staff", "chairman"), zValidator("query", paginationSchema), async (c) => {
  const params = c.req.valid("query");
  const result = await service.getAll(params);
  return c.json({ success: true, data: result });
});

members.get("/stats", requireRole("admin", "staff", "chairman"), async (c) => {
  const stats = await service.getStats();
  return c.json({ success: true, data: stats });
});

members.get("/me/dashboard", requireRole("member"), async (c) => {
  const user = c.get("user");
  if (!user.memberId) {
    return c.json({ success: false, message: "Member profile not found" }, 404);
  }

  const member = await service.getDashboard(user.memberId);
  return c.json({ success: true, data: member });
});

members.get("/:id/dashboard", requireRole("admin", "staff", "chairman"), async (c) => {
  const member = await service.getDashboard(c.req.param("id"));
  return c.json({ success: true, data: member });
});

members.get("/:id", requireRole("admin", "staff", "chairman"), async (c) => {
  const member = await service.getById(c.req.param("id"));
  return c.json({ success: true, data: member });
});

members.post("/", requireRole("admin"), zValidator("json", createMemberSchema), async (c) => {
  const data = c.req.valid("json");
  const member = await service.create(data);
  await writeAuditLog(c, {
    action: "member_created",
    entity: "member",
    entityId: member.id,
    details: { memberId: member.memberId },
  });
  return c.json({ success: true, data: member }, 201);
});

members.put("/:id", requireRole("admin", "staff"), zValidator("json", updateMemberSchema), async (c) => {
  const data = c.req.valid("json");
  const member = await service.update(c.req.param("id"), data);
  await writeAuditLog(c, {
    action: "member_updated",
    entity: "member",
    entityId: member.id,
  });
  return c.json({ success: true, data: member });
});

members.delete("/:id", requireRole("admin"), async (c) => {
  await service.delete(c.req.param("id"));
  await writeAuditLog(c, {
    action: "member_deleted",
    entity: "member",
    entityId: c.req.param("id"),
  });
  return c.json({ success: true, message: "Member deleted" });
});

export { members as memberRoutes };
