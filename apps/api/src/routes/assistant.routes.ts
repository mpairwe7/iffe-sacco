/**
 * Assistant chat endpoint — streaming via Server-Sent Events.
 *
 * POST /assistant/chat
 *   { conversationId?, messages: [{ role, content }] }
 *
 * Streams back SSE lines:
 *   data: { type: "text", value: "..." }
 *   data: { type: "tool_call", name, args }
 *   data: { type: "tool_result", name, value }
 *   data: { type: "done", conversationId, messageId }
 *
 * Provider is Vercel AI Gateway by default; set AI_GATEWAY_URL +
 * AI_GATEWAY_API_KEY, and optionally ASSISTANT_MODEL (default
 * claude-haiku-4-5 for latency; opus for hard analytical questions).
 *
 * When the gateway isn't configured, returns a single stubbed reply
 * so local dev still works without credentials.
 */
// @ts-nocheck
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod/v4";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import { executeTool } from "../services/assistant.service";
import { systemPromptFor, TOOLS, toolsForAudience } from "@iffe/assistant";
import type { AssistantAudience } from "@iffe/assistant";
import { prisma } from "../config/db";
import { logger } from "../utils/logger";

const assistant = new Hono<AuthEnv>();
assistant.use("*", authMiddleware);

const chatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(10_000),
      }),
    )
    .min(1),
});

async function persistUserTurn(
  userId: string,
  audience: AssistantAudience,
  conversationId: string | undefined,
  userMessage: string,
) {
  const conversation = conversationId
    ? await prisma.assistantConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      })
    : await prisma.assistantConversation.create({
        data: {
          userId,
          audience,
          title: userMessage.slice(0, 60),
        },
      });

  await prisma.assistantMessage.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content: userMessage,
    },
  });

  return conversation.id;
}

async function persistAssistantTurn(
  conversationId: string,
  content: string,
  toolCalls: unknown[],
  tokens: { in?: number; out?: number } = {},
  model?: string,
) {
  await prisma.assistantMessage.create({
    data: {
      conversationId,
      role: "assistant",
      content,
      toolCalls: toolCalls.length ? (toolCalls as any) : undefined,
      tokensIn: tokens.in,
      tokensOut: tokens.out,
      model,
    },
  });
}

assistant.post("/chat", zValidator("json", chatSchema), async (c) => {
  const user = c.get("user");
  const audience = user.role as AssistantAudience;
  const { conversationId: inputConvId, messages } = c.req.valid("json");

  const latestUser = messages[messages.length - 1];
  if (latestUser.role !== "user") {
    return c.json({ success: false, message: "Last message must be from the user" }, 400);
  }

  const conversationId = await persistUserTurn(user.id, audience, inputConvId, latestUser.content);

  // Build the tool list filtered for this audience.
  const audienceTools = toolsForAudience(audience);

  return streamSSE(c, async (stream) => {
    const send = async (event: any) => {
      await stream.writeSSE({ data: JSON.stringify(event) });
    };

    try {
      const gatewayUrl = process.env.AI_GATEWAY_URL;
      const gatewayKey = process.env.AI_GATEWAY_API_KEY;
      const model = process.env.ASSISTANT_MODEL || "anthropic/claude-haiku-4-5-20251001";

      if (!gatewayUrl || !gatewayKey) {
        const stub = "Assistant is not configured for this environment. Set AI_GATEWAY_URL and AI_GATEWAY_API_KEY to enable conversational responses.";
        for (const chunk of stub.match(/.{1,40}/g) ?? [stub]) {
          await send({ type: "text", value: chunk });
        }
        await persistAssistantTurn(conversationId, stub, []);
        await send({ type: "done", conversationId });
        return;
      }

      const toolDeclarations = audienceTools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: {
          type: "object",
          properties: {},
          additionalProperties: true,
        },
      }));

      // Agent loop: up to 5 tool-call rounds before giving up.
      const convoMessages: any[] = messages.map((m) => ({ role: m.role, content: m.content }));
      let finalText = "";
      const executedToolCalls: any[] = [];

      for (let round = 0; round < 5; round += 1) {
        const res = await fetch(`${gatewayUrl.replace(/\/$/, "")}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${gatewayKey}`,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 1024,
            system: systemPromptFor(audience),
            tools: toolDeclarations,
            messages: convoMessages,
          }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 200)}`);
        }

        const body = await res.json();
        const content = body.content ?? [];
        const blockingToolCalls: any[] = [];

        for (const block of content) {
          if (block.type === "text") {
            finalText += block.text;
            for (const chunk of (block.text as string).match(/.{1,40}/g) ?? [block.text]) {
              await send({ type: "text", value: chunk });
            }
          } else if (block.type === "tool_use") {
            blockingToolCalls.push(block);
            await send({ type: "tool_call", id: block.id, name: block.name, args: block.input });
          }
        }

        if (blockingToolCalls.length === 0) break;

        // Execute each tool and append the results to the conversation.
        const toolResultContent: any[] = [];
        for (const call of blockingToolCalls) {
          try {
            const result = await executeTool(call.name, call.input, {
              userId: user.id,
              role: audience,
              memberId: user.memberId ?? undefined,
            });
            executedToolCalls.push({ name: call.name, args: call.input, result });
            await send({ type: "tool_result", id: call.id, name: call.name, value: result });
            toolResultContent.push({
              type: "tool_result",
              tool_use_id: call.id,
              content: JSON.stringify(result),
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : "tool failed";
            await send({ type: "tool_error", id: call.id, name: call.name, error: message });
            toolResultContent.push({
              type: "tool_result",
              tool_use_id: call.id,
              is_error: true,
              content: message,
            });
          }
        }

        convoMessages.push({ role: "assistant", content });
        convoMessages.push({ role: "user", content: toolResultContent });
      }

      await persistAssistantTurn(conversationId, finalText, executedToolCalls, {}, model);
      await send({ type: "done", conversationId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "assistant failed";
      logger.error({ err: message, conversationId }, "assistant chat failed");
      await send({ type: "error", message });
    }
  });
});

// GET /assistant/conversations — list caller's past conversations
assistant.get("/conversations", async (c) => {
  const user = c.get("user");
  const list = await prisma.assistantConversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  return c.json({ success: true, data: list });
});

// GET /assistant/conversations/:id — full message history
assistant.get("/conversations/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const convo = await prisma.assistantConversation.findFirst({
    where: { id, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!convo) return c.json({ success: false, message: "Not found" }, 404);
  return c.json({ success: true, data: convo });
});

// DELETE /assistant/conversations/:id
assistant.delete("/conversations/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  await prisma.assistantConversation.deleteMany({ where: { id, userId: user.id } });
  return c.json({ success: true });
});

// GET /assistant/tools — introspection: what tools can I call right now?
assistant.get("/tools", async (c) => {
  const user = c.get("user");
  const audience = user.role as AssistantAudience;
  return c.json({
    success: true,
    data: toolsForAudience(audience).map((t) => ({
      name: t.name,
      description: t.description,
      dangerous: t.dangerous ?? false,
    })),
  });
});

export { assistant as assistantRoutes };
