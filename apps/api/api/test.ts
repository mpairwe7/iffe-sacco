export default function handler(req: any, res: any) {
  return res.json({ ok: true, time: new Date().toISOString() });
}
