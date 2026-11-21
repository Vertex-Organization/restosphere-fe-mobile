const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  createMockState,
  DEMO_STAFF,
  restoreDemoState,
} = require("../.cache/tests/tests/fixtures/demo-data.js");
const {
  DEMO_WAITER,
  OTHER_WAITER,
  emptyServiceData,
} = require("../.cache/tests/tests/fixtures/waiter-data.js");
const {
  executeWaiterCommand: execute,
} = require("../.cache/tests/tests/fixtures/waiter-commands.js");
const {
  executeCommand: reception,
} = require("../.cache/tests/tests/fixtures/reception-commands.js");
const {
  applyMockServiceEvent: event,
} = require("../.cache/tests/tests/fixtures/service-workflow.js");
const {
  mockAuthenticationRepository: auth,
} = require("../.cache/tests/tests/fixtures/auth-repository.js");
const { workspaceHref } = require("../.cache/tests/src/features/auth/roles.js");
const {
  WAITER_PERMISSIONS,
  hasPermission,
} = require("../.cache/tests/src/features/auth/permissions.js");
const selectors = require("../.cache/tests/src/features/waiter/selectors.js");
const { normalizeSearch } = require("../.cache/tests/src/utils/search.js");
const now = new Date("2026-11-11T12:00:00+07:00");
const seed = () => ({ ...createMockState(now), session: { ...DEMO_WAITER } });
const run = (s, c) => execute(s, c, now);
const mock = (s, e) => event(s, e, now);
const pendingId = (s) => s.tableSessions.find((t) => t.tableId === "A03").id;
function accepted() {
  const s = seed();
  return run(s, { type: "accept", sessionId: pendingId(s) });
}
function withDraft() {
  const s = accepted();
  return run(s, { type: "add-draft", sessionId: pendingId(s), menuItemId: "beef" });
}
function submitted() {
  const s = withDraft();
  return run(s, { type: "submit", sessionId: pendingId(s) });
}
function served() {
  let s = submitted();
  const item = selectors.sessionItems(s, pendingId(s))[0];
  s = mock(s, { type: "kitchen-accept", itemId: item.id });
  s = mock(s, { type: "kitchen-ready", itemId: item.id });
  return run(s, { type: "serve", sessionId: pendingId(s), itemId: item.id });
}
function requested() {
  const s = served();
  return run(s, { type: "request-payment", sessionId: pendingId(s) });
}

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
    { type: "accept", sessionId: "waiter-s0" },
    { type: "add-draft", sessionId: "waiter-s0", menuItemId: "water" },
    { type: "edit-draft", sessionId: "waiter-s0", draftId: "x", quantity: 1, note: "" },
    { type: "remove-draft", sessionId: "waiter-s0", draftId: "x" },
    { type: "submit", sessionId: "waiter-s0" },
    { type: "serve", sessionId: "waiter-s0", itemId: "x" },
    { type: "request-payment", sessionId: "waiter-s0" },
    { type: "guest-left", sessionId: "waiter-s0", confirmed: true },
    { type: "clean", sessionId: "waiter-s0", confirmed: true },
    { type: "read-notification" },
  ];
  for (const role of [null, "RECEPTIONIST", "KITCHEN", "CASHIER", "MANAGER"]) {
    const s = seed();
    s.session = role ? { ...DEMO_WAITER, role } : null;
    for (const c of commands) assert.throws(() => run(s, c), /không có quyền/);
    assert.equal(selectors.visibleSessions(s).length, 0);
  }
});
test("waiter cannot use receptionist commands or kitchen/cashier events as commands", () => {
  const s = seed();
  assert.throws(() => reception(s, { type: "handover", id: "r6" }, now), /không có quyền/);
  for (const type of ["kitchen-ready", "cashier-paid", "cancel", "discount"])
    assert.throws(() => run(s, { type, sessionId: "waiter-s0" }), /không thuộc quyền/);
});
test("reception handover creates shared session and bill atomically", () => {
  let s = createMockState(now);
  s.session = { ...DEMO_STAFF };
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
  const corrupt = seed();
  corrupt.tables.find((t) => t.id === "A03").status = "AVAILABLE";
  assert.throws(() => run(corrupt, { type: "accept", sessionId: pendingId(corrupt) }));
});
test("other waiter cannot read or change an assigned session", () => {
  let s = accepted();
  s.session = { ...OTHER_WAITER };
  const session = s.tableSessions.find((t) => t.tableId === "A03");
  assert.equal(selectors.canViewSession(s, session), false);
  assert.throws(
    () => run(s, { type: "add-draft", sessionId: session.id, menuItemId: "water" }),
    /không phụ trách/,
  );
  assert.throws(() => run(s, { type: "accept", sessionId: session.id }));
});
test("search ignores Vietnamese accents, and categories filter independently", () => {
  const s = seed();
  assert.ok(
    s.menuItems
      .filter((m) => normalizeSearch(m.name).includes(normalizeSearch("com chien")))
      .some((m) => m.id === "seafood-rice"),
  );
  assert.ok(
    s.menuItems
      .filter((m) => m.categoryId === "drink")
      .every((m) => ["water", "peach-tea"].includes(m.id)),
  );
});
test("draft quantities, notes and removal are persisted together", () => {
  let s = withDraft();
  const sessionId = pendingId(s);
  s = run(s, { type: "add-draft", sessionId, menuItemId: "beef" });
  let d = selectors.sessionDrafts(s, sessionId)[0];
  assert.equal(d.quantity, 2);
  s = run(s, { type: "edit-draft", sessionId, draftId: d.id, quantity: 3, note: "Không hành " });
  d = selectors.sessionDrafts(s, sessionId)[0];
  assert.equal(d.note, "Không hành ");
  assert.equal(d.quantity, 3);
  const restored = restoreDemoState(JSON.parse(JSON.stringify(s)), now);
  assert.equal(selectors.sessionDrafts(restored, sessionId)[0].note, "Không hành ");
  s = run(s, { type: "remove-draft", sessionId, draftId: d.id });
  assert.equal(selectors.sessionDrafts(s, sessionId).length, 0);
});
test("invalid quantities and oversized notes fail without mutating state", () => {
  const s = withDraft();
  const d = selectors.sessionDrafts(s, pendingId(s))[0];
  const before = JSON.stringify(s);
  for (const quantity of [0, -1, 1.5, 100, NaN])
    assert.throws(() =>
      run(s, { type: "edit-draft", sessionId: pendingId(s), draftId: d.id, quantity, note: "" }),
    );
  assert.throws(() =>
    run(s, {
      type: "edit-draft",
      sessionId: pendingId(s),
      draftId: d.id,
      quantity: 1,
      note: "x".repeat(301),
    }),
  );
  assert.equal(JSON.stringify(s), before);
});
test("empty cart and unavailable menu items cannot be submitted", () => {
  const s = accepted();
  const sessionId = pendingId(s);
  assert.throws(() => run(s, { type: "submit", sessionId }), /trống/);
  for (const menuItemId of ["chicken", "old-pot", "missing"])
    assert.throws(() => run(s, { type: "add-draft", sessionId, menuItemId }), /hết|ngừng/);
});
test("sellout between add and submit keeps draft and creates no partial order", () => {
  const s = withDraft();
  const sessionId = pendingId(s);
  s.menuItems.find((m) => m.id === "beef").status = "SOLD_OUT";
  const orderCount = s.orders.length;
  assert.throws(() => run(s, { type: "submit", sessionId }), /hết|ngừng/);
  assert.equal(s.orders.length, orderCount);
  assert.equal(selectors.sessionDrafts(s, sessionId).length, 1);
});
test("submit snapshots name, price, quantity and note then clears only the sent draft", () => {
  let s = withDraft();
  const sessionId = pendingId(s);
  const d = selectors.sessionDrafts(s, sessionId)[0];
  s = run(s, { type: "edit-draft", sessionId, draftId: d.id, quantity: 2, note: "Ít cay" });
  s = run(s, { type: "add-draft", sessionId: "waiter-s0", menuItemId: "water" });
  s = run(s, { type: "submit", sessionId });
  const item = selectors.sessionItems(s, sessionId)[0];
  assert.equal(item.status, "SUBMITTED");
  assert.equal(item.note, "Ít cay");
  assert.equal(item.quantity, 2);
  assert.equal(selectors.sessionDrafts(s, sessionId).length, 0);
  assert.equal(selectors.sessionDrafts(s, "waiter-s0").length, 1);
  s.menuItems.find((m) => m.id === "beef").price = 1;
  assert.equal(selectors.sessionTotal(s, sessionId), 330000);
  assert.throws(() =>
    run(s, { type: "edit-draft", sessionId, draftId: item.id, quantity: 1, note: "" }),
  );
});
test("calling more food appends a batch without overwriting earlier states", () => {
  let s = served();
  const sessionId = pendingId(s);
  const first = selectors.sessionItems(s, sessionId)[0];
  s = run(s, { type: "add-draft", sessionId, menuItemId: "water" });
  s = run(s, { type: "submit", sessionId });
  const items = selectors.sessionItems(s, sessionId);
  assert.equal(items.length, 2);
  assert.equal(items[0].status, "SERVED");
  assert.equal(items[0].id, first.id);
  assert.equal(items[1].status, "SUBMITTED");
  assert.deepEqual(
    s.orders.filter((o) => o.sessionId === sessionId).map((o) => o.sequence),
    [1, 2],
  );
});
test("kitchen transitions are explicit and ordered, waiter can only serve READY", () => {
  let s = submitted();
  const sessionId = pendingId(s);
  const itemId = selectors.sessionItems(s, sessionId)[0].id;
  const before = JSON.stringify(s);
  selectors.visibleSessions(s);
  selectors.sessionItems(s, sessionId);
  assert.equal(JSON.stringify(s), before);
  assert.throws(() => run(s, { type: "serve", sessionId, itemId }));
  assert.throws(() => mock(s, { type: "kitchen-ready", itemId }));
  s = mock(s, { type: "kitchen-accept", itemId });
  assert.throws(() => run(s, { type: "serve", sessionId, itemId }));
  s = mock(s, { type: "kitchen-ready", itemId });
  assert.ok(
    selectors.visibleNotifications(s).some((n) => n.kind === "READY" && n.sessionId === sessionId),
  );
  s = run(s, { type: "serve", sessionId, itemId });
  assert.equal(selectors.sessionItems(s, sessionId)[0].status, "SERVED");
  assert.throws(() => run(s, { type: "serve", sessionId, itemId }));
});
test("cross-table serving is rejected", () => {
  const s = accepted();
  const ready = selectors.sessionItems(s, "waiter-s0").find((i) => i.status === "READY");
  assert.throws(() => run(s, { type: "serve", sessionId: pendingId(s), itemId: ready.id }));
});
test("waiter request-cancel emits CANCEL_ITEM and manager decision applies cancellation", () => {
  let s = submitted();
  const sessionId = pendingId(s);
  const itemId = selectors.sessionItems(s, sessionId)[0].id;
  assert.throws(
    () => run(s, { type: "request-cancel", sessionId, itemId, reason: "Khách đổi ý" }),
    /đang chế biến/,
  );
  s = mock(s, { type: "kitchen-accept", itemId });
  assert.throws(
    () => run(s, { type: "request-cancel", sessionId, itemId, reason: "ngắn" }),
    /ký tự/,
  );
  s = run(s, { type: "request-cancel", sessionId, itemId, reason: "Khách đổi ý sang món khác" });
  assert.equal(s.requests.length, 1);
  assert.equal(s.requests[0].status, "PENDING");
  assert.throws(
    () => run(s, { type: "request-cancel", sessionId, itemId, reason: "Khách đổi ý lần hai" }),
    /chờ duyệt/,
  );
  s = mock(s, {
    type: "manager-cancel-decision",
    requestId: s.requests[0].id,
    approve: true,
    reason: "Đồng ý cho hủy món",
  });
  assert.equal(selectors.sessionItems(s, sessionId)[0].status, "CANCELLED");
  assert.equal(s.requests[0].status, "APPROVED");
  assert.ok(selectors.visibleNotifications(s).some((n) => n.kind === "REQUEST_DECIDED"));
});

test("cancellation rejects foreign sessions, stale decisions and corrupt restored requests", () => {
  let s = seed();
  const sessionId = "waiter-s0";
  const item = selectors.sessionItems(s, sessionId).find((i) => i.status === "READY");
  const c = { type: "request-cancel", sessionId, itemId: item.id, reason: "Khách muốn đổi món" };
  assert.throws(() => run({ ...s, session: OTHER_WAITER }, c));
  assert.throws(() => run(s, { ...c, sessionId: pendingId(s) }));
  s = run(s, c);
  assert.equal(s.orderItems.find((i) => i.id === item.id).status, "READY");
  assert.equal(s.outbox[0].kind, "APPROVAL");
  assert.equal(restoreDemoState(JSON.parse(JSON.stringify(s)), now).requests[0].status, "PENDING");
  const rejected = mock(s, {
    type: "manager-cancel-decision",
    requestId: s.requests[0].id,
    approve: false,
    reason: "Món đã chuẩn bị xong",
  });
  assert.equal(rejected.orderItems.find((i) => i.id === item.id).status, "READY");
  assert.throws(() =>
    mock(rejected, {
      type: "manager-cancel-decision",
      requestId: s.requests[0].id,
      approve: true,
      reason: "Đồng ý hủy món",
    }),
  );
  const servedState = run(s, { type: "serve", sessionId, itemId: item.id });
  assert.throws(() =>
    mock(servedState, {
      type: "manager-cancel-decision",
      requestId: s.requests[0].id,
      approve: true,
      reason: "Đồng ý hủy món",
    }),
  );
  const broken = JSON.parse(JSON.stringify(s));
  broken.requests[0].targetId = "missing";
  assert.throws(() => restoreDemoState(broken, now));
});

test("kitchen refusal requires a reason and excludes only the rejected item from total", () => {
  let s = submitted();
  const sessionId = pendingId(s);
  const itemId = selectors.sessionItems(s, sessionId)[0].id;
  assert.throws(() => mock(s, { type: "kitchen-reject", itemId, reason: "" }));
  s = mock(s, { type: "kitchen-reject", itemId, reason: "Hết nguyên liệu" });
  assert.equal(selectors.sessionTotal(s, sessionId), 0);
  assert.equal(selectors.sessionItems(s, sessionId)[0].rejectionReason, "Hết nguyên liệu");
  assert.ok(selectors.visibleNotifications(s).some((n) => n.kind === "ITEM_REJECTED"));
  assert.throws(() => run(s, { type: "request-payment", sessionId }));
});
test("payment requires served items and no remaining draft", () => {
  let s = submitted();
  const sessionId = pendingId(s);
  assert.throws(() => run(s, { type: "request-payment", sessionId }), /phục vụ hết/);
  s = served();
  s = run(s, { type: "add-draft", sessionId, menuItemId: "water" });
  assert.throws(() => run(s, { type: "request-payment", sessionId }), /chưa gửi/);
});
test("requesting payment freezes ordering and does not confirm PAID", () => {
  const s = requested();
  const sessionId = pendingId(s);
  assert.equal(selectors.sessionBill(s, sessionId).status, "PAYMENT_REQUESTED");
  assert.throws(() => run(s, { type: "add-draft", sessionId, menuItemId: "water" }));
  assert.throws(() => run(s, { type: "submit", sessionId }));
  assert.throws(() => run(s, { type: "request-payment", sessionId }));
  assert.throws(() => run(s, { type: "guest-left", sessionId, confirmed: true }));
});
test("waiter can withdraw payment request and cashier events update bill lifecycle", () => {
  let s = requested();
  const sessionId = pendingId(s);
  const bill = selectors.sessionBill(s, sessionId);
  assert.equal(bill.status, "PAYMENT_REQUESTED");
  assert.equal(bill.requestedAmount, selectors.sessionTotal(s, sessionId));
  s = run(s, { type: "withdraw-payment-request", sessionId });
  assert.equal(selectors.sessionBill(s, sessionId).status, "UNPAID");
  assert.equal(s.outbox[0].kind, "PAYMENT_REQUEST_WITHDRAWN");
  assert.equal(s.outbox[0].audience, "CASHIER");
  s = run(s, { type: "request-payment", sessionId });
  assert.equal(s.outbox[0].kind, "PAYMENT_REQUEST");
  assert.equal(s.outbox[0].audience, "CASHIER");
  s = mock(s, { type: "cashier-bill-updated", billId: bill.id });
  assert.ok(selectors.visibleNotifications(s).some((n) => n.kind === "BILL_UPDATED"));
  s = mock(s, { type: "cashier-return", billId: bill.id, reason: "Bàn cần kiểm tra lại món" });
  assert.equal(selectors.sessionBill(s, sessionId).status, "UNPAID");
  assert.ok(selectors.visibleNotifications(s).some((n) => n.kind === "PAYMENT_RETURNED"));
});

test("cashier PAID retains guests and OCCUPIED table until explicit guest-left", () => {
  let s = requested();
  const sessionId = pendingId(s);
  const billId = selectors.sessionBill(s, sessionId).id;
  s = mock(s, { type: "cashier-paid", billId });
  assert.equal(selectors.sessionBill(s, sessionId).status, "PAID");
  assert.equal(s.tables.find((t) => t.id === "A03").status, "OCCUPIED");
  assert.equal(s.tableSessions.find((t) => t.id === sessionId).guestLeftAt, undefined);
  assert.throws(() => mock(s, { type: "cashier-paid", billId }));
  assert.throws(() => run(s, { type: "add-draft", sessionId, menuItemId: "water" }));
});
test("finish requires confirmation and cleaning cannot skip guests leaving", () => {
  let s = requested();
  const sessionId = pendingId(s);
  s = mock(s, { type: "cashier-paid", billId: selectors.sessionBill(s, sessionId).id });
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
  const s = seed();
  const clean = s.tableSessions.find((t) => t.tableId === "A04");
  s.tableSessions.push({ ...clean, id: "conflict" });
  assert.throws(
    () => run(s, { type: "clean", sessionId: clean.id, confirmed: true }),
    /lượt sử dụng khác/,
  );
  assert.equal(s.tables.find((t) => t.id === "A04").status, "CLEANING");
});
test("notification reads are scoped and ready items disappear after serving", () => {
  let s = seed();
  const ready = selectors.sessionItems(s, "waiter-s0").find((i) => i.status === "READY");
  s = run(s, { type: "serve", sessionId: "waiter-s0", itemId: ready.id });
  assert.equal(
    selectors.sessionItems(s, "waiter-s0").filter((i) => i.status === "READY").length,
    0,
  );
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
  const s = seed();
  s.orderItems[0].quantity = -1;
  assert.throws(() => restoreDemoState(s, now), /không hợp lệ/);
  const spoofed = seed();
  spoofed.session.role = "MANAGER";
  assert.equal(restoreDemoState(spoofed, now).session, null);
});

test("kitchen incident event notifies the waiter with INCIDENT and validates description", () => {
  const s = submitted();
  const sessionId = pendingId(s);
  const itemId = selectors.sessionItems(s, sessionId)[0].id;
  assert.throws(() => mock(s, { type: "kitchen-incident", itemId, description: "ng" }));
  const next = mock(s, { type: "kitchen-incident", itemId, description: "Thiet bi gap su co" });
  assert.equal(next.waiterNotifications[0].kind, "INCIDENT");
  assert.equal(next.waiterNotifications[0].sessionId, sessionId);
  assert.equal(selectors.sessionItems(next, sessionId)[0].status, "SUBMITTED");
});
test("kitchen menu status event updates menu and notifies every waiter without a session", () => {
  const s = submitted();
  const menu = s.menuItems.find((m) => m.status === "AVAILABLE");
  const next = mock(s, { type: "kitchen-menu-status", menuItemId: menu.id, status: "SOLD_OUT" });
  assert.equal(next.menuItems.find((m) => m.id === menu.id).status, "SOLD_OUT");
  assert.equal(next.waiterNotifications[0].kind, "MENU_AVAILABILITY");
  assert.ok(selectors.visibleNotifications(next).some((n) => n.kind === "MENU_AVAILABILITY"));
  assert.throws(() =>
    mock(next, { type: "kitchen-menu-status", menuItemId: menu.id, status: "SOLD_OUT" }),
  );
  assert.throws(() =>
    run(next, { type: "add-draft", sessionId: pendingId(next), menuItemId: menu.id }),
  );
});
test("waiter priority request requires a reason, is sent once and reaches the kitchen outbox", () => {
  const s = submitted();
  const sessionId = pendingId(s);
  const orderId = s.orders.find((o) => o.sessionId === sessionId).id;
  assert.throws(() => run(s, { type: "request-priority", sessionId, orderId, reason: "ng" }));
  assert.throws(() =>
    run(s, { type: "request-priority", sessionId, orderId: "missing", reason: "Khach can di som" }),
  );
  const next = run(s, { type: "request-priority", sessionId, orderId, reason: "Khach can di som" });
  assert.equal(next.orders.find((o) => o.id === orderId).priority.reason, "Khach can di som");
  assert.equal(next.outbox[0].kind, "PRIORITY");
  assert.equal(next.outbox[0].audience, "KITCHEN");
  assert.throws(() =>
    run(next, { type: "request-priority", sessionId, orderId, reason: "Khach can di som" }),
  );
});
test("unaccepted handovers are visible only to waiters assigned to the same area", () => {
  const s = seed();
  const session = s.tableSessions.find((t) => t.tableId === "A03");
  assert.equal(s.tables.find((t) => t.id === "A03").areaId, "floor-1");
  assert.equal(selectors.canViewSession(s, session), true);
  assert.equal(selectors.canViewSession({ ...s, session: { ...OTHER_WAITER } }, session), false);
  assert.equal(
    selectors.canViewSession({ ...s, session: { ...OTHER_WAITER, areaId: undefined } }, session),
    true,
  );
  assert.ok(DEMO_WAITER.shift.includes("Tầng 1") && DEMO_WAITER.shiftId);
});
test("web reservation and manager exception events reach reception notifications with explicit kinds", () => {
  const s = seed();
  assert.throws(() =>
    mock(s, {
      type: "web-reservation",
      customer: "",
      phone: "0901234567",
      guests: 2,
      startsAt: now.toISOString(),
    }),
  );
  assert.throws(() =>
    mock(s, {
      type: "web-reservation",
      customer: "Khach",
      phone: "abc",
      guests: 2,
      startsAt: now.toISOString(),
    }),
  );
  const created = mock(s, {
    type: "web-reservation",
    customer: "Khach web",
    phone: "0901234567",
    guests: 2,
    startsAt: new Date(now.getTime() + 240 * 60000).toISOString(),
  });
  assert.equal(created.notifications[0].kind, "NEW_WEB_RESERVATION");
  assert.equal(created.reservations[0].source, "WEB");
  assert.equal(created.reservations[0].status, "PENDING");
  const rid = created.reservations[0].id;
  assert.throws(() =>
    mock(created, {
      type: "manager-exception-decision",
      reservationId: rid,
      approve: true,
      reason: "Dong y ngoai le",
    }),
  );
  const asked = reception(
    { ...created, session: { ...DEMO_STAFF } },
    { type: "request-exception", id: rid, reason: "Doan khach dong" },
    now,
  ).state;
  assert.throws(() =>
    mock(asked, {
      type: "manager-exception-decision",
      reservationId: rid,
      approve: true,
      reason: "ng",
    }),
  );
  const decided = mock(asked, {
    type: "manager-exception-decision",
    reservationId: rid,
    approve: true,
    reason: "Dong y ngoai le",
  });
  assert.equal(decided.notifications[0].kind, "REQUEST_DECIDED");
});
