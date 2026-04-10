"use client";

/**
 * Assistant chat window — floating widget the member or staff uses to
 * talk to the AI. Streams via fetch + Response body reader, parses the
 * SSE-shaped `data:` lines coming from /api/v1/assistant/chat.
 *
 * This component is deliberately minimal: a list, a composer, and a
 * streaming message. Rich features (tool-call cards with Confirm
 * buttons, message history sidebar, conversation switcher) live in
 * follow-up components that consume the same hook.
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: Array<{ id: string; name: string; args: unknown; result?: unknown }>;
  streaming?: boolean;
}

export function AssistantChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    const value = input.trim();
    if (!value || busy) return;
    setInput("");
    setBusy(true);

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: value };
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      toolCalls: [],
      streaming: true,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const csrf = document.cookie
        .split("; ")
        .find((c) => c.startsWith("csrf-token="))
        ?.split("=")[1];

      const res = await fetch("/api/v1/assistant/chat", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        },
        body: JSON.stringify({ conversationId, messages: history }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`chat failed with ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        buffer += decoder.decode(chunk, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const block = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          for (const line of block.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload) continue;
            try {
              const event = JSON.parse(payload);
              if (event.type === "text") {
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: m.content + event.value } : m)),
                );
              } else if (event.type === "tool_call") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? {
                          ...m,
                          toolCalls: [...(m.toolCalls ?? []), { id: event.id, name: event.name, args: event.args }],
                        }
                      : m,
                  ),
                );
              } else if (event.type === "tool_result") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? {
                          ...m,
                          toolCalls: (m.toolCalls ?? []).map((tc) =>
                            tc.id === event.id ? { ...tc, result: event.value } : tc,
                          ),
                        }
                      : m,
                  ),
                );
              } else if (event.type === "done") {
                setConversationId(event.conversationId);
                setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? { ...m, streaming: false } : m)));
              } else if (event.type === "error") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, content: `Sorry, something went wrong: ${event.message}`, streaming: false }
                      : m,
                  ),
                );
              }
            } catch {
              // ignore malformed line
            }
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "network error";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: `Sorry, something went wrong: ${message}`, streaming: false } : m,
        ),
      );
    } finally {
      setBusy(false);
    }
  }, [busy, conversationId, input, messages]);

  return (
    <section
      aria-label="SACCO assistant"
      className="flex h-[540px] w-[360px] flex-col rounded-lg border bg-background shadow-xl"
    >
      <header className="border-b px-4 py-3 text-sm font-semibold">SACCO Assistant</header>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
        {messages.length === 0 && (
          <p className="text-muted-foreground">
            Ask about your balance, loans, or upcoming payments. I can also raise requests to a human.
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>
      <form
        className="flex items-center gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label htmlFor="assistant-input" className="sr-only">
          Message
        </label>
        <input
          id="assistant-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything…"
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          disabled={busy}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {message.content || (message.streaming ? "…" : "")}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1 border-t border-current/10 pt-2 text-xs opacity-80">
            {message.toolCalls.map((tc) => (
              <div key={tc.id}>
                <span className="font-semibold">{tc.name}</span>
                {tc.result != null ? " ✓" : " …"}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
