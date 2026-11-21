// Functional browser smoke test. Visual QA uses the unmodified Taste scripts.
// Runs only against a local Expo server with an isolated, disposable profile.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";

const origin = process.env.WAITER_TEST_URL || "http://127.0.0.1:8094";
const development = process.argv.includes("--development");
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const chrome = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/chromium",
].find((p) => p && fs.existsSync(p));
assert.ok(chrome, "Chrome/Edge required; set CHROME_PATH");
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "restosphere-waiter-test-"));
const child = spawn(
  chrome,
  [
    "--headless=new",
    `--user-data-dir=${profile}`,
    "--remote-debugging-port=0",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-gpu",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "about:blank",
  ],
  { stdio: "ignore", windowsHide: true },
);
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
try {
  let port;
  for (let i = 0; i < 150 && !port; i++) {
    try {
      port = parseInt(fs.readFileSync(path.join(profile, "DevToolsActivePort"), "utf8"));
    } catch {
      /* Chrome starting */
    }
    if (!port) await pause(100);
  }
  assert.ok(port, "Chrome did not start");
  const target = await (
    await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })
  ).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let sequence = 0;
  const waiting = new Map();
  const errors = [];
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const pending = waiting.get(message.id);
      waiting.delete(message.id);
      if (message.error) pending?.reject(new Error(message.error.message));
      else pending?.resolve(message.result);
    } else if (message.method === "Runtime.exceptionThrown")
      errors.push(
        message.params.exceptionDetails.exception?.description ||
          message.params.exceptionDetails.text,
      );
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++sequence;
      waiting.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails)
      throw new Error(
        result.exceptionDetails.exception?.description || result.exceptionDetails.text,
      );
    return result.result?.value;
  };
  const until = async (expression, label) => {
    for (let i = 0; i < 150; i++) {
      try {
        if (await evaluate(expression)) return;
      } catch {
        /* route is loading */
      }
      await pause(200);
    }
    throw new Error(`Timeout: ${label}\n${await evaluate("document.body.innerText")}`);
  };
  const click = async (label) => {
    const action = `(() => { const label = ${JSON.stringify(label)}; const el = [...document.querySelectorAll('[role="button"],button,a')].find(e => e.getClientRects().length && (e.getAttribute('aria-label') === label || e.innerText.trim() === label)); if (!el) return false; if (el.getAttribute('aria-disabled') === 'true' || el.disabled) throw new Error('Disabled: ' + label); el.scrollIntoView({block:'center'}); el.click(); return true; })()`;
    await until(action, `click ${label}`);
    await pause(150);
  };
  const input = async (label, value) => {
    await until(
      `document.querySelector('input[aria-label=' + JSON.stringify(${JSON.stringify(label)}) + '],textarea[aria-label=' + JSON.stringify(${JSON.stringify(label)}) + ']') !== null`,
      `input ${label}`,
    );
    await evaluate(
      `(() => { const el = document.querySelector('input[aria-label=' + JSON.stringify(${JSON.stringify(label)}) + '],textarea[aria-label=' + JSON.stringify(${JSON.stringify(label)}) + ']'); if (!el) throw new Error('Missing input'); const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', {bubbles:true})); })()`,
    );
  };
  const saved = () => evaluate("JSON.parse(localStorage.getItem('restosphere.staff.demo.v1'))");
  const route = async (pathname) => {
    await send("Page.navigate", { url: `${origin}${pathname}` });
    await pause(300);
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await route("/login");
  await click("Điền tài khoản phục vụ");
  await click("Đăng nhập");
  await until(
    "location.pathname === '/waiter/overview' && document.body.innerText.includes('Bàn cần tiếp nhận')",
    "waiter login and routing",
  );
  console.log("PASS login → waiter overview");
  const initial = await saved();
  const sessionId = initial.tableSessions.find((s) => s.tableId === "A03").id;
  await click("Mở bàn A03, Chờ tiếp nhận");
  await click("Tiếp nhận phục vụ bàn");
  await until(
    `JSON.parse(localStorage.getItem('restosphere.staff.demo.v1')).tableSessions.some(s => s.id === ${JSON.stringify(sessionId)} && s.acceptedAt)`,
    "accept handover",
  );
  await click("Gọi món cho bàn");
  await input("Tìm kiếm", "com chien");
  await until(
    "document.body.innerText.includes('Cơm chiên hải sản') && !document.body.innerText.includes('Bò lúc lắc')",
    "accent-insensitive search",
  );
  await click("Thêm Cơm chiên hải sản, 0 phần trong giỏ");
  await click("Xem giỏ và ghi chú món");
  await click("Tăng số lượng Cơm chiên hải sản");
  await input("Ghi chú Cơm chiên hải sản", "Không cay, không hành");
  await click("Gửi xuống bếp");
  await click("Xác nhận");
  await until(
    "location.pathname === '/waiter/progress' && document.body.innerText.includes('Đã gửi bếp')",
    "submit draft",
  );
  let snapshot = await saved();
  const order = snapshot.orders.find((o) => o.sessionId === sessionId);
  const item = snapshot.orderItems.find((i) => i.orderId === order.id);
  assert.equal(item.quantity, 2);
  assert.equal(item.note, "Không cay, không hành");
  assert.equal(item.status, "SUBMITTED");
  assert.equal(snapshot.drafts.filter((d) => d.sessionId === sessionId).length, 0);
  console.log("PASS accept → menu search → cart quantity and note → submit");
  await route("/reception/overview");
  await until(
    "location.pathname.startsWith('/waiter') && document.body.innerText.includes('Tổng quan')",
    "cross-role protected route",
  );
  await route("/waiter/dev-workflow");
  if (development) {
    await click("Bếp tiếp nhận Cơm chiên hải sản, bàn A03");
    await click("Bếp hoàn thành Cơm chiên hải sản, bàn A03");
    await route(`/waiter/progress?sessionId=${sessionId}`);
    await click("Xác nhận đã phục vụ");
    await route(`/waiter/payment?sessionId=${sessionId}`);
    await click("Gửi yêu cầu thanh toán");
    await click("Xác nhận");
    await until(
      `JSON.parse(localStorage.getItem('restosphere.staff.demo.v1')).bills.some(b => b.sessionId === ${JSON.stringify(sessionId)} && b.status === 'PAYMENT_REQUESTED')`,
      "payment request",
    );
    await route("/waiter/dev-workflow");
    await click("Thu ngân xác nhận bàn A03");
    await until(
      `JSON.parse(localStorage.getItem('restosphere.staff.demo.v1')).bills.some(b => b.sessionId === ${JSON.stringify(sessionId)} && b.status === 'PAID')`,
      "cashier paid event",
    );
    assert.equal((await saved()).tables.find((t) => t.id === "A03").status, "OCCUPIED");
    console.log(
      "PASS controlled kitchen → READY → served → payment request → cashier PAID, table still OCCUPIED",
    );
  } else {
    await until("location.pathname !== '/waiter/dev-workflow'", "production mock-tool guard");
    console.log("PASS receptionist and production development-tool guards");
  }
  await route("/waiter/ready");
  await until("document.body.innerText.includes('Bò lúc lắc')", "ready item");
  await click("Xác nhận đã phục vụ");
  await click("Xác nhận");
  await until(
    "document.body.innerText.includes('Đã mang hết món sẵn sàng')",
    "ready list synchronization",
  );
  console.log("PASS ready → served → ready list empty");
  const finishSessionId = development ? sessionId : "waiter-s2";
  const finishTableId = development ? "A03" : "G05";
  await route(`/waiter/finish?sessionId=${finishSessionId}`);
  await click("Xác nhận khách đã rời bàn");
  await click("Xác nhận");
  await until("document.body.innerText.includes('Xác nhận bàn đã dọn xong')", "guest left");
  snapshot = await saved();
  assert.equal(snapshot.tables.find((t) => t.id === finishTableId).status, "CLEANING");
  await click("Xác nhận bàn đã dọn xong");
  await click("Xác nhận");
  await until("document.body.innerText.includes('Đã hoàn tất phục vụ lúc')", "cleaned");
  snapshot = await saved();
  assert.equal(snapshot.tables.find((t) => t.id === finishTableId).status, "AVAILABLE");
  await route("/waiter/history");
  await until(
    `document.body.innerText.includes(${JSON.stringify(`Bàn ${finishTableId}`)})`,
    "service history",
  );
  console.log("PASS paid table → explicit departure → cleaning → available → history");
  await route("/waiter/profile");
  await click("Đăng xuất");
  await click("Xác nhận");
  await until("location.pathname === '/login'", "logout routing");
  await click("Điền tài khoản lễ tân");
  await click("Đăng nhập");
  await until(
    "location.pathname === '/reception/overview'",
    "receptionist login remains operational",
  );
  assert.equal((await saved()).session.role, "RECEPTIONIST");
  assert.deepEqual(errors, []);
  console.log("PASS logout and receptionist login; no browser runtime exceptions");
} finally {
  socket?.close();
  if (child.exitCode == null) {
    if (process.platform === "win32") {
      try {
        execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      } catch {
        child.kill();
      }
    } else child.kill();
  }
  // Leave the isolated OS-temp profile for diagnostics; never touch user profiles.
}
