import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { calculateInterestSchema } from "@iffe/shared";
import { InterestService } from "../services/interest.service";
import { authMiddleware, requireRole } from "../middleware/auth";

const interest = new Hono();
const service = new InterestService();

interest.use("*", authMiddleware);
interest.use("*", requireRole("admin"));

interest.post("/preview", zValidator("json", calculateInterestSchema), async (c) => {
  const data = c.req.valid("json");
  const result = await service.preview(data);
  return c.json({ success: true, data: result });
});

interest.post("/calculate", zValidator("json", calculateInterestSchema), async (c) => {
  const data = c.req.valid("json");
  const user = c.get("user" as any) as { id: string; role: string };
  const result = await service.calculateAndPost(data, user.id);
  return c.json({ success: true, data: result });
});

export { interest as interestRoutes };
