import type { Staff } from "../features/auth/types";
import { STATUS_LABELS } from "../features/reservations/labels";
import type {
  ReceptionState,
  Reservation,
  ReservationStatus,
} from "../features/reservations/types";
import { TABLE_LABELS } from "../features/tables/labels";
import { addMinutes, dayKey } from "../utils/dates";
import { DEMO_WAITER, OTHER_WAITER, emptyServiceData, isValidServiceData, seedWaiterScenarios } from "./waiter-data";
import { syncHandovers } from "../features/waiter/handover";

export const DEMO_STAFF: Staff = {
  id: "NV001",
  name: "Nguyễn Minh Anh",
  username: "receptionist",
  role: "RECEPTIONIST",
  shift: "Ca làm việc demo",
};
export function createMockState(now = new Date()): ReceptionState {
  const areas = [
    { id: "floor-1", name: "Tầng 1" },
    { id: "floor-2", name: "Tầng 2" },
    { id: "vip", name: "Phòng VIP" },
    { id: "outside", name: "Ngoài trời" },
  ];
  const tables: ReceptionState["tables"] = [
    {
      id: "A01",
      code: "A01",
      areaId: "floor-1",
      capacity: 2,
      status: "AVAILABLE",
    },
    {
      id: "A02",
      code: "A02",
      areaId: "floor-1",
      capacity: 4,
      status: "AVAILABLE",
    },
    {
      id: "A03",
      code: "A03",
      areaId: "floor-1",
      capacity: 4,
      status: "OCCUPIED",
    },
    {
      id: "A04",
      code: "A04",
      areaId: "floor-1",
      capacity: 6,
      status: "CLEANING",
    },
    {
      id: "B01",
      code: "B01",
      areaId: "floor-2",
      capacity: 4,
      status: "AVAILABLE",
    },
    {
      id: "B02",
      code: "B02",
      areaId: "floor-2",
      capacity: 6,
      status: "AVAILABLE",
    },
    {
      id: "B03",
      code: "B03",
      areaId: "floor-2",
      capacity: 8,
      status: "AVAILABLE",
    },
    {
      id: "V01",
      code: "V01",
      areaId: "vip",
      capacity: 10,
      status: "AVAILABLE",
    },
    {
      id: "V02",
      code: "V02",
      areaId: "vip",
      capacity: 12,
      status: "OUT_OF_SERVICE",
    },
    {
      id: "G01",
      code: "G01",
      areaId: "outside",
      capacity: 2,
      status: "AVAILABLE",
    },
    {
      id: "G02",
      code: "G02",
      areaId: "outside",
      capacity: 4,
      status: "AVAILABLE",
    },
    {
      id: "G03",
      code: "G03",
      areaId: "outside",
      capacity: 6,
      status: "AVAILABLE",
    },
  ];
  const specs: [string, number, number, ReservationStatus, string?][] = [
    ["Trần Thanh Hà", 40, 4, "PENDING"],
    ["Lê Quốc Bảo", 70, 6, "PENDING"],
    ["Nguyễn Hương", 25, 4, "CONFIRMED", "A02"],
    ["Phạm Đức Long", -45, 2, "CONFIRMED", "A01"],
    ["Hoàng Mai", -10, 6, "CONFIRMED", "B02"],
    ["Đỗ Anh Tuấn", 20, 4, "ARRIVED", "B01"],
    ["Vũ Minh", -40, 4, "SEATED", "A03"],
    ["Bùi Ngọc", -240, 2, "COMPLETED", "G01"],
    ["Lý An", -200, 4, "CANCELLED"],
    ["Ngô Phúc", -180, 2, "NO_SHOW"],
    ["Đinh Lan", 240, 4, "CONFIRMED", "A02"],
    ["Mai Phương", 60, 8, "REJECTED"],
    ["Trịnh Vy", 35, 10, "CONFIRMED", "V01"],
  ];
  const reservations: Reservation[] = specs.map(
    ([name, offset, guests, status, tableId], i) => ({
      id: `r${i + 1}`,
      code: `RS${String(i + 1).padStart(4, "0")}`,
      customer: { name, phone: `0901234${String(i).padStart(3, "0")}` },
      startsAt: addMinutes(now, offset).toISOString(),
      duration: status === "SEATED" ? 120 : 90,
      guests,
      tableId,
      status,
      source: i < 2 ? "WEB" : "PHONE",
      notes: i === 0 ? "Khách có trẻ nhỏ." : "",
      specialRequests: i === 12 ? "Phòng yên tĩnh, ghế trẻ em." : "",
      actualGuests: ["ARRIVED", "SEATED", "COMPLETED"].includes(status)
        ? guests
        : undefined,
      arrivedAt: ["ARRIVED", "SEATED", "COMPLETED"].includes(status)
        ? addMinutes(now, status === "ARRIVED" ? -5 : offset).toISOString()
        : undefined,
      handedOverAt:
        status === "SEATED" ? addMinutes(now, -35).toISOString() : undefined,
      reason: status === "REJECTED" ? "Khách đã đổi kế hoạch." : undefined,
      history: [
        {
          at: addMinutes(now, -300).toISOString(),
          text: `Dữ liệu mẫu · ${STATUS_LABELS[status]}`,
        },
      ],
    }),
  );
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 30, 0, 0);
  reservations.push({
    ...reservations[0],
    id: "r14",
    code: "RS0014",
    startsAt: tomorrow.toISOString(),
    customer: { name: "Nguyễn Thu Thảo", phone: "0912345678" },
    history: [{ at: now.toISOString(), text: "Yêu cầu từ Web cho ngày mai." }],
  });
  const titles = [
    "Đặt bàn mới",
    "Lịch chờ xác nhận",
    "Khách sắp đến",
    "Khách trễ giờ",
    "Khách trễ giờ",
    "Khách đã check-in",
    "Bàn đang sử dụng",
    "Lượt đã kết thúc",
    "Lịch bị hủy",
  ];
  const state: ReceptionState = {
    ...emptyServiceData(DEMO_STAFF),
    version: 1,
    seedDay: dayKey(now),
    session: null,
    areas,
    tables,
    reservations,
    nextId: 100,
    assignments: reservations
      .filter((r) => r.tableId)
      .map((r) => ({
        id: `seed-${r.id}`,
        reservationId: r.id,
        tableId: r.tableId!,
        assignedAt: now.toISOString(),
        releasedAt: ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(r.status)
          ? now.toISOString()
          : undefined,
      })),
    notifications: reservations.slice(0, 9).map((r, i) => ({
      id: `n${i}`,
      title: titles[i],
      body: `${r.customer.name} · ${r.code}`,
      at: addMinutes(now, -i * 5).toISOString(),
      read: i > 4,
      reservationId: r.id,
    })),
  };
  seedWaiterScenarios(state, now);
  return state;
}

// Versioned storage; old demo dates are reseeded on the next launch, preserving
// only the authenticated employee. No credentials are part of the stored state.
export function restoreDemoState(
  raw: unknown,
  now = new Date(),
): ReceptionState {
  const fresh = createMockState(now);
  if (!raw || typeof raw !== "object")
    throw new Error("Dữ liệu lưu không hợp lệ.");
  const saved = raw as ReceptionState;
  if (
    saved.version !== 1 ||
    !Array.isArray(saved.reservations) ||
    !Array.isArray(saved.tables) ||
    !Array.isArray(saved.notifications) ||
    !Array.isArray(saved.assignments) ||
    !Array.isArray(saved.areas) ||
    !Number.isInteger(saved.nextId)
  )
    throw new Error("Phiên bản dữ liệu demo không hợp lệ.");
  if (
    !saved.reservations.every(
      (r) =>
        r &&
        typeof r.id === "string" &&
        r.status in STATUS_LABELS &&
        r.customer &&
        typeof r.customer.name === "string" &&
        typeof r.customer.phone === "string" &&
        Number.isFinite(new Date(r.startsAt).getTime()) &&
        Number.isInteger(r.guests) &&
        r.guests > 0 &&
        Number.isInteger(r.duration) &&
        r.duration >= 15 &&
        Array.isArray(r.history) &&
        r.history.every(
          (h) =>
            h &&
            typeof h.text === "string" &&
            Number.isFinite(new Date(h.at).getTime()),
        ),
    ) ||
    !saved.tables.every(
      (t) =>
        t &&
        typeof t.id === "string" &&
        t.status in TABLE_LABELS &&
        Number.isInteger(t.capacity) &&
        t.capacity > 0,
    ) ||
    !saved.areas.every(
      (a) => a && typeof a.id === "string" && typeof a.name === "string",
    ) ||
    !saved.notifications.every(
      (n) =>
        n &&
        typeof n.id === "string" &&
        typeof n.title === "string" &&
        typeof n.body === "string" &&
        Number.isFinite(new Date(n.at).getTime()),
    ) ||
    !saved.assignments.every(
      (a) =>
        a &&
        typeof a.id === "string" &&
        typeof a.reservationId === "string" &&
        typeof a.tableId === "string",
    )
  )
    throw new Error("Nội dung dữ liệu demo không hợp lệ.");
  // Restore only known demo identities, never a role supplied in storage.
  const known = [DEMO_STAFF, DEMO_WAITER, OTHER_WAITER].find((s) => s.id === saved.session?.id && s.role === saved.session?.role);
  const session = known ? { ...known } : null;
  if (saved.seedDay !== fresh.seedDay) return { ...fresh, session };
  const upgraded = saved.serviceVersion === undefined
    ? { ...saved, ...emptyServiceData(DEMO_STAFF), session }
    : { ...saved, session };
  syncHandovers(upgraded);
  if (!isValidServiceData(upgraded)) throw new Error("Dữ liệu phục vụ lưu trên thiết bị không hợp lệ.");
  // Add the new demo seafood selection without changing saved prices, orders or availability.
  for (const category of fresh.menuCategories) {
    if (!upgraded.menuCategories.some((c) => c.id === category.id)) upgraded.menuCategories.push(category);
  }
  for (const item of fresh.menuItems) {
    if (!upgraded.menuItems.some((m) => m.id === item.id)) upgraded.menuItems.push(item);
  }
  return upgraded;
}
