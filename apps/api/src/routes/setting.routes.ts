import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { updateSettingSchema } from "@iffe/shared";
import { prisma } from "../config/db";
import { authMiddleware, requireRole } from "../middleware/auth";

const settings = new Hono();

settings.use("*", authMiddleware);
settings.use("*", requireRole("admin"));

settings.get("/", async (c) => {
  const data = await prisma.setting.findMany({ orderBy: { key: "asc" } });
  return c.json({ success: true, data });
});

settings.get("/:key", async (c) => {
  const setting = await prisma.setting.findUnique({ where: { key: c.req.param("key") } });
  return c.json({ success: true, data: setting });
});

settings.put("/:key", zValidator("json", updateSettingSchema), async (c) => {
  const { value } = c.req.valid("json");
  const key = c.req.param("key");
  const setting = await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  return c.json({ success: true, data: setting });
});

settings.delete("/:key", async (c) => {
  await prisma.setting.delete({ where: { key: c.req.param("key") } });
  return c.json({ success: true, message: "Setting deleted" });
});

export { settings as settingRoutes };
