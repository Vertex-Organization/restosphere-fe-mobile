// Isolated screenshot origin. Never adds authentication bypasses to application code.
import http from "node:http";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createMockState, DEMO_STAFF } = require("../.cache/tests/mocks/demo-data.js");
const { DEMO_WAITER } = require("../.cache/tests/mocks/waiter-data.js");
const port = Number(process.env.UI_PREVIEW_PORT || 8095);
const upstreamOrigin = process.env.UI_PREVIEW_UPSTREAM || "http://127.0.0.1:8094";
http.createServer(async (req, res) => {
  try {
    const forwardedHeaders = Object.fromEntries(Object.entries(req.headers).filter(([key]) => !["host", "connection", "content-length"].includes(key)));
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const upstream = await fetch(new URL(req.url, upstreamOrigin), {
      redirect: "manual", method: req.method, headers: forwardedHeaders,
      ...(chunks.length ? { body: Buffer.concat(chunks) } : {}),
    });
    const headers = Object.fromEntries(upstream.headers);
    delete headers["content-encoding"];
    delete headers["content-length"];
    let body = Buffer.from(await upstream.arrayBuffer());
    if ((headers["content-type"] || "").includes("text/html")) {
      const state = createMockState(new Date());
      state.session = { ...(req.url.startsWith("/reception") ? DEMO_STAFF : DEMO_WAITER) };
      state.waiterNotifications.forEach((n, i) => { if (i > 1) n.readBy.push(DEMO_WAITER.id); });
      state.drafts.push({ id: "visual-draft", sessionId: "waiter-s0", waiterId: DEMO_WAITER.id, menuItemId: "seafood-rice", quantity: 2, note: "Không cay" });
      const setup = `localStorage.setItem('restosphere.staff.demo.v1', ${JSON.stringify(JSON.stringify(state))});`;
      body = Buffer.from(body.toString().replace("<head>", `<head><script>${setup}</script>`));
    }
    res.writeHead(upstream.status, headers);
    res.end(body);
  } catch (error) { res.writeHead(502); res.end(String(error)); }
}).listen(port, "127.0.0.1", () => console.log(`UI review origin: http://127.0.0.1:${port}`));
