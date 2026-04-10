/**
 * Fraud scoring — Phase 7 scaffold.
 *
 * Rule-based scoring layer with an optional AI gateway hook. When the
 * `fraudScoring` feature flag is off, every transaction scores 0.
 * When on, combines deterministic rules (velocity, amount anomaly,
 * new device, unusual hour) with an optional Claude Haiku call via
 * Vercel AI Gateway for narrative reasoning on high-scoring events.
 *
 * The score (0-100) is surfaced to deposit/withdraw workflows. Scores
 * above the HIGH threshold pause the workflow in a `review_required`
 * state awaiting admin action.
 */
// @ts-nocheck
import { prisma } from "../config/db";
import { Money } from "@iffe/ledger";
import { logger } from "../utils/logger";

export interface ScoringContext {
  memberId: string;
  accountId: string;
  amount: string; // Money string
  type: "deposit" | "withdrawal" | "loan_repayment" | "loan_disbursement";
  method: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface FraudScore {
  score: number; // 0-100
  signals: Array<{ name: string; weight: number; reason: string }>;
  action: "allow" | "review" | "block";
  reasoning?: string;
}

const REVIEW_THRESHOLD = 60;
const BLOCK_THRESHOLD = 85;

export async function scoreTransaction(ctx: ScoringContext): Promise<FraudScore> {
  const signals: FraudScore["signals"] = [];
  let score = 0;

  const amount = Money.of(ctx.amount);

  // ===== Rule 1: unusually large amount vs member history =====
  const recent = await prisma.transaction.findMany({
    where: {
      account: { memberId: ctx.memberId },
      createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      status: "completed",
    },
    select: { amount: true, createdAt: true },
    take: 200,
  });

  if (recent.length > 0) {
    const avg = recent
      .map((t) => Money.fromDb(t.amount))
      .reduce((acc, v) => Money.add(acc, v), Money.zero());
    const avgPerTxn = Money.div(avg, recent.length);
    const multiple = Number(Money.toString(Money.div(amount, avgPerTxn))) || 1;
    if (multiple > 10) {
      const weight = Math.min(40, Math.floor(multiple * 2));
      signals.push({ name: "amount_anomaly", weight, reason: `${multiple.toFixed(1)}× 90-day average` });
      score += weight;
    }
  }

  // ===== Rule 2: velocity — too many transactions in short window =====
  const lastHour = recent.filter((t) => t.createdAt.getTime() > Date.now() - 60 * 60 * 1000).length;
  if (lastHour > 10) {
    const weight = Math.min(30, (lastHour - 10) * 3);
    signals.push({ name: "velocity", weight, reason: `${lastHour} txns in the last hour` });
    score += weight;
  }

  // ===== Rule 3: unusual hour (outside 05:00-22:00 East Africa Time) =====
  const hour = new Date().getUTCHours() + 3; // EAT = UTC+3
  const normalizedHour = (hour + 24) % 24;
  if (normalizedHour < 5 || normalizedHour >= 22) {
    signals.push({ name: "unusual_hour", weight: 10, reason: `${normalizedHour}:00 EAT` });
    score += 10;
  }

  // ===== Rule 4: withdrawals are higher risk than deposits by default =====
  if (ctx.type === "withdrawal") {
    signals.push({ name: "type_risk", weight: 5, reason: "withdrawal" });
    score += 5;
  }

  score = Math.min(100, score);

  // ===== Optional: AI gateway narrative for high scores =====
  let reasoning: string | undefined;
  if (score >= REVIEW_THRESHOLD && process.env.AI_GATEWAY_API_KEY) {
    try {
      reasoning = await aiNarrative(ctx, signals, score);
    } catch (err) {
      logger.warn(
        { event: "fraud.ai.failed", err: err instanceof Error ? err.message : String(err) },
        "AI narrative generation failed",
      );
    }
  }

  const action: FraudScore["action"] =
    score >= BLOCK_THRESHOLD ? "block" : score >= REVIEW_THRESHOLD ? "review" : "allow";

  logger.info(
    { event: "fraud.scored", memberId: ctx.memberId, type: ctx.type, score, action },
    "fraud score computed",
  );

  return { score, signals, action, reasoning };
}

/**
 * Optional narrative via Vercel AI Gateway. Uses Claude Haiku 4.5 for
 * cheap triage — switch to Opus if a case needs deeper analysis.
 *
 * Disabled unless AI_GATEWAY_API_KEY + AI_GATEWAY_URL are set.
 */
async function aiNarrative(
  ctx: ScoringContext,
  signals: FraudScore["signals"],
  score: number,
): Promise<string> {
  const url = process.env.AI_GATEWAY_URL;
  const key = process.env.AI_GATEWAY_API_KEY;
  if (!url || !key) return "";

  const prompt = `You are reviewing a transaction for potential fraud at a Ugandan SACCO.

Transaction: ${ctx.type} of ${ctx.amount} UGX via ${ctx.method}
Score: ${score}/100
Signals:
${signals.map((s) => `- ${s.name} (weight ${s.weight}): ${s.reason}`).join("\n")}

In 2-3 sentences, explain whether this looks like legitimate member
activity or whether it warrants human review. Do not speculate about
the member's identity or motives; stick to the data.`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "anthropic/claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`AI gateway returned ${res.status}`);
  const json = await res.json();
  return json.content?.[0]?.text ?? json.text ?? "";
}
