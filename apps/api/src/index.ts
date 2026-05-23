/**
 * IFFE Bbenhe API — Bun Server Entry Point
 * For local development: `bun run --hot src/index.ts`
 */
// @ts-nocheck
import { app } from "./app";

const port = Number(process.env.PORT || 4000);

console.log(`
  ╔══════════════════════════════════════╗
  ║  IFFE Bbenhe API Server              ║
  ║  Port: ${port}                         ║
  ║  Env:  ${(process.env.NODE_ENV || "development").padEnd(28)}║
  ╚══════════════════════════════════════╝
`);

export default {
  port,
  fetch: app.fetch,
};
