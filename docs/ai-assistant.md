# AI Assistant & Real-time

Phase 8 introduces the IFFE SACCO assistant — a conversational layer
that answers member questions, triages admin investigations, and raises
actions for human confirmation without touching money directly.

## Architecture

```
Browser (AssistantChatWindow)
  │  POST /api/v1/assistant/chat  (SSE stream)
  ▼
Hono route assistant.routes.ts
  │  systemPromptFor(audience)
  │  toolsForAudience(audience)
  ▼
Vercel AI Gateway (default: anthropic/claude-haiku-4-5)
  │  tool_use content blocks
  ▼
assistant.service.ts registry → executeTool()
  │  Per-audience access check
  │  Zod input validation
  ▼
Existing ledger / loan / interest services
```

All tool calls are deterministic — the LLM describes what it wants to
do, the server decides whether to do it. Money-moving actions are
**always** queued via `raiseAction` for explicit human confirmation.

## Packages

| Package                                      | Purpose                                                          |
| -------------------------------------------- | ---------------------------------------------------------------- |
| `@iffe/assistant`                            | Prompts, tool schemas, types — no runtime deps on Prisma or Hono |
| `apps/api/src/services/assistant.service.ts` | Tool implementations (read-only over Prisma)                     |
| `apps/api/src/routes/assistant.routes.ts`    | Streaming chat endpoint + conversation CRUD                      |

## Endpoints

| Route                                 | Method | Notes                                                |
| ------------------------------------- | ------ | ---------------------------------------------------- |
| `/api/v1/assistant/chat`              | POST   | Streaming SSE. Body: `{ conversationId?, messages }` |
| `/api/v1/assistant/conversations`     | GET    | List caller's past conversations                     |
| `/api/v1/assistant/conversations/:id` | GET    | Full message history for one conversation            |
| `/api/v1/assistant/conversations/:id` | DELETE | Delete a conversation                                |
| `/api/v1/assistant/tools`             | GET    | Introspection: what tools can I call right now?      |

## Tools

### Member audience

- `getMyBalance(accountType?)` — caller's own account balances
- `getMyTransactions(limit, type, since)` — caller's own transaction history
- `getMyLoans(status)` — caller's own loans
- `checkLoanEligibility(amount, termMonths, type)` — eligibility check against SACCO rules
- `explainInterest(principal, annualRate, days)` — simple-interest calculator
- `raiseAction(action, details, summary)` — queue a deposit/withdraw/loan application for review (pending confirmation)
- `raiseWithHuman(urgency, category, message)` — escalate to human support

### Staff / chairman audience

All of the above plus:

- `lookupMember(query)` — find a member by id/name/email/phone
- `explainInterest(...)` — same calculator as members

### Admin audience

All of the above plus:

- `getTrialBalance(asOf?)` — ledger health snapshot
- `getAnomalyAlerts(status, limit)` — fraud scoring inbox

## Notifications

Three channels, one dispatcher (`notification.service.ts → notify()`):

- **In-app** — always written to the `notifications` table (bell icon)
- **Push** — Web Push via VAPID; subscribe with `usePushSubscription()`
- **Email** — Resend using the existing email.service.ts

User preferences live in `notification_preferences` and are checked
per-type (`notifyTransactionPosted`, `notifyLoanPaymentDue`, etc.).
Security alerts can be sent with `force: true` to bypass preferences.

## Real-time dashboard

Two shapes of the same data:

1. `/api/v1/realtime/dashboard/snapshot` — one-shot JSON, recommended
   for most cases. The UI polls every ~12s via `useDashboardStream()`
   when EventSource isn't available.
2. `/api/v1/realtime/dashboard/stream` — bounded SSE stream capped at
   240s (well under the Fluid Compute 300s function timeout). Emits
   an initial snapshot, updates every 10s, then closes cleanly with
   a `bye` event. The browser reconnects automatically per the SSE
   `retry:` directive.

The bounded-stream pattern is the right answer for serverless realtime
until the write path is wired to Vercel Queues or Upstash Redis
pub/sub for true event-driven fanout.

## Anomaly inbox

Fraud scoring (Phase 7) writes `AnomalyAlert` rows for any transaction
scoring above the REVIEW threshold. Phase 8 adds the admin inbox:

- `GET /api/v1/anomaly-inbox?status=open` — list alerts (admin/chairman)
- `GET /api/v1/anomaly-inbox/:id` — detail
- `POST /api/v1/anomaly-inbox/:id/reviewing` — claim for triage
- `POST /api/v1/anomaly-inbox/:id/resolve` — mark legit or fraud with note (audited)

## Environment

```bash
# AI Gateway — activates the assistant. Without these, /chat returns a stub.
AI_GATEWAY_URL=https://gateway.ai.vercel.com/anthropic
AI_GATEWAY_API_KEY=<from-vercel-ai-gateway>
ASSISTANT_MODEL=anthropic/claude-haiku-4-5-20251001

# Web Push — activates push delivery. Without these, notifications still
# land in the in-app bell and email channels.
VAPID_PUBLIC_KEY=<base64url>
VAPID_PRIVATE_KEY=<base64url>
VAPID_SUBJECT="mailto:admin@sacco.example.org"

# Human escalation contact surfaced in raiseWithHuman responses
SUPPORT_PHONE="+256 700 000 000"
SUPPORT_EMAIL="support@sacco.example.org"
```

Generate VAPID keys once with:

```bash
npx web-push generate-vapid-keys
```

## Safety

- **Money-moving actions go through `raiseAction`**, never directly.
  The tool returns a `pending_confirmation` card the UI renders as a
  "tap to confirm" card; only on confirmation does the app submit
  to the normal deposit/withdraw/loan workflows.
- **Tool access control** is enforced per audience in the assistant
  service; requests for disallowed tools return a 403 and are logged.
- **All assistant messages are persisted**, which means PII can end up
  in the conversation. The GDPR export/delete endpoints (Phase 7)
  include assistant conversations in the dump and redact them on
  delete.
- **Zod input validation** on every tool catches schema mismatches
  before any DB call.
- **Guardrails in the system prompt** instruct the model never to
  expose other members' data and always to use tools instead of
  guessing numbers.
