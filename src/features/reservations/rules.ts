import { isReceptionist } from "../auth/roles";
import type { Role } from "../auth/types";
import type { RestaurantTable } from "../tables/types";
import { addMinutes, dayKey, lateMinutes } from "../../utils/dates";
import { normalizeSearch } from "../../utils/search";
import type {
  ReceptionState,
  Reservation,
  ReservationAction,
  ReservationInput,
  ReservationSettings,
  RuleResult,
} from "./types";

export const DEFAULT_SETTINGS: ReservationSettings = { bufferMinutes: 15, noShowMinutes: 30 };
const yes: RuleResult = { ok: true };
const no = (reason: string): RuleResult => ({ ok: false, reason });
export const holdsTable = (r: Reservation) =>
  ["CONFIRMED", "ARRIVED", "SEATED"].includes(r.status);
export const endsAt = (r: ReservationInput) =>
  addMinutes(r.startsAt, r.duration);
export const heldRange = (r: Reservation) => ({
  ...r,
  startsAt: r.handedOverAt ?? r.arrivedAt ?? r.startsAt,
});

export function hasTimeConflict(
  a: Pick<ReservationInput, "startsAt" | "duration">,
  b: Pick<ReservationInput, "startsAt" | "duration">,
  buffer = DEFAULT_SETTINGS.bufferMinutes,
): boolean {
  const aStart = new Date(a.startsAt).getTime(),
    bStart = new Date(b.startsAt).getTime();
  return (
    aStart < bStart + (b.duration + buffer) * 60_000 &&
    bStart < aStart + (a.duration + buffer) * 60_000
  );
}

export function isTableAvailableForTimeRange(
  state: ReceptionState,
  table: RestaurantTable,
  input: ReservationInput,
  excludeId?: string,
  now = new Date(),
): RuleResult {
  const buffer = state.settings.bufferMinutes;
  if (table.status === "OUT_OF_SERVICE")
    return no(`Bàn ${table.code} đang tạm ngưng sử dụng.`);
  if (input.guests > table.capacity)
    return no(`Bàn ${table.code} chỉ phục vụ tối đa ${table.capacity} khách.`);
  if (input.areaId && input.areaId !== table.areaId)
    return no(`Bàn ${table.code} không thuộc khu vực yêu cầu.`);
  const conflicts = state.reservations.filter(
    (r) => r.id !== excludeId && r.tableId === table.id && holdsTable(r),
  );
  if (conflicts.some((r) => hasTimeConflict(heldRange(r), input, buffer)))
    return no(
      `Bàn ${table.code} đã có lịch đặt trùng khung giờ (gồm ${buffer} phút đệm).`,
    );
  // Physical state is separate from timed holds. A seated guest still present blocks
  // the table until their expected end + buffer, or at least now + buffer if overdue.
  if (table.status === "OCCUPIED") {
    const seated = conflicts.filter((r) => r.status === "SEATED");
    const release = Math.max(
      now.getTime() + buffer * 60_000,
      ...seated.map(
        (r) => endsAt(heldRange(r)).getTime() + buffer * 60_000,
      ),
    );
    if (!seated.length || new Date(input.startsAt).getTime() < release)
      return no(
        `Bàn ${table.code} đang có khách sử dụng, chưa thể tiếp nhận trong khung giờ này.`,
      );
  }
  // Cleaning has no known completion time; a receptionist cannot promise its release.
  if (table.status === "CLEANING")
    return no(`Bàn ${table.code} đang dọn, chưa có thời gian sẵn sàng.`);
  return yes;
}
export function canAssignTable(
  state: ReceptionState,
  r: Reservation,
  tableId: string,
  now = new Date(),
): RuleResult {
  if (!["CONFIRMED", "ARRIVED"].includes(r.status))
    return no(
      "Chỉ gán hoặc đổi bàn khi đã xác nhận hoặc khách đã đến, trước bàn giao.",
    );
  const table = state.tables.find((t) => t.id === tableId);
  if (!table) return no("Không tìm thấy bàn.");
  return isTableAvailableForTimeRange(
    state,
    table,
    {
      ...r,
      guests: r.actualGuests ?? r.guests,
      startsAt: r.status === "ARRIVED" ? r.arrivedAt! : r.startsAt,
    },
    r.id,
    now,
  );
}
export function getAvailableTables(
  state: ReceptionState,
  input: ReservationInput,
  excludeId?: string,
  now = new Date(),
) {
  return state.tables
    .filter(
      (t) => isTableAvailableForTimeRange(state, t, input, excludeId, now).ok,
    )
    .sort((a, b) => a.capacity - b.capacity);
}
export function canConfirmReservation(
  state: ReceptionState,
  r: Reservation,
  now = new Date(),
): RuleResult {
  if (r.status !== "PENDING") return no("Chỉ xác nhận lịch đang chờ xác nhận.");
  if (endsAt(r).getTime() <= now.getTime())
    return no(
      "Khung giờ này đã kết thúc. Hãy chỉnh sửa giờ hẹn hoặc từ chối yêu cầu.",
    );
  if (r.tableId) {
    const table = state.tables.find((t) => t.id === r.tableId);
    if (!table) return no("Không tìm thấy bàn dự kiến.");
    return isTableAvailableForTimeRange(state, table, r, r.id, now);
  }
  const candidates = getAvailableTables(state, r, r.id, now);
  if (!candidates.length)
    return no(
      "Không có bàn đủ sức chứa và không xung đột trong khung giờ yêu cầu.",
    );
  // Unassigned confirmed reservations still consume reception capacity. Demo policy:
  // reserve one fitting table when confirming so capacity cannot be oversold.
  return yes;
}
export function canCheckIn(r: Reservation, now = new Date(), earlyMinutes = 60): RuleResult {
  if (r.status !== "CONFIRMED")
    return no(
      r.arrivedAt
        ? "Khách đã được check-in trước đó."
        : "Chỉ check-in lịch đã xác nhận.",
    );
  return now < addMinutes(r.startsAt, -earlyMinutes)
    ? no(`Chỉ check-in sớm tối đa ${earlyMinutes} phút trước giờ hẹn.`)
    : yes;
}
const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
// Uses device local time; the server re-checks with the restaurant timezone.
export function openingHoursError(startsAt: string, duration: number, settings?: ReservationSettings, walkIn = false): string | undefined {
  const open = settings?.openMinutes, close = settings?.closeMinutes;
  if (open == null || close == null) return;
  const d = new Date(startsAt);
  let m = d.getHours() * 60 + d.getMinutes();
  if (m < open && close > 1440) m += 1440;
  if (m < open || (walkIn ? m + 1 : m + duration) > close)
    return `Nhà hàng mở ${hhmm(open)}–${hhmm(close)}; giờ đến + thời lượng phải nằm trong giờ mở cửa.`;
}
export function canHandover(
  state: ReceptionState,
  r: Reservation,
  now = new Date(),
): RuleResult {
  if (r.status !== "ARRIVED")
    return no("Khách phải check-in trước khi bàn giao.");
  if (!r.tableId) return no("Cần gán bàn trước khi bàn giao.");
  const table = state.tables.find((t) => t.id === r.tableId);
  if (!table || table.status !== "AVAILABLE")
    return no("Chưa thể bàn giao vì bàn chưa sẵn sàng.");
  // Service starts now, not at the original booking time (early/late arrivals).
  return isTableAvailableForTimeRange(
    state,
    table,
    { ...r, startsAt: now.toISOString(), guests: r.actualGuests ?? r.guests },
    r.id,
    now,
  );
}
export function canMarkNoShow(r: Reservation, now = new Date(), noShowMinutes = DEFAULT_SETTINGS.noShowMinutes): RuleResult {
  if (r.status !== "CONFIRMED")
    return no("Chỉ đánh dấu không đến cho lịch đã xác nhận và chưa check-in.");
  return lateMinutes(r, now) >= noShowMinutes
    ? yes
    : no(`Cần chờ ít nhất ${noShowMinutes} phút sau giờ hẹn.`);
}
export function getReservationActions(
  r: Reservation,
  now = new Date(),
  role: Role = "RECEPTIONIST",
  noShowMinutes = DEFAULT_SETTINGS.noShowMinutes,
): ReservationAction[] {
  if (!isReceptionist(role)) return [];
  switch (r.status) {
    case "PENDING":
      return ["confirm", "reject", "edit", "cancel"];
    case "CONFIRMED":
      return [
        "assign",
        "check-in",
        "edit",
        "cancel",
        ...(canMarkNoShow(r, now, noShowMinutes).ok ? ["no-show" as const] : []),
      ];
    case "ARRIVED":
      return ["assign", "handover"];
    default:
      return [];
  }
}
export function validateReservationInput(
  input: ReservationInput,
  now: Date,
  isNew = true,
  walkIn = false,
  settings?: ReservationSettings,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (input.email !== undefined && (typeof input.email !== "string" || (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)))) errors.email = "Email không hợp lệ.";
  if (input.occasion !== undefined && (typeof input.occasion !== "string" || input.occasion.length > 200)) errors.occasion = "Dịp đặc biệt không hợp lệ.";
  if (input.preorder !== undefined && (!Array.isArray(input.preorder) || input.preorder.some(p => !p || typeof p.menuItemId !== "string" || !p.menuItemId.trim() || !Number.isInteger(p.quantity) || p.quantity < 1 || p.quantity > 99 || (p.note !== undefined && (typeof p.note !== "string" || p.note.length > 300))))) errors.preorder = "Món đặt trước không hợp lệ.";
  if (!walkIn && !input.customer.name.trim()) errors.name = "Nhập tên khách.";
  if (
    input.customer.phone &&
    !/^(?:\+84|0)[0-9]{9,10}$/.test(input.customer.phone.replace(/[\s.-]/g, ""))
  )
    errors.phone = "Nhập số điện thoại Việt Nam hợp lệ (0 hoặc +84).";
  if (!Number.isInteger(input.guests) || input.guests < 1)
    errors.guests = "Số khách phải là số nguyên lớn hơn 0.";
  else if (input.guests > 200) errors.guests = "Tối đa 200 khách mỗi lịch.";
  if (
    !Number.isInteger(input.duration) ||
    input.duration < 15 ||
    input.duration > 480
  )
    errors.duration = "Thời lượng từ 15 đến 480 phút.";
  if (!Number.isFinite(new Date(input.startsAt).getTime()))
    errors.startsAt = "Ngày giờ không hợp lệ.";
  else if (isNew && !walkIn && new Date(input.startsAt) < now)
    errors.startsAt = "Không tạo lịch mới trong quá khứ.";
  else if (isNew && new Date(input.startsAt) > addMinutes(now, 365 * 1440))
    errors.startsAt = "Chỉ đặt trước tối đa 365 ngày.";
  else {
    const hours = openingHoursError(input.startsAt, errors.duration ? 0 : input.duration, settings, walkIn);
    if (hours) errors.startsAt = hours;
  }
  return errors;
}
export function matchesReservation(r: Reservation, query: string): boolean {
  return normalizeSearch(
    `${r.customer.name} ${r.customer.phone} ${r.code}`,
  ).includes(normalizeSearch(query));
}
export function selectReservations(
  state: ReceptionState,
  day: string,
  query = "",
  status = "",
) {
  return state.reservations
    .filter(
      (r) =>
        dayKey(r.startsAt) === day &&
        (!status || r.status === status) &&
        matchesReservation(r, query),
    )
    .sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
}
export function getReceptionDashboardSummary(
  state: ReceptionState,
  now = new Date(),
) {
  const today = selectReservations(state, dayKey(now));
  return {
    total: today.length,
    pending: today.filter((r) => r.status === "PENDING").length,
    upcoming: today.filter(
      (r) =>
        r.status === "CONFIRMED" &&
        new Date(r.startsAt) >= now &&
        new Date(r.startsAt) <= addMinutes(now, 120),
    ).length,
    arrived: today.filter((r) => r.status === "ARRIVED").length,
    late: today.filter(
      (r) => r.status === "CONFIRMED" && new Date(r.startsAt) < now,
    ).length,
    available: state.tables.filter((t) => t.status === "AVAILABLE").length,
  };
}
