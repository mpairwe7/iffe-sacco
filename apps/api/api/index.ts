export default function handler(req: any, res: any) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/v1/health" || url.pathname === "/api") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

    if (req.method === "OPTIONS") return res.status(204).end();
    return res.json({ status: "ok", time: new Date().toISOString(), path: url.pathname });
  }

  res.status(404).json({ success: false, message: "Route not found" });
}
