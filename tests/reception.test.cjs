const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  createMockState,
  DEMO_STAFF,
  restoreDemoState,
} = require("../.cache/tests/mocks/demo-data.js");
const {
  executeCommand,
} = require("../.cache/tests/features/reservations/commands.js");
const rules = require("../.cache/tests/features/reservations/rules.js");
const { dayKey, addMinutes } = require("../.cache/tests/utils/dates.js");
const {
  mockAuthenticationRepository,
} = require("../.cache/tests/mocks/auth-repository.js");
const now = new Date("2026-11-11T12:00:00+07:00");
function seed() {
  return { ...createMockState(now), session: { ...DEMO_STAFF } };
}
function run(state, command, at = now) {
  return executeCommand(state, command, at).state;
}
function get(state, id) {
  return state.reservations.find((r) => r.id === id);
}
function input(overrides = {}) {
  return {
    customer: { name: "Khách thử", phone: "0912345678" },
    startsAt: addMinutes(now, 360).toISOString(),
    guests: 2,
    duration: 90,
    notes: "",
    specialRequests: "",
    ...overrides,
  };
}

test("đăng nhập đúng và sai mật khẩu", async () => {
  assert.equal(
    (await mockAuthenticationRepository.signIn("receptionist", "123456")).role,
    "RECEPTIONIST",
  );
  await assert.rejects(
    mockAuthenticationRepository.signIn("receptionist", "wrong"),
    /không đúng/,
  );
  await assert.rejects(
    mockAuthenticationRepository.signIn("manager", "123456"),
    /không đúng/,
  );
});
test("chặn mọi command khi chưa đăng nhập hoặc khác vai trò", () => {
  for (const role of [undefined, "WAITER", "KITCHEN", "CASHIER", "MANAGER"]) {
    const s = seed();
    s.session = role ? { ...DEMO_STAFF, role } : null;
    assert.throws(
      () => run(s, { type: "confirm", id: "r1" }),
      /không có quyền/,
    );
    assert.deepEqual(
      rules.getReservationActions(get(s, "r1"), now, role ?? "WAITER"),
      [],
    );
  }
});
test("tạo lịch PENDING, không tự xác nhận hoặc chiếm bàn", () => {
  const result = executeCommand(
    seed(),
    { type: "create", input: input() },
    now,
  );
  const r = get(result.state, result.reservationId);
  assert.equal(r.status, "PENDING");
  assert.equal(r.tableId, undefined);
  assert.equal(result.state.notifications[0].reservationId, r.id);
});
test("validation tên, phone, số khách, thời lượng, ngày quá khứ", () => {
  for (const bad of [
    input({ customer: { name: "", phone: "" } }),
    input({ customer: { name: "A", phone: "123" } }),
    input({ guests: 0 }),
    input({ guests: 2.5 }),
    input({ duration: 0 }),
    input({ startsAt: "invalid" }),
    input({ startsAt: addMinutes(now, -1).toISOString() }),
  ]) {
    assert.throws(() => run(seed(), { type: "create", input: bad }));
  }
});
test("xác nhận kiểm tra chỗ, giữ bàn; không xác nhận lần hai", () => {
  const before = seed();
  const after = run(before, { type: "confirm", id: "r1" });
  const r = get(after, "r1");
  assert.equal(r.status, "CONFIRMED");
  assert.ok(r.tableId);
  assert.equal(
    after.assignments.filter((a) => a.reservationId === r.id && !a.releasedAt)
      .length,
    1,
  );
  assert.equal(get(before, "r1").status, "PENDING");
  assert.throws(() => run(after, { type: "confirm", id: "r1" }));
});
test("không xác nhận lịch khi không còn khả năng tiếp nhận", () => {
  const s = seed();
  get(s, "r1").guests = 99;
  assert.equal(rules.canConfirmReservation(s, get(s, "r1"), now).ok, false);
  assert.throws(() => run(s, { type: "confirm", id: "r1" }), /Không có bàn/);
});
test("lịch đang chờ hết khung giờ không được xác nhận", () => {
  const s = seed();
  get(s, "r1").startsAt = addMinutes(now, -300).toISOString();
  assert.throws(() => run(s, { type: "confirm", id: "r1" }), /đã kết thúc/);
});
test("giao thời gian tính bằng timestamp, có đệm và qua ngày", () => {
  const a = { startsAt: "2026-11-11T23:30:00+07:00", duration: 90 };
  assert.equal(
    rules.hasTimeConflict(a, {
      startsAt: "2026-11-12T01:14:00+07:00",
      duration: 30,
    }),
    true,
  );
  assert.equal(
    rules.hasTimeConflict(a, {
      startsAt: "2026-11-12T01:15:00+07:00",
      duration: 30,
    }),
    false,
  );
});
test("không gán bàn thiếu chỗ hoặc đang tạm ngưng / dọn", () => {
  const s = seed();
  for (const tableId of ["A01", "V02", "A04"])
    assert.throws(() => run(s, { type: "assign", id: "r3", tableId }));
});
test("bàn AVAILABLE vẫn bị chặn bởi giữ chỗ trùng giờ", () => {
  const s = seed();
  assert.equal(s.tables.find((t) => t.id === "A02").status, "AVAILABLE");
  assert.throws(
    () => run(s, { type: "assign", id: "r6", tableId: "A02" }),
    /trùng khung giờ/,
  );
});
test("bàn có lịch tương lai vẫn dùng được ở giờ khác", () => {
  const s = seed();
  assert.equal(
    rules.isTableAvailableForTimeRange(
      s,
      s.tables.find((t) => t.id === "A02"),
      input({ startsAt: addMinutes(now, 500).toISOString(), guests: 4 }),
      undefined,
      now,
    ).ok,
    true,
  );
});
test("đổi bàn giải phóng assignment cũ và tạo assignment mới", () => {
  const s = run(seed(), { type: "assign", id: "r3", tableId: "G02" });
  assert.equal(get(s, "r3").tableId, "G02");
  assert.ok(
    s.assignments.find((a) => a.reservationId === "r3" && a.tableId === "A02")
      .releasedAt,
  );
  assert.equal(
    s.assignments.filter((a) => a.reservationId === "r3" && !a.releasedAt)
      .length,
    1,
  );
});
test("sửa thông tin phải kiểm tra lại sức chứa và xung đột", () => {
  const s = seed();
  const original = get(s, "r3");
  assert.throws(
    () => run(s, { type: "edit", id: "r3", input: { ...original, guests: 9 } }),
    /tối đa/,
  );
  assert.throws(
    () =>
      run(s, {
        type: "edit",
        id: "r3",
        input: { ...original, startsAt: get(s, "r11").startsAt },
      }),
    /trùng khung giờ/,
  );
  assert.throws(
    () =>
      run(s, {
        type: "edit",
        id: "r3",
        input: { ...original, tableId: undefined },
      }),
    /cần giữ một bàn/,
  );
});
test("check-in ghi nhận thời điểm và số thực tế, không chiếm bàn hay check-in trùng", () => {
  const s = run(seed(), { type: "check-in", id: "r3", actualGuests: 5 });
  const r = get(s, "r3");
  assert.equal(r.status, "ARRIVED");
  assert.equal(r.actualGuests, 5);
  assert.equal(r.arrivedAt, now.toISOString());
  assert.equal(s.tables.find((t) => t.id === "A02").status, "AVAILABLE");
  assert.throws(
    () => run(s, { type: "check-in", id: "r3", actualGuests: 4 }),
    /trước đó/,
  );
  assert.equal(rules.canHandover(s, r, now).ok, false);
});
test("chặn check-in sai trạng thái hoặc số khách sai", () => {
  assert.throws(
    () => run(seed(), { type: "check-in", id: "r1", actualGuests: 2 }),
    /đã xác nhận/,
  );
  assert.throws(
    () => run(seed(), { type: "check-in", id: "r3", actualGuests: 0 }),
    /số nguyên/,
  );
});
test("bàn giao chuyển SEATED + OCCUPIED, khóa thao tác của lễ tân", () => {
  const s = run(seed(), { type: "handover", id: "r6" });
  assert.equal(get(s, "r6").status, "SEATED");
  assert.equal(s.tables.find((t) => t.id === "B01").status, "OCCUPIED");
  assert.deepEqual(rules.getReservationActions(get(s, "r6"), now), []);
  for (const type of ["edit", "assign", "check-in", "cancel", "handover"])
    assert.throws(() =>
      run(s, {
        type,
        id: "r6",
        tableId: "B03",
        actualGuests: 4,
        input: input(),
        reason: "test",
      }),
    );
});
test("không bàn giao nếu chưa đến, thiếu bàn, bàn không sẵn sàng", () => {
  for (const tableStatus of ["OCCUPIED", "CLEANING", "OUT_OF_SERVICE"]) {
    const s = seed();
    s.tables.find((t) => t.id === "B01").status = tableStatus;
    assert.throws(
      () => run(s, { type: "handover", id: "r6" }),
      /chưa sẵn sàng/,
    );
  }
  const s = seed();
  get(s, "r6").tableId = undefined;
  assert.throws(() => run(s, { type: "handover", id: "r6" }), /gán bàn/);
  assert.throws(() => run(seed(), { type: "handover", id: "r3" }));
});
test("bàn giao sớm/trễ phải kiểm tra khoảng dùng từ giờ hiện tại", () => {
  const s = seed();
  const arrived = get(s, "r6");
  s.reservations.push({
    ...get(s, "r3"),
    id: "conflict",
    tableId: "B01",
    startsAt: addMinutes(now, 100).toISOString(),
  });
  assert.throws(
    () => run(s, { type: "handover", id: arrived.id }),
    /trùng khung giờ/,
  );
});
test("khách đang sử dụng quá giờ vẫn chặn tiếp nhận ngay", () => {
  const s = seed();
  const r = get(s, "r7");
  r.startsAt = addMinutes(now, -300).toISOString();
  r.handedOverAt = r.startsAt;
  assert.equal(
    rules.isTableAvailableForTimeRange(
      s,
      s.tables.find((t) => t.id === "A03"),
      input({ startsAt: now.toISOString() }),
      undefined,
      now,
    ).ok,
    false,
  );
});
test("NO_SHOW cần 30 phút chờ, lý do và giải phóng giữ chỗ", () => {
  const s = seed();
  assert.equal(rules.canMarkNoShow(get(s, "r5"), now).ok, false);
  assert.throws(
    () => run(s, { type: "no-show", id: "r5", reason: "Chưa đến" }),
    /30 phút/,
  );
  assert.throws(
    () => run(s, { type: "no-show", id: "r4", reason: "" }),
    /lý do/,
  );
  const after = run(s, {
    type: "no-show",
    id: "r4",
    reason: "Không liên hệ được sau 45 phút",
  });
  assert.equal(get(after, "r4").status, "NO_SHOW");
  assert.equal(
    after.assignments.filter((a) => a.reservationId === "r4" && !a.releasedAt)
      .length,
    0,
  );
});
test("hủy / từ chối yêu cầu lý do và không giữ chỗ nữa", () => {
  const s = run(seed(), {
    type: "cancel",
    id: "r3",
    reason: "Khách đổi kế hoạch",
  });
  assert.equal(get(s, "r3").status, "CANCELLED");
  assert.equal(
    s.assignments.filter((a) => a.reservationId === "r3" && !a.releasedAt)
      .length,
    0,
  );
  assert.equal(
    rules.isTableAvailableForTimeRange(
      s,
      s.tables.find((t) => t.id === "A02"),
      { ...get(s, "r3"), guests: 4 },
      undefined,
      now,
    ).ok,
    true,
  );
  assert.equal(
    get(
      run(seed(), {
        type: "reject",
        id: "r1",
        reason: "Không đáp ứng yêu cầu",
      }),
      "r1",
    ).status,
    "REJECTED",
  );
});
test("walk-in không bắt buộc tên/phone, phải chọn bàn, chỉ ARRIVED", () => {
  const walk = input({
    customer: { name: "", phone: "" },
    tableId: "G01",
    startsAt: now.toISOString(),
  });
  const result = executeCommand(
    seed(),
    { type: "create", input: walk, walkIn: true },
    now,
  );
  const r = get(result.state, result.reservationId);
  assert.equal(r.status, "ARRIVED");
  assert.equal(r.actualGuests, 2);
  assert.equal(r.source, "WALK_IN");
  assert.equal(
    result.state.tables.find((t) => t.id === "G01").status,
    "AVAILABLE",
  );
  assert.throws(
    () =>
      run(seed(), {
        type: "create",
        input: { ...walk, tableId: undefined },
        walkIn: true,
      }),
    /Chọn bàn/,
  );
});
test("không tạo walk-in khi không còn bàn, không tạo SEATED giả", () => {
  const s = seed();
  s.tables.forEach((t) => (t.status = "OUT_OF_SERVICE"));
  const before = JSON.stringify(s);
  assert.throws(
    () => run(s, { type: "create", input: input(), walkIn: true }),
    /khả năng tiếp nhận/,
  );
  assert.equal(JSON.stringify(s), before);
});
test("dashboard tính lại từ state sau xác nhận / check-in / bàn giao", () => {
  let s = seed();
  const before = rules.getReceptionDashboardSummary(s, now);
  s = run(s, { type: "confirm", id: "r1" });
  assert.equal(
    rules.getReceptionDashboardSummary(s, now).pending,
    before.pending - 1,
  );
  s = run(s, { type: "check-in", id: "r3", actualGuests: 4 });
  assert.equal(
    rules.getReceptionDashboardSummary(s, now).arrived,
    before.arrived + 1,
  );
  s = run(s, { type: "handover", id: "r6" });
  assert.equal(
    rules.getReceptionDashboardSummary(s, now).available,
    before.available - 1,
  );
});
test("tìm tên không dấu, số điện thoại, mã; lọc ngày và trạng thái", () => {
  const s = seed();
  assert.equal(rules.matchesReservation(get(s, "r3"), "nguyen huong"), true);
  assert.equal(
    rules.matchesReservation(get(s, "r3"), get(s, "r3").customer.phone),
    true,
  );
  assert.equal(rules.matchesReservation(get(s, "r3"), "rs0003"), true);
  const results = rules.selectReservations(s, dayKey(now), "", "PENDING");
  assert.equal(results.length, 2);
  assert.ok(results.every((r) => r.status === "PENDING"));
});
test("thông báo liên kết đúng lịch và đánh dấu đã đọc", () => {
  const s = seed();
  const n = s.notifications.find((n) => !n.read);
  const after = run(s, { type: "read", id: n.id });
  assert.ok(get(after, n.reservationId));
  assert.equal(after.notifications.find((item) => item.id === n.id).read, true);
  assert.ok(run(after, { type: "read" }).notifications.every((n) => n.read));
});
test("khôi phục phiên đúng role, không lưu password; ngày mới reseed", () => {
  const s = seed();
  const restored = restoreDemoState(JSON.parse(JSON.stringify(s)), now);
  assert.equal(restored.session.role, "RECEPTIONIST");
  assert.equal("password" in restored.session, false);
  assert.equal(Object.values(restored.session).includes("123456"), false);
  assert.equal(
    restoreDemoState({ ...s, session: { ...DEMO_STAFF, role: "MANAGER" } }, now)
      .session,
    null,
  );
  const tomorrow = addMinutes(now, 1440);
  const fresh = restoreDemoState(s, tomorrow);
  assert.equal(fresh.seedDay, dayKey(tomorrow));
  assert.equal(fresh.session.role, "RECEPTIONIST");
  assert.equal(restoreDemoState({ ...s, session: null }, now).session, null);
  assert.throws(() => restoreDemoState({}, now));
});

test("luồng điện thoại đầy đủ: tạo → xác nhận → check-in → bàn giao", () => {
  const created = executeCommand(
    seed(),
    { type: "create", input: input() },
    now,
  );
  const id = created.reservationId;
  let s = run(created.state, { type: "confirm", id });
  const arrival = new Date(get(s, id).startsAt);
  s = run(s, { type: "check-in", id, actualGuests: 2 }, arrival);
  s = run(s, { type: "handover", id }, arrival);
  const r = get(s, id);
  assert.equal(r.status, "SEATED");
  assert.equal(s.tables.find((t) => t.id === r.tableId).status, "OCCUPIED");
  assert.equal(r.history.length, 4);
});
test("không bán trùng khả năng tiếp nhận cho hai yêu cầu chưa gán bàn", () => {
  let s = seed();
  s.tables = s.tables.filter((t) => t.id === "G01");
  s.reservations = s.reservations
    .slice(0, 2)
    .map((r) => ({ ...r, guests: 2, startsAt: input().startsAt }));
  s = run(s, { type: "confirm", id: "r1" });
  assert.equal(get(s, "r1").tableId, "G01");
  assert.throws(() => run(s, { type: "confirm", id: "r2" }), /Không có bàn/);
});
test("ngưỡng NO_SHOW chính xác là 30 phút và không tự đổi trạng thái", () => {
  const r = get(seed(), "r3");
  r.startsAt = addMinutes(now, -30).toISOString();
  assert.equal(rules.canMarkNoShow(r, addMinutes(now, -0.01)).ok, false);
  assert.equal(rules.canMarkNoShow(r, now).ok, true);
  assert.equal(r.status, "CONFIRMED");
});
test("edit không thể thay ID, trạng thái hoặc lịch sử qua payload", () => {
  const s = seed();
  const original = get(s, "r1");
  const updated = run(s, {
    type: "edit",
    id: "r1",
    input: {
      ...original,
      id: "evil",
      status: "COMPLETED",
      history: [],
      customer: { name: "Đã sửa", phone: "" },
    },
  });
  const r = get(updated, "r1");
  assert.equal(r.status, "PENDING");
  assert.equal(r.customer.name, "Đã sửa");
  assert.equal(r.history.length, original.history.length + 1);
});
test("dữ liệu lưu bị hỏng bị từ chối trước khi đưa vào UI", () => {
  const s = seed();
  s.reservations[0].customer = null;
  assert.throws(() => restoreDemoState(s, now), /không hợp lệ/);
});
