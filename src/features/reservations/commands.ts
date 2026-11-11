import { isReceptionist } from "../auth/roles";
import { STATUS_LABELS } from "./labels";
import {
  canAssignTable,
  canCheckIn,
  canConfirmReservation,
  canHandover,
  canMarkNoShow,
  getAvailableTables,
  getReservationActions,
  isTableAvailableForTimeRange,
  validateReservationInput,
} from "./rules";
import type {
  ReceptionCommand,
  ReceptionState,
  Reservation,
  RuleResult,
} from "./types";

function assertRule(result: RuleResult): void {
  if (!result.ok) throw new Error(result.reason);
}
export function executeCommand(
  current: ReceptionState,
  command: ReceptionCommand,
  now = new Date(),
): { state: ReceptionState; reservationId?: string } {
  if (!isReceptionist(current.session?.role))
    throw new Error("Bạn không có quyền thao tác trong module Lễ tân.");
  // State contains JSON data only; avoid relying on structuredClone in Hermes.
  const state = JSON.parse(JSON.stringify(current)) as ReceptionState;
  const at = now.toISOString();
  const id = () => String(state.nextId++);
  const notify = (title: string, r: Reservation) =>
    state.notifications.unshift({
      id: `n${id()}`,
      title,
      body: `${r.code} · ${r.customer.name}`,
      at,
      read: false,
      reservationId: r.id,
    });
  const release = (reservationId: string) =>
    state.assignments.forEach((a) => {
      if (a.reservationId === reservationId && !a.releasedAt) a.releasedAt = at;
    });
  const assign = (r: Reservation, tableId: string) => {
    if (
      r.tableId === tableId &&
      state.assignments.some(
        (a) =>
          a.reservationId === r.id && a.tableId === tableId && !a.releasedAt,
      )
    )
      return;
    release(r.id);
    r.tableId = tableId;
    state.assignments.push({
      id: `a${id()}`,
      reservationId: r.id,
      tableId,
      assignedAt: at,
    });
  };
  if (command.type === "read") {
    state.notifications.forEach((n) => {
      if (!command.id || n.id === command.id) n.read = true;
    });
    return { state };
  }
  if (command.type === "create") {
    const input = {
      ...command.input,
      customer: {
        name:
          command.input.customer.name.trim() ||
          (command.walkIn ? "Khách trực tiếp" : ""),
        phone: command.input.customer.phone.trim(),
      },
      startsAt: command.walkIn ? at : command.input.startsAt,
    };
    const errors = validateReservationInput(input, now, true, command.walkIn);
    if (Object.keys(errors).length)
      throw new Error(Object.values(errors).join(" "));
    if (!getAvailableTables(state, input, undefined, now).length)
      throw new Error(
        "Chưa có khả năng tiếp nhận: không có bàn phù hợp trong khung giờ này.",
      );
    if (command.walkIn && !input.tableId)
      throw new Error("Chọn bàn sẵn sàng để tiếp nhận khách trực tiếp.");
    if (input.tableId) {
      const table = state.tables.find((t) => t.id === input.tableId);
      if (!table) throw new Error("Không tìm thấy bàn.");
      assertRule(
        isTableAvailableForTimeRange(state, table, input, undefined, now),
      );
      if (command.walkIn && table.status !== "AVAILABLE")
        throw new Error("Bàn phải sẵn sàng để tiếp nhận ngay.");
    }
    const reservationId = `r${id()}`;
    const r: Reservation = {
      ...input,
      id: reservationId,
      code: `RS${reservationId.slice(1).padStart(4, "0")}`,
      status: command.walkIn ? "ARRIVED" : "PENDING",
      source: command.walkIn ? "WALK_IN" : "PHONE",
      history: [
        {
          at,
          text: command.walkIn
            ? "Tiếp nhận khách trực tiếp, đã check-in."
            : "Lễ tân tạo yêu cầu qua điện thoại.",
        },
      ],
      actualGuests: command.walkIn ? input.guests : undefined,
      arrivedAt: command.walkIn ? at : undefined,
    };
    state.reservations.unshift(r);
    if (r.tableId && command.walkIn) assign(r, r.tableId);
    notify(
      command.walkIn ? "Khách trực tiếp đã đến" : "Lịch mới chờ xác nhận",
      r,
    );
    return { state, reservationId };
  }
  const r = state.reservations.find((item) => item.id === command.id);
  if (!r) throw new Error("Không tìm thấy lịch đặt.");
  const action = command.type === "edit" ? "edit" : command.type;
  if (!getReservationActions(r, now, state.session!.role).includes(action)) {
    if (command.type === "check-in") assertRule(canCheckIn(r));
    if (command.type === "no-show") assertRule(canMarkNoShow(r, now));
    throw new Error("Thao tác không được phép ở trạng thái hiện tại.");
  }
  switch (command.type) {
    case "confirm": {
      assertRule(canConfirmReservation(state, r, now));
      const tableId =
        r.tableId ?? getAvailableTables(state, r, r.id, now)[0]?.id;
      if (!tableId) throw new Error("Không còn bàn phù hợp.");
      r.status = "CONFIRMED";
      assertRule(canAssignTable(state, r, tableId, now));
      assign(r, tableId);
      r.history.push({
        at,
        text: `Xác nhận và giữ bàn ${tableId} theo chính sách demo.`,
      });
      notify("Lịch đã xác nhận", r);
      break;
    }
    case "reject":
    case "cancel":
    case "no-show": {
      if (!command.reason?.trim()) throw new Error("Vui lòng nhập lý do.");
      if (command.type === "no-show") assertRule(canMarkNoShow(r, now));
      r.status =
        command.type === "reject"
          ? "REJECTED"
          : command.type === "cancel"
            ? "CANCELLED"
            : "NO_SHOW";
      r.reason = command.reason.trim();
      release(r.id);
      r.history.push({ at, text: `${STATUS_LABELS[r.status]}: ${r.reason}` });
      notify(
        command.type === "cancel"
          ? "Lịch bị hủy"
          : command.type === "reject"
            ? "Yêu cầu bị từ chối"
            : "Khách không đến",
        r,
      );
      break;
    }
    case "edit": {
      const errors = validateReservationInput(
        command.input,
        now,
        command.input.startsAt !== r.startsAt,
      );
      if (Object.keys(errors).length)
        throw new Error(Object.values(errors).join(" "));
      if (r.status === "CONFIRMED" && !command.input.tableId)
        throw new Error("Lịch đã xác nhận cần giữ một bàn. Hãy dùng Đổi bàn.");
      if (command.input.tableId) {
        const table = state.tables.find((t) => t.id === command.input.tableId);
        if (!table) throw new Error("Không tìm thấy bàn.");
        assertRule(
          isTableAvailableForTimeRange(state, table, command.input, r.id, now),
        );
      } else if (!getAvailableTables(state, command.input, r.id, now).length)
        throw new Error("Không có bàn đáp ứng thông tin mới.");
      const oldTable = r.tableId;
      // Only editable fields may cross this boundary; status, IDs, arrival data
      // and history are owned by commands, including when backed by a future API.
      Object.assign(r, {
        startsAt: command.input.startsAt,
        guests: command.input.guests,
        duration: command.input.duration,
        areaId: command.input.areaId,
        tableId: command.input.tableId,
        notes: command.input.notes,
        specialRequests: command.input.specialRequests,
        customer: {
          name: command.input.customer.name.trim(),
          phone: command.input.customer.phone.trim(),
        },
      });
      if (oldTable !== r.tableId) {
        release(r.id);
        if (r.tableId && r.status === "CONFIRMED") assign(r, r.tableId);
      }
      r.history.push({ at, text: "Cập nhật thông tin đặt bàn." });
      notify("Thông tin đặt bàn thay đổi", r);
      break;
    }
    case "assign":
      assertRule(canAssignTable(state, r, command.tableId, now));
      assign(r, command.tableId);
      r.history.push({ at, text: `Gán bàn ${command.tableId}.` });
      notify("Thay đổi bàn", r);
      break;
    case "check-in":
      assertRule(canCheckIn(r));
      if (!Number.isInteger(command.actualGuests) || command.actualGuests < 1)
        throw new Error("Số khách thực tế phải là số nguyên lớn hơn 0.");
      r.status = "ARRIVED";
      r.actualGuests = command.actualGuests;
      r.arrivedAt = at;
      r.history.push({
        at,
        text: `Khách đã đến · ${command.actualGuests} khách thực tế.`,
      });
      notify("Khách đã check-in", r);
      break;
    case "handover":
      assertRule(canHandover(state, r, now));
      r.status = "SEATED";
      r.handedOverAt = at;
      state.tables.find((t) => t.id === r.tableId)!.status = "OCCUPIED";
      r.history.push({
        at,
        text: "Đã bàn giao khách cho phục vụ. Lễ tân chỉ được xem.",
      });
      notify("Đã bàn giao cho phục vụ", r);
      break;
  }
  return { state, reservationId: r.id };
}
