const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createMockState, DEMO_STAFF, restoreDemoState } = require("../.cache/tests/mocks/demo-data.js");
const { DEMO_WAITER, OTHER_WAITER, emptyServiceData } = require("../.cache/tests/mocks/waiter-data.js");
const { executeWaiterCommand: execute } = require("../.cache/tests/features/waiter/commands.js");
const { executeCommand: reception } = require("../.cache/tests/features/reservations/commands.js");
const { applyMockServiceEvent: event } = require("../.cache/tests/mocks/service-workflow.js");
const { mockAuthenticationRepository: auth } = require("../.cache/tests/mocks/auth-repository.js");
const { workspaceHref } = require("../.cache/tests/features/auth/roles.js");
const { WAITER_PERMISSIONS, hasPermission } = require("../.cache/tests/features/auth/permissions.js");
const selectors = require("../.cache/tests/features/waiter/selectors.js");
const { normalizeSearch } = require("../.cache/tests/utils/search.js");
const now = new Date("2026-11-11T12:00:00+07:00");
const seed = () => ({ ...createMockState(now), session: { ...DEMO_WAITER } });
const run = (s, c) => execute(s, c, now);
const mock = (s, e) => event(s, e, now);
const pendingId = (s) => s.tableSessions.find((t) => t.tableId === "A03").id;
function accepted() { const s = seed(); return run(s, { type: "accept", sessionId: pendingId(s) }); }
function withDraft() { const s = accepted(); return run(s, { type: "add-draft", sessionId: pendingId(s), menuItemId: "beef" }); }
function submitted() { const s = withDraft(); return run(s, { type: "submit", sessionId: pendingId(s) }); }
function served() {
  let s = submitted(); const item = selectors.sessionItems(s, pendingId(s))[0];
  s = mock(s, { type: "kitchen-accept", itemId: item.id });
  s = mock(s, { type: "kitchen-ready", itemId: item.id });
  return run(s, { type: "serve", sessionId: pendingId(s), itemId: item.id });
}
function requested() { const s = served(); return run(s, { type: "request-payment", sessionId: pendingId(s) }); }

test("WAITER login, role routing and known permissions", async () => {
  const staff = await auth.signIn("waiter", "123456");
  assert.equal(staff.id, DEMO_WAITER.id);
  assert.equal(workspaceHref(staff.role), "/waiter/overview");
  assert.equal(workspaceHref("RECEPTIONIST"), "/reception/overview");
  assert.equal(workspaceHref("KITCHEN"), "/login");
  assert.equal(workspaceHref(), "/login");
  for (const permission of WAITER_PERMISSIONS) assert.ok(hasPermission(staff, permission));
  await assert.rejects(auth.signIn("waiter", "wrong"));
});
test("every waiter command rejects unsigned and foreign roles", () => {
  const commands = [
    { type: "accept", sessionId: "waiter-s0" }, { type: "add-draft", sessionId: "waiter-s0", menuItemId: "water" },
    { type: "edit-draft", sessionId: "waiter-s0", draftId: "x", quantity: 1, note: "" },
    { type: "remove-draft", sessionId: "waiter-s0", draftId: "x" }, { type: "submit", sessionId: "waiter-s0" },
    { type: "serve", sessionId: "waiter-s0", itemId: "x" }, { type: "request-payment", sessionId: "waiter-s0" },
    { type: "guest-left", sessionId: "waiter-s0", confirmed: true }, { type: "clean", sessionId: "waiter-s0", confirmed: true },
    { type: "read-notification" },
  ];
  for (const role of [null, "RECEPTIONIST", "KITCHEN", "CASHIER", "MANAGER"]) {
    const s = seed(); s.session = role ? { ...DEMO_WAITER, role } : null;
    for (const c of commands) assert.throws(() => run(s, c), /không có quyền/);
    assert.equal(selectors.visibleSessions(s).length, 0);
  }
});
test("waiter cannot use receptionist commands or kitchen/cashier events as commands", () => {
  const s = seed();
  assert.throws(() => reception(s, { type: "handover", id: "r6" }, now), /không có quyền/);
  for (const type of ["kitchen-ready", "cashier-paid", "cancel", "discount"]) assert.throws(() => run(s, { type, sessionId: "waiter-s0" }), /không thuộc quyền/);
});
test("reception handover creates shared session and bill atomically", () => {
  let s = createMockState(now); s.session = { ...DEMO_STAFF };
  const before = s.tableSessions.length;
  s = reception(s, { type: "handover", id: "r6" }, now).state;
  const session = s.tableSessions.find((t) => t.reservationId === "r6");
  assert.equal(s.tableSessions.length, before + 1);
  assert.equal(session.tableId, "B01");
  assert.equal(session.waiterId, undefined);
  assert.equal(s.bills.find((b) => b.sessionId === session.id).status, "UNPAID");
  s.session = { ...DEMO_WAITER };
  s = run(s, { type: "accept", sessionId: session.id });
  assert.equal(s.tableSessions.find((t) => t.id === session.id).waiterId, DEMO_WAITER.id);
  assert.throws(() => run(s, { type: "accept", sessionId: session.id }));
});
test("cannot create guests, self assign an available table or order before acceptance", () => {
  const s = seed();
  assert.throws(() => run(s, { type: "accept", sessionId: "A01" }));
  assert.throws(() => run(s, { type: "add-draft", sessionId: pendingId(s), menuItemId: "water" }));
  const corrupt = seed(); corrupt.tables.find((t) => t.id === "A03").status = "AVAILABLE";
  assert.throws(() => run(corrupt, { type: "accept", sessionId: pendingId(corrupt) }));
});
test("other waiter cannot read or change an assigned session", () => {
  let s = accepted(); s.session = { ...OTHER_WAITER };
  const session = s.tableSessions.find((t) => t.tableId === "A03");
  assert.equal(selectors.canViewSession(s, session), false);
  assert.throws(() => run(s, { type: "add-draft", sessionId: session.id, menuItemId: "water" }), /không phụ trách/);
  assert.throws(() => run(s, { type: "accept", sessionId: session.id }));
});
test("search ignores Vietnamese accents, and categories filter independently", () => {
  const s = seed();
  assert.ok(s.menuItems.filter((m) => normalizeSearch(m.name).includes(normalizeSearch("com chien"))).some((m) => m.id === "seafood-rice"));
  assert.ok(s.menuItems.filter((m) => m.categoryId === "drink").every((m) => ["water", "peach-tea"].includes(m.id)));
});
test("draft quantities, notes and removal are persisted together", () => {
  let s = withDraft(); const sessionId = pendingId(s);
  s = run(s, { type: "add-draft", sessionId, menuItemId: "beef" });
  let d = selectors.sessionDrafts(s, sessionId)[0]; assert.equal(d.quantity, 2);
  s = run(s, { type: "edit-draft", sessionId, draftId: d.id, quantity: 3, note: "Không hành " });
  d = selectors.sessionDrafts(s, sessionId)[0]; assert.equal(d.note, "Không hành "); assert.equal(d.quantity, 3);
  const restored = restoreDemoState(JSON.parse(JSON.stringify(s)), now);
  assert.equal(selectors.sessionDrafts(restored, sessionId)[0].note, "Không hành ");
  s = run(s, { type: "remove-draft", sessionId, draftId: d.id });
  assert.equal(selectors.sessionDrafts(s, sessionId).length, 0);
});
test("invalid quantities and oversized notes fail without mutating state", () => {
  const s = withDraft(); const d = selectors.sessionDrafts(s, pendingId(s))[0]; const before = JSON.stringify(s);
  for (const quantity of [0, -1, 1.5, 100, NaN]) assert.throws(() => run(s, { type: "edit-draft", sessionId: pendingId(s), draftId: d.id, quantity, note: "" }));
  assert.throws(() => run(s, { type: "edit-draft", sessionId: pendingId(s), draftId: d.id, quantity: 1, note: "x".repeat(301) }));
  assert.equal(JSON.stringify(s), before);
});
test("empty cart and unavailable menu items cannot be submitted", () => {
  const s = accepted(); const sessionId = pendingId(s);
  assert.throws(() => run(s, { type: "submit", sessionId }), /trống/);
  for (const menuItemId of ["chicken", "old-pot", "missing"]) assert.throws(() => run(s, { type: "add-draft", sessionId, menuItemId }), /hết|ngừng/);
});
test("sellout between add and submit keeps draft and creates no partial order", () => {
  const s = withDraft(); const sessionId = pendingId(s);
  s.menuItems.find((m) => m.id === "beef").status = "SOLD_OUT";
  const orderCount = s.orders.length;
  assert.throws(() => run(s, { type: "submit", sessionId }), /hết|ngừng/);
  assert.equal(s.orders.length, orderCount); assert.equal(selectors.sessionDrafts(s, sessionId).length, 1);
});
test("submit snapshots name, price, quantity and note then clears only the sent draft", () => {
  let s = withDraft(); const sessionId = pendingId(s); const d = selectors.sessionDrafts(s, sessionId)[0];
  s = run(s, { type: "edit-draft", sessionId, draftId: d.id, quantity: 2, note: "Ít cay" });
  s = run(s, { type: "add-draft", sessionId: "waiter-s0", menuItemId: "water" });
  s = run(s, { type: "submit", sessionId });
  const item = selectors.sessionItems(s, sessionId)[0];
  assert.equal(item.status, "SUBMITTED"); assert.equal(item.note, "Ít cay"); assert.equal(item.quantity, 2);
  assert.equal(selectors.sessionDrafts(s, sessionId).length, 0);
  assert.equal(selectors.sessionDrafts(s, "waiter-s0").length, 1);
  s.menuItems.find((m) => m.id === "beef").price = 1;
  assert.equal(selectors.sessionTotal(s, sessionId), 330000);
  assert.throws(() => run(s, { type: "edit-draft", sessionId, draftId: item.id, quantity: 1, note: "" }));
});
test("calling more food appends a batch without overwriting earlier states", () => {
  let s = served(); const sessionId = pendingId(s); const first = selectors.sessionItems(s, sessionId)[0];
  s = run(s, { type: "add-draft", sessionId, menuItemId: "water" }); s = run(s, { type: "submit", sessionId });
  const items = selectors.sessionItems(s, sessionId);
  assert.equal(items.length, 2); assert.equal(items[0].status, "SERVED"); assert.equal(items[0].id, first.id); assert.equal(items[1].status, "SUBMITTED");
  assert.deepEqual(s.orders.filter((o) => o.sessionId === sessionId).map((o) => o.sequence), [1, 2]);
});
test("kitchen transitions are explicit and ordered, waiter can only serve READY", () => {
  let s = submitted(); const sessionId = pendingId(s); const itemId = selectors.sessionItems(s, sessionId)[0].id;
  const before = JSON.stringify(s); selectors.visibleSessions(s); selectors.sessionItems(s, sessionId); assert.equal(JSON.stringify(s), before);
  assert.throws(() => run(s, { type: "serve", sessionId, itemId }));
  assert.throws(() => mock(s, { type: "kitchen-ready", itemId }));
  s = mock(s, { type: "kitchen-accept", itemId }); assert.throws(() => run(s, { type: "serve", sessionId, itemId }));
  s = mock(s, { type: "kitchen-ready", itemId });
  assert.ok(selectors.visibleNotifications(s).some((n) => n.kind === "READY" && n.sessionId === sessionId));
  s = run(s, { type: "serve", sessionId, itemId }); assert.equal(selectors.sessionItems(s, sessionId)[0].status, "SERVED");
  assert.throws(() => run(s, { type: "serve", sessionId, itemId }));
});
test("cross-table serving is rejected", () => {
  const s = accepted(); const ready = selectors.sessionItems(s, "waiter-s0").find((i) => i.status === "READY");
  assert.throws(() => run(s, { type: "serve", sessionId: pendingId(s), itemId: ready.id }));
});
test("kitchen refusal requires a reason and excludes only the cancelled item from total", () => {
  let s = submitted(); const sessionId = pendingId(s); const itemId = selectors.sessionItems(s, sessionId)[0].id;
  assert.throws(() => mock(s, { type: "kitchen-reject", itemId, reason: "" }));
  s = mock(s, { type: "kitchen-reject", itemId, reason: "Hết nguyên liệu" });
  assert.equal(selectors.sessionTotal(s, sessionId), 0);
  assert.equal(selectors.sessionItems(s, sessionId)[0].cancellationReason, "Hết nguyên liệu");
  assert.ok(selectors.visibleNotifications(s).some((n) => n.kind === "REJECTED"));
  assert.throws(() => run(s, { type: "request-payment", sessionId }));
});
test("payment requires served items and no remaining draft", () => {
  let s = submitted(); const sessionId = pendingId(s);
  assert.throws(() => run(s, { type: "request-payment", sessionId }), /phục vụ hết/);
  s = served(); s = run(s, { type: "add-draft", sessionId, menuItemId: "water" });
  assert.throws(() => run(s, { type: "request-payment", sessionId }), /chưa gửi/);
});
test("requesting payment freezes ordering and does not confirm PAID", () => {
  const s = requested(); const sessionId = pendingId(s);
  assert.equal(selectors.sessionBill(s, sessionId).status, "PAYMENT_REQUESTED");
  assert.throws(() => run(s, { type: "add-draft", sessionId, menuItemId: "water" }));
  assert.throws(() => run(s, { type: "submit", sessionId }));
  assert.throws(() => run(s, { type: "request-payment", sessionId }));
  assert.throws(() => run(s, { type: "guest-left", sessionId, confirmed: true }));
});
test("cashier PAID retains guests and OCCUPIED table until explicit guest-left", () => {
  let s = requested(); const sessionId = pendingId(s); const billId = selectors.sessionBill(s, sessionId).id;
  s = mock(s, { type: "cashier-paid", billId });
  assert.equal(selectors.sessionBill(s, sessionId).status, "PAID");
  assert.equal(s.tables.find((t) => t.id === "A03").status, "OCCUPIED");
  assert.equal(s.tableSessions.find((t) => t.id === sessionId).guestLeftAt, undefined);
  assert.throws(() => mock(s, { type: "cashier-paid", billId }));
  assert.throws(() => run(s, { type: "add-draft", sessionId, menuItemId: "water" }));
});
test("finish requires confirmation and cleaning cannot skip guests leaving", () => {
  let s = requested(); const sessionId = pendingId(s); s = mock(s, { type: "cashier-paid", billId: selectors.sessionBill(s, sessionId).id });
  assert.throws(() => run(s, { type: "clean", sessionId, confirmed: true }));
  assert.throws(() => run(s, { type: "guest-left", sessionId, confirmed: false }));
  s = run(s, { type: "guest-left", sessionId, confirmed: true });
  assert.equal(s.tables.find((t) => t.id === "A03").status, "CLEANING");
  assert.equal(s.reservations.find((r) => r.id === "r7").status, "SEATED");
  assert.throws(() => run(s, { type: "clean", sessionId, confirmed: false }));
  s = run(s, { type: "clean", sessionId, confirmed: true });
  assert.equal(s.tables.find((t) => t.id === "A03").status, "AVAILABLE");
  assert.equal(s.reservations.find((r) => r.id === "r7").status, "COMPLETED");
  assert.ok(s.assignments.filter((a) => a.reservationId === "r7").every((a) => a.releasedAt));
  assert.ok(s.tableSessions.find((t) => t.id === sessionId).closedAt);
  assert.throws(() => run(s, { type: "clean", sessionId, confirmed: true }));
  assert.ok(s.notifications.some((n) => n.tableId === "A03" && n.title === "Bàn đã sẵn sàng"));
});
test("a second active turn prevents releasing a cleaned table", () => {
  const s = seed(); const clean = s.tableSessions.find((t) => t.tableId === "A04");
  s.tableSessions.push({ ...clean, id: "conflict" });
  assert.throws(() => run(s, { type: "clean", sessionId: clean.id, confirmed: true }), /lượt sử dụng khác/);
  assert.equal(s.tables.find((t) => t.id === "A04").status, "CLEANING");
});
test("notification reads are scoped and ready items disappear after serving", () => {
  let s = seed(); const ready = selectors.sessionItems(s, "waiter-s0").find((i) => i.status === "READY");
  s = run(s, { type: "serve", sessionId: "waiter-s0", itemId: ready.id });
  assert.equal(selectors.sessionItems(s, "waiter-s0").filter((i) => i.status === "READY").length, 0);
  s = run(s, { type: "read-notification" });
  assert.ok(selectors.visibleNotifications(s).every((n) => n.readBy.includes(DEMO_WAITER.id)));
  s.session = { ...OTHER_WAITER };
  assert.ok(selectors.visibleNotifications(s).every((n) => !n.readBy.includes(OTHER_WAITER.id)));
});
test("waiter session survives restore and old reception-only data migrates in place", () => {
  const s = withDraft();
  assert.equal(restoreDemoState(JSON.parse(JSON.stringify(s)), now).session.role, "WAITER");
  const legacy = JSON.parse(JSON.stringify(createMockState(now)));
  for (const key of Object.keys(emptyServiceData(DEMO_STAFF))) delete legacy[key];
  const restored = restoreDemoState(legacy, now);
  assert.deepEqual(restored.tables, legacy.tables);
  assert.deepEqual(restored.reservations, legacy.reservations);
  assert.ok(restored.tableSessions.some((t) => t.reservationId === "r7"));
  assert.equal(restored.orders.length, 0);
});
test("corrupt service storage is rejected, and stored elevated roles are never trusted", () => {
  const s = seed(); s.orderItems[0].quantity = -1;
  assert.throws(() => restoreDemoState(s, now), /không hợp lệ/);
  const spoofed = seed(); spoofed.session.role = "MANAGER";
  assert.equal(restoreDemoState(spoofed, now).session, null);
});
