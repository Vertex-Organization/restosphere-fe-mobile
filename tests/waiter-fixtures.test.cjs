const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createMockState, restoreDemoState } = require("../.cache/tests/mocks/demo-data.js");
const { DEMO_WAITER, isValidServiceData } = require("../.cache/tests/mocks/waiter-data.js");
const { sessionItems } = require("../.cache/tests/features/waiter/selectors.js");

test("service demo fixtures respect table capacity and chronological transitions", () => {
  const state = createMockState(new Date("2026-11-11T12:00:00+07:00"));
  for (const session of state.tableSessions) {
    const table = state.tables.find((t) => t.id === session.tableId);
    const reservation = state.reservations.find((r) => r.id === session.reservationId);
    const bill = state.bills.find((b) => b.sessionId === session.id);
    assert.ok((reservation.actualGuests ?? reservation.guests) <= table.capacity);
    for (const item of sessionItems(state, session.id)) {
      if (item.readyAt) assert.ok(item.submittedAt <= item.readyAt);
      if (item.servedAt) {
        assert.ok(item.readyAt <= item.servedAt);
        if (bill.requestedAt) assert.ok(item.servedAt <= bill.requestedAt);
      }
    }
    if (bill.paidAt) assert.ok(bill.requestedAt <= bill.paidAt);
    if (session.guestLeftAt) assert.ok(bill.paidAt <= session.guestLeftAt);
    if (session.closedAt) assert.ok(session.guestLeftAt <= session.closedAt);
  }
});

const seafoodIds = ["grilled-shrimp", "steamed-crab", "grilled-squid", "grilled-fish"];
const migrationDate = new Date("2026-11-12T12:00:00+07:00");

function legacyCatalogState() {
  const state = createMockState(migrationDate);
  state.session = { ...DEMO_WAITER };
  state.menuCategories = state.menuCategories.filter((category) => category.id !== "seafood");
  state.menuItems = state.menuItems.filter((item) => !seafoodIds.includes(item.id));
  Object.assign(state.menuItems.find((item) => item.id === "seafood-rice"), {
    price: 117000, status: "SOLD_OUT", notes: "Hết nguyên liệu, giữ giá đã cập nhật trong ca.",
  });
  state.menuCategories.find((category) => category.id === "rice").name = "Cơm và mì tại bếp";
  state.menuCategories.push({ id: "staff-special", name: "Món riêng trong ca" });
  state.menuItems.push({ id: "staff-special-item", name: "Món riêng của bếp", price: 125000, categoryId: "staff-special", status: "AVAILABLE", notes: "Giữ nội dung đã lưu." });
  state.drafts.push({ id: "saved-draft", sessionId: "waiter-s0", waiterId: DEMO_WAITER.id, menuItemId: "water", quantity: 3, note: "Không lạnh, mang cùng món chính." });
  assert.ok(isValidServiceData(state), "the old catalog must be a valid saved state");
  return state;
}

test("restoring a valid old catalog adds seafood without overwriting the saved shift", () => {
  const saved = legacyCatalogState();
  const before = structuredClone(saved);
  const restored = restoreDemoState(saved, migrationDate);
  const fresh = createMockState(migrationDate);

  assert.ok(isValidServiceData(restored));
  assert.equal(restored.menuCategories.length, before.menuCategories.length + 1);
  assert.equal(restored.menuItems.length, before.menuItems.length + seafoodIds.length);
  assert.deepEqual(restored.menuCategories.find((category) => category.id === "seafood"), fresh.menuCategories.find((category) => category.id === "seafood"));
  for (const id of seafoodIds) {
    assert.deepEqual(restored.menuItems.find((item) => item.id === id), fresh.menuItems.find((item) => item.id === id));
  }
  for (const category of before.menuCategories) {
    assert.deepEqual(restored.menuCategories.find((item) => item.id === category.id), category);
  }
  for (const item of before.menuItems) {
    assert.deepEqual(restored.menuItems.find((restoredItem) => restoredItem.id === item.id), item, `preserve saved price, stock and notes for ${item.id}`);
  }
  for (const key of ["orders", "orderItems", "drafts", "bills", "tableSessions", "tables", "reservations", "waiterNotifications", "nextId"]) {
    assert.deepEqual(restored[key], before[key], `preserve ${key} rather than reseeding the shift`);
  }
});

test("catalog migration is idempotent and preserves existing seafood edits", () => {
  const restored = restoreDemoState(legacyCatalogState(), migrationDate);
  Object.assign(restored.menuItems.find((item) => item.id === "grilled-shrimp"), { price: 231000, status: "SOLD_OUT" });
  const snapshot = structuredClone(restored);
  // Go through the actual JSON persistence boundary on each launch.
  let reopened = restoreDemoState(JSON.parse(JSON.stringify(restored)), migrationDate);
  reopened = restoreDemoState(JSON.parse(JSON.stringify(reopened)), migrationDate);

  assert.ok(isValidServiceData(reopened));
  assert.deepEqual(JSON.parse(JSON.stringify(reopened)), JSON.parse(JSON.stringify(snapshot)));
  assert.equal(new Set(reopened.menuCategories.map((category) => category.id)).size, reopened.menuCategories.length);
  assert.equal(new Set(reopened.menuItems.map((item) => item.id)).size, reopened.menuItems.length);
});
