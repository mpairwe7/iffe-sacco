let app;
let initError = null;

try {
  const mod = await import("./_app.js");
  app = mod.app;
} catch (e) {
  initError = { message: e.message, stack: e.stack?.split("\n").slice(0, 5) };
}

export default async function handler(req, res) {
  if (!app) {
    res.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
    return res.end(JSON.stringify({ ok: false, initError }));
  }

  const proto = req.headers["x-forwarded-proto"] || "https";
  const url = `${proto}://${req.headers.host}${req.url}`;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === "string") headers.set(k, v);
  }

  let body = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (chunks.length) body = Buffer.concat(chunks);
  }

  try {
    const request = new Request(url, { method: req.method, headers, body });
    const response = await app.fetch(request);
    const resHeaders = {};
    response.headers.forEach((v, k) => { resHeaders[k] = v; });
    res.writeHead(response.status, resHeaders);
    res.end(await response.text());
  } catch (e) {
    res.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
    res.end(JSON.stringify({ ok: false, error: e.message, stack: e.stack?.split("\n").slice(0, 5) }));
  }
}
