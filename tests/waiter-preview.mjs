// Isolated visual-review server: fixture authentication only on this origin.
// The application, role guards and the user's normal saved session stay intact.
import http from "node:http";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createMockState } = require("../.cache/tests/mocks/demo-data.js");
const { DEMO_WAITER } = require("../.cache/tests/mocks/waiter-data.js");
const server = http.createServer(async (req, res) => {
  try {
    const upstream = await fetch(new URL(req.url, "http://127.0.0.1:8094"), { redirect: "manual" });
    const headers = Object.fromEntries(upstream.headers);
    delete headers["content-encoding"];
    delete headers["content-length"];
    let body = Buffer.from(await upstream.arrayBuffer());
    if ((headers["content-type"] || "").includes("text/html")) {
      const state = createMockState(new Date());
      state.session = { ...DEMO_WAITER };
      // A persisted draft exercises cart/note UI without changing product fixtures.
      state.drafts.push({ id: "review-draft", sessionId: "waiter-s0", waiterId: DEMO_WAITER.id, menuItemId: "beef", quantity: 2, note: "Không hành, ít cay" });
      const setup = `if (!localStorage.getItem('restosphere.waiter.review.seed')) { localStorage.setItem('restosphere.staff.demo.v1', ${JSON.stringify(JSON.stringify(state))}); localStorage.setItem('restosphere.waiter.review.seed', '1'); }`;
      body = Buffer.from(body.toString().replace("<head>", `<head><script>${setup}</script>`));
    }
    res.writeHead(upstream.status, headers);
    res.end(body);
  } catch (error) {
    res.writeHead(502);
    res.end(String(error));
  }
});
server.listen(8093, "127.0.0.1", () => console.log("Waiter visual review: http://127.0.0.1:8093/waiter/overview"));
