// @ts-nocheck
import { handle } from "hono/vercel";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono().basePath("/api/v1");

app.use("*", cors({ origin: (origin) => origin || "*", credentials: true }));

app.get("/health", (c) => c.json({ status: "ok", time: new Date().toISOString() }));

app.notFound((c) => c.json({ success: false, message: "Route not found" }, 404));

export default handle(app);
