export const config = { runtime: "nodejs" };

export default function handler(_req: Request) {
  return new Response(
    JSON.stringify({ ok: true, node: process.version, hasDb: !!process.env.DATABASE_URL }),
    { headers: { "content-type": "application/json" } }
  );
}
