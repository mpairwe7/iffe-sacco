export default function handler(req: any, res: any) {
  res.json({ ok: true, env: { hasDb: !!process.env.DATABASE_URL, node: process.version } });
}
