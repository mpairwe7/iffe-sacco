/**
 * Assistant types shared between server (tools) and client (UI).
 *
 * Keep this tiny — anything model-specific or provider-specific stays
 * on the server. The client should be provider-agnostic.
 */

export type AssistantRole = "user" | "assistant" | "system" | "tool";

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
  createdAt: string;
  toolCalls?: AssistantToolCall[];
}

export interface AssistantToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

export interface AssistantConversation {
  id: string;
  userId: string;
  title?: string;
  messages: AssistantMessage[];
  createdAt: string;
  updatedAt: string;
}

export type AssistantAudience = "member" | "admin" | "chairman" | "staff";

export interface AssistantContext {
  userId: string;
  role: AssistantAudience;
  memberId?: string;
  locale?: string;
}
