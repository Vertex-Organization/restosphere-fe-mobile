import type { Staff } from "../../src/features/auth/types";
import type { ReceptionState } from "../../src/features/reservations/types";
import type { ServiceData } from "../../src/features/waiter/types";
import { syncHandovers } from "./handover";
import { addMinutes } from "../../src/utils/dates";

export const DEMO_WAITER: Staff = {
  id: "NV002",
  name: "Trần Hoài Nam",
  username: "waiter",
  role: "WAITER",
  shift: "Ca sáng 08:00–16:00 · Khu: Tầng 1",
  areaId: "floor-1",
  shiftId: "SH-AM",
};
export const OTHER_WAITER: Staff = {
  id: "NV003",
  name: "Lê Thu Hà",
  username: "waiter2",
  role: "WAITER",
  shift: "Ca sáng 08:00–16:00 · Khu: Tầng 2",
  areaId: "floor-2",
  shiftId: "SH-AM",
};
export function emptyServiceData(receptionist: Staff): ServiceData {
  return {
    serviceVersion: 1,
    employees: [{ ...receptionist }, { ...DEMO_WAITER }, { ...OTHER_WAITER }],
    tableSessions: [],
    orders: [],
    orderItems: [],
    drafts: [],
    bills: [],
    waiterNotifications: [],
    requests: [],
    outbox: [],
    menuCategories: [
      { id: "seafood", name: "Hải sản" },
      { id: "rice", name: "Cơm & mì" },
      { id: "hotpot", name: "Lẩu" },
      { id: "main", name: "Món khác" },
      { id: "drink", name: "Đồ uống" },
    ],
    menuItems: [
      {
        id: "grilled-shrimp",
        name: "Tôm nướng",
        price: 219000,
        categoryId: "seafood",
        status: "AVAILABLE",
        notes: "Tôm nguyên con nướng. Ghi chú độ cay khi gọi món.",
      },
      {
        id: "steamed-crab",
        name: "Cua hấp",
        price: 359000,
        categoryId: "seafood",
        status: "AVAILABLE",
        notes: "Cua nguyên con hấp, dùng kèm nước chấm.",
      },
      {
        id: "grilled-squid",
        name: "Mực nướng",
        price: 189000,
        categoryId: "seafood",
        status: "AVAILABLE",
        notes: "Mực nướng, dùng kèm rau và nước chấm.",
      },
      {
        id: "grilled-fish",
        name: "Cá nướng",
        price: 249000,
        categoryId: "seafood",
        status: "AVAILABLE",
        notes: "Cá nguyên con nướng, dùng kèm rau thơm.",
      },
      {
        id: "seafood-rice",
        name: "Cơm chiên hải sản",
        price: 95000,
        categoryId: "rice",
        status: "AVAILABLE",
        notes: "Có tôm, mực và trứng.",
      },
      {
        id: "beef",
        name: "Bò lúc lắc",
        price: 165000,
        categoryId: "main",
        status: "AVAILABLE",
        notes: "Dùng kèm khoai tây.",
      },
      {
        id: "thai-pot",
        name: "Lẩu Thái",
        price: 329000,
        categoryId: "hotpot",
        status: "AVAILABLE",
        notes: "Nước dùng cay, có hải sản.",
      },
      {
        id: "peach-tea",
        name: "Trà đào",
        price: 35000,
        categoryId: "drink",
        status: "AVAILABLE",
        notes: "Có thể ghi chú lượng đường, đá.",
      },
      {
        id: "water",
        name: "Nước suối",
        price: 15000,
        categoryId: "drink",
        status: "AVAILABLE",
        notes: "Chai 500 ml.",
      },
      {
        id: "noodles",
        name: "Mì xào hải sản",
        price: 89000,
        categoryId: "rice",
        status: "AVAILABLE",
        notes: "Có tôm và mực.",
      },
      {
        id: "chicken",
        name: "Gà nướng muối ớt",
        price: 189000,
        categoryId: "main",
        status: "SOLD_OUT",
        notes: "Hết nguyên liệu trong ca này.",
      },
      {
        id: "old-pot",
        name: "Lẩu nấm",
        price: 259000,
        categoryId: "hotpot",
        status: "DISCONTINUED",
        notes: "Ngừng bán.",
      },
    ],
  };
}

/** Add scenarios only for a new demo. Migration never overwrites reception data. */
export function seedWaiterScenarios(state: ReceptionState, now: Date) {
  syncHandovers(state); // A03 is the existing receptionist handover, not a duplicate table.
  // Additional shared demo tables preserve reception's original free capacity.
  state.tables.push(
    { id: "B04", code: "B04", areaId: "floor-2", capacity: 8, status: "OCCUPIED" },
    { id: "G04", code: "G04", areaId: "outside", capacity: 4, status: "OCCUPIED" },
    { id: "G05", code: "G05", areaId: "outside", capacity: 6, status: "OCCUPIED" },
  );
  const specs = [
    {
      table: "B04",
      customer: "Khách nhóm tầng 2",
      payment: "UNPAID",
      cleaning: false,
      closed: false,
    },
    {
      table: "G04",
      customer: "Khách sân vườn",
      payment: "PAYMENT_REQUESTED",
      cleaning: false,
      closed: false,
    },
    {
      table: "G05",
      customer: "Khách bàn ngoài trời",
      payment: "PAID",
      cleaning: false,
      closed: false,
    },
    { table: "A04", customer: "Khách đã rời", payment: "PAID", cleaning: true, closed: false },
    { table: "G01", customer: "Lượt đã hoàn tất", payment: "PAID", cleaning: true, closed: true },
  ] as const;
  for (const [index, spec] of specs.entries()) {
    const reservationId = `waiter-r${index}`;
    const sessionId = `waiter-s${index}`;
    const at = addMinutes(now, -70 - index * 10).toISOString();
    const table = state.tables.find((t) => t.id === spec.table)!;
    // G01's historic completed turn leaves its current availability unchanged.
    if (!spec.closed) table.status = spec.cleaning ? "CLEANING" : "OCCUPIED";
    state.reservations.push({
      id: reservationId,
      code: `PV${index + 1}`,
      customer: { name: spec.customer, phone: "" },
      startsAt: at,
      guests: Math.min(table.capacity, spec.table === "B04" ? 6 : 4),
      actualGuests: Math.min(table.capacity, spec.table === "B04" ? 6 : 4),
      duration: 120,
      tableId: table.id,
      areaId: table.areaId,
      notes: index === 0 ? "Khách có trẻ nhỏ. Ưu tiên món ít cay." : "",
      specialRequests: "",
      source: "WALK_IN",
      status: spec.closed ? "COMPLETED" : "SEATED",
      arrivedAt: at,
      handedOverAt: at,
      history: [{ at, text: "Lượt phục vụ mô phỏng." }],
    });
    state.assignments.push({
      id: `waiter-a${index}`,
      reservationId,
      tableId: table.id,
      assignedAt: at,
      releasedAt: spec.closed ? addMinutes(now, -20).toISOString() : undefined,
    });
    state.tableSessions.push({
      id: sessionId,
      tableId: table.id,
      reservationId,
      handedOverAt: at,
      waiterId: DEMO_WAITER.id,
      acceptedAt: addMinutes(at, 2).toISOString(),
      guestLeftAt: spec.cleaning ? addMinutes(now, -25).toISOString() : undefined,
      closedAt: spec.closed ? addMinutes(now, -20).toISOString() : undefined,
    });
    const orderId = `waiter-o${index}`;
    state.orders.push({
      id: orderId,
      sessionId,
      waiterId: DEMO_WAITER.id,
      sequence: 1,
      submittedAt: addMinutes(at, 5).toISOString(),
    });
    const menus =
      index === 0 ? ["seafood-rice", "beef", "water", "peach-tea"] : ["seafood-rice", "water"];
    menus.forEach((menuId, itemIndex) => {
      const menu = state.menuItems.find((m) => m.id === menuId)!;
      const status =
        index === 0
          ? (["PREPARING", "READY", "SERVED", "SUBMITTED"] as const)[itemIndex]
          : "SERVED";
      state.orderItems.push({
        id: `waiter-i${index}-${itemIndex}`,
        orderId,
        menuItemId: menuId,
        name: menu.name,
        unitPrice: menu.price,
        quantity: itemIndex === 0 ? 2 : 1,
        note: index === 0 && itemIndex === 0 ? "Không cay" : "",
        status,
        submittedAt: addMinutes(at, 5).toISOString(),
        readyAt: ["READY", "SERVED"].includes(status)
          ? addMinutes(now, index === 0 ? -4 : -45).toISOString()
          : undefined,
        servedAt:
          status === "SERVED" ? addMinutes(now, index === 0 ? -3 : -40).toISOString() : undefined,
      });
    });
    const amount = state.orderItems
      .filter((i) => i.orderId === orderId)
      .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    state.bills.push({
      id: `waiter-b${index}`,
      sessionId,
      status: spec.payment,
      amount: spec.payment === "UNPAID" ? undefined : amount,
      requestedAt:
        spec.payment !== "UNPAID"
          ? addMinutes(now, spec.cleaning ? -35 : -10).toISOString()
          : undefined,
      paidAt:
        spec.payment === "PAID"
          ? addMinutes(now, spec.cleaning ? -30 : -8).toISOString()
          : undefined,
    });
    if (!spec.closed)
      state.waiterNotifications.unshift({
        id: `waiter-n${index}`,
        sessionId,
        waiterId: DEMO_WAITER.id,
        kind: index === 0 ? "READY" : spec.payment === "PAID" ? "PAYMENT" : "TABLE",
        title:
          index === 0
            ? "Bò lúc lắc đã sẵn sàng"
            : spec.payment === "PAID"
              ? "Thu ngân đã xử lý thanh toán"
              : "Đang chờ thu ngân",
        body: `Bàn ${table.code}`,
        at: addMinutes(now, -index * 3).toISOString(),
        readBy: [],
      });
  }
}

export function isValidServiceData(state: ReceptionState): boolean {
  const date = (v: unknown) => typeof v === "string" && Number.isFinite(new Date(v).getTime());
  if (
    state.serviceVersion !== 1 ||
    ![
      state.employees,
      state.tableSessions,
      state.menuCategories,
      state.menuItems,
      state.orders,
      state.orderItems,
      state.drafts,
      state.bills,
      state.waiterNotifications,
      state.requests,
      state.outbox,
    ].every(Array.isArray)
  )
    return false;
  return (
    state.employees.every((e) => e && typeof e.id === "string" && typeof e.name === "string") &&
    state.menuCategories.every(
      (c) => c && typeof c.id === "string" && typeof c.name === "string",
    ) &&
    state.menuItems.every(
      (m) =>
        m &&
        typeof m.id === "string" &&
        typeof m.name === "string" &&
        typeof m.notes === "string" &&
        Number.isFinite(m.price) &&
        m.price >= 0 &&
        ["AVAILABLE", "SOLD_OUT", "DISCONTINUED"].includes(m.status) &&
        state.menuCategories.some((c) => c.id === m.categoryId),
    ) &&
    state.tableSessions.every(
      (s) =>
        s &&
        typeof s.id === "string" &&
        date(s.handedOverAt) &&
        (!s.acceptedAt || date(s.acceptedAt)) &&
        (!s.guestLeftAt || date(s.guestLeftAt)) &&
        (!s.closedAt || date(s.closedAt)) &&
        state.tables.some((t) => t.id === s.tableId) &&
        state.reservations.some((r) => r.id === s.reservationId),
    ) &&
    state.orders.every(
      (o) =>
        o &&
        typeof o.id === "string" &&
        date(o.submittedAt) &&
        Number.isInteger(o.sequence) &&
        (!o.priority ||
          (typeof o.priority.by === "string" &&
            typeof o.priority.reason === "string" &&
            date(o.priority.at))) &&
        state.tableSessions.some((s) => s.id === o.sessionId),
    ) &&
    state.orderItems.every(
      (i) =>
        i &&
        typeof i.id === "string" &&
        typeof i.name === "string" &&
        typeof i.note === "string" &&
        date(i.submittedAt) &&
        Number.isFinite(i.unitPrice) &&
        i.unitPrice >= 0 &&
        Number.isInteger(i.quantity) &&
        i.quantity > 0 &&
        i.quantity <= 99 &&
        ["SUBMITTED", "PREPARING", "READY", "SERVED", "REJECTED", "CANCELLED", "VOIDED"].includes(
          i.status,
        ) &&
        (i.status !== "REJECTED" ||
          (typeof i.rejectionReason === "string" && i.rejectionReason.trim().length >= 5)) &&
        state.orders.some((o) => o.id === i.orderId),
    ) &&
    state.drafts.every(
      (d) =>
        d &&
        typeof d.id === "string" &&
        typeof d.waiterId === "string" &&
        typeof d.note === "string" &&
        Number.isInteger(d.quantity) &&
        d.quantity > 0 &&
        d.quantity <= 99 &&
        state.tableSessions.some((s) => s.id === d.sessionId) &&
        state.menuItems.some((m) => m.id === d.menuItemId),
    ) &&
    state.bills.every(
      (b) =>
        b &&
        typeof b.id === "string" &&
        ["UNPAID", "PAYMENT_REQUESTED", "PAID"].includes(b.status) &&
        state.tableSessions.some((s) => s.id === b.sessionId) &&
        (b.amount === undefined || (Number.isFinite(b.amount) && b.amount >= 0)),
    ) &&
    state.tableSessions.every(
      (s) => state.bills.filter((b) => b.sessionId === s.id).length === 1,
    ) &&
    state.requests.every(
      (r) =>
        r &&
        typeof r.id === "string" &&
        typeof r.code === "string" &&
        r.type === "CANCEL_ITEM" &&
        r.targetType === "ORDER_ITEM" &&
        r.targetId === r.itemId &&
        ["PENDING", "APPROVED", "REJECTED", "WITHDRAWN"].includes(r.status) &&
        typeof r.reason === "string" &&
        r.reason.trim().length >= 5 &&
        r.reason.length <= 200 &&
        typeof r.requestedBy === "string" &&
        date(r.requestedAt) &&
        Number.isSafeInteger(r.amount) &&
        r.amount >= 0 &&
        state.orders.some(
          (o) =>
            o.sessionId === r.sessionId &&
            state.orderItems.some((i) => i.id === r.itemId && i.orderId === o.id),
        ) &&
        (r.status === "PENDING" ||
          (typeof r.decidedBy === "string" &&
            date(r.decidedAt) &&
            typeof r.decisionNote === "string")),
    ) &&
    state.outbox.every(
      (m) =>
        m &&
        typeof m.id === "string" &&
        typeof m.title === "string" &&
        typeof m.body === "string" &&
        typeof m.targetId === "string" &&
        date(m.at) &&
        ((m.kind === "APPROVAL" && m.audience === "MANAGER") ||
          ((m.kind === "CANCELLED" || m.kind === "PRIORITY") && m.audience === "KITCHEN") ||
          ((m.kind === "PAYMENT_REQUEST" || m.kind === "PAYMENT_REQUEST_WITHDRAWN") &&
            m.audience === "CASHIER")),
    ) &&
    state.waiterNotifications.every(
      (n) =>
        n &&
        typeof n.id === "string" &&
        typeof n.title === "string" &&
        typeof n.body === "string" &&
        [
          "HANDOVER",
          "READY",
          "TABLE_REASSIGNED",
          "MENU_AVAILABILITY",
          "ITEM_REJECTED",
          "PAYMENT",
          "PAYMENT_RETURNED",
          "PAYMENT_VOIDED",
          "BILL_UPDATED",
          "TABLE",
          "INCIDENT",
          "REQUEST_DECIDED",
        ].includes(n.kind) &&
        date(n.at) &&
        Array.isArray(n.readBy) &&
        n.readBy.every((id) => typeof id === "string") &&
        (n.kind === "MENU_AVAILABILITY"
          ? n.sessionId === undefined
          : state.tableSessions.some((s) => s.id === n.sessionId)),
    )
  );
}
