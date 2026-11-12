import { requirePermission, type WaiterPermission } from "../auth/permissions";
import type { ReceptionState } from "../reservations/types";
import type { WaiterCommand } from "./types";
import { canOrder, canViewNotification, paymentBlockReason, sessionBill, sessionItems, sessionTotal } from "./selectors";

const permissions: Record<WaiterCommand["type"], WaiterPermission> = {
  accept: "table.accept_handover", "add-draft": "order.create", "edit-draft": "order.create",
  "remove-draft": "order.create", submit: "order.submit", serve: "order.mark_served",
  "request-payment": "payment.request", "guest-left": "table.mark_guest_left", clean: "table.mark_cleaned",
  "read-notification": "table.read_assigned",
};
export function executeWaiterCommand(current: ReceptionState, command: WaiterCommand, now = new Date()): ReceptionState {
  const permission = permissions[command.type];
  if (!permission) throw new Error("Thao tác không thuộc quyền phục vụ.");
  requirePermission(current.session, permission);
  const state: ReceptionState = JSON.parse(JSON.stringify(current));
  const staff = state.session!;
  const at = now.toISOString();
  const id = (prefix: string) => `${prefix}${state.nextId++}`;
  if (command.type === "read-notification") {
    state.waiterNotifications.forEach((n) => {
      if ((!command.id || n.id === command.id) && canViewNotification(state, n) && !n.readBy.includes(staff.id)) n.readBy.push(staff.id);
    });
    return state;
  }
  const session = state.tableSessions.find((s) => s.id === command.sessionId);
  if (!session || session.closedAt) throw new Error("Không tìm thấy lượt phục vụ đang hoạt động.");
  const table = state.tables.find((t) => t.id === session.tableId);
  const reservation = state.reservations.find((r) => r.id === session.reservationId);
  if (!table || !reservation) throw new Error("Thông tin bàn hoặc khách không còn tồn tại.");
  const bill = sessionBill(state, session.id);
  if (!bill) throw new Error("Không tìm thấy thông tin hóa đơn.");
  const notify = (title: string) => state.waiterNotifications.unshift({
    id: id("wn"), sessionId: session.id, waiterId: staff.id, kind: "TABLE", title,
    body: `Bàn ${table.code}`, at, readBy: [],
  });
  if (command.type === "accept") {
    if (session.waiterId || session.acceptedAt || session.guestLeftAt || table.status !== "OCCUPIED" || reservation.status !== "SEATED" || !reservation.handedOverAt)
      throw new Error("Bàn chưa được bàn giao hoặc đã có nhân viên tiếp nhận.");
    session.waiterId = staff.id;
    session.acceptedAt = at;
    reservation.history.push({ at, text: `${staff.name} tiếp nhận phục vụ.` });
    notify("Đã tiếp nhận phục vụ");
    return state;
  }
  if (session.waiterId !== staff.id || !session.acceptedAt) throw new Error("Bạn không phụ trách lượt phục vụ này.");
  if (["add-draft", "edit-draft", "remove-draft", "submit"].includes(command.type) && !canOrder(state, session))
    throw new Error("Bàn đã khóa gọi món hoặc không còn đang phục vụ.");
  switch (command.type) {
    case "add-draft": {
      const menu = state.menuItems.find((m) => m.id === command.menuItemId);
      if (!menu || menu.status !== "AVAILABLE") throw new Error("Món đã hết hoặc ngừng bán.");
      const existing = state.drafts.find((d) => d.sessionId === session.id && d.waiterId === staff.id && d.menuItemId === menu.id && !d.note);
      if (existing) {
        if (existing.quantity >= 99) throw new Error("Mỗi dòng tối đa 99 phần.");
        existing.quantity++;
      } else state.drafts.push({ id: id("draft"), sessionId: session.id, waiterId: staff.id, menuItemId: menu.id, quantity: 1, note: "" });
      break;
    }
    case "edit-draft":
    case "remove-draft": {
      const draft = state.drafts.find((d) => d.id === command.draftId && d.sessionId === session.id && d.waiterId === staff.id);
      if (!draft) throw new Error("Không tìm thấy món trong giỏ chưa gửi.");
      if (command.type === "remove-draft") state.drafts = state.drafts.filter((d) => d.id !== draft.id);
      else {
        if (!Number.isInteger(command.quantity) || command.quantity < 1 || command.quantity > 99) throw new Error("Số lượng phải là số nguyên từ 1 đến 99.");
        if (command.note.length > 300) throw new Error("Ghi chú tối đa 300 ký tự.");
        draft.quantity = command.quantity;
        draft.note = command.note;
      }
      break;
    }
    case "submit": {
      const drafts = state.drafts.filter((d) => d.sessionId === session.id && d.waiterId === staff.id);
      if (!drafts.length) throw new Error("Giỏ món đang trống.");
      for (const d of drafts) {
        const menu = state.menuItems.find((m) => m.id === d.menuItemId);
        if (!menu || menu.status !== "AVAILABLE") throw new Error(`${menu?.name ?? "Món"} đã hết hoặc ngừng bán. Xóa món khỏi giỏ để tiếp tục.`);
        if (!Number.isInteger(d.quantity) || d.quantity < 1 || d.quantity > 99 || d.note.length > 300) throw new Error("Số lượng hoặc ghi chú không hợp lệ.");
        if (!Number.isFinite(menu.price) || menu.price < 0) throw new Error("Giá món không hợp lệ.");
      }
      const orderId = id("order");
      state.orders.push({ id: orderId, sessionId: session.id, waiterId: staff.id, submittedAt: at, sequence: state.orders.filter((o) => o.sessionId === session.id).length + 1 });
      drafts.forEach((d) => {
        const menu = state.menuItems.find((m) => m.id === d.menuItemId)!;
        state.orderItems.push({ id: id("item"), orderId, menuItemId: menu.id, name: menu.name, unitPrice: menu.price, quantity: d.quantity, note: d.note, status: "SUBMITTED", submittedAt: at });
      });
      const sent = new Set(drafts.map((d) => d.id));
      state.drafts = state.drafts.filter((d) => !sent.has(d.id));
      break;
    }
    case "serve": {
      if (session.guestLeftAt || table.status !== "OCCUPIED" || bill.status !== "UNPAID") throw new Error("Lượt phục vụ không còn nhận món.");
      const item = sessionItems(state, session.id).find((i) => i.id === command.itemId);
      if (!item || item.status !== "READY") throw new Error("Chỉ xác nhận phục vụ khi món đã sẵn sàng.");
      item.status = "SERVED";
      item.servedAt = at;
      break;
    }
    case "request-payment": {
      const reason = paymentBlockReason(state, session);
      if (reason) throw new Error(reason);
      bill.status = "PAYMENT_REQUESTED";
      bill.requestedAt = at;
      bill.amount = sessionTotal(state, session.id);
      notify("Đã gửi yêu cầu thanh toán");
      break;
    }
    case "guest-left": {
      if (!command.confirmed) throw new Error("Cần xác nhận khách thực sự đã rời bàn.");
      if (bill.status !== "PAID" || session.guestLeftAt || table.status !== "OCCUPIED") throw new Error("Chỉ xác nhận khách rời sau khi đã thanh toán và bàn còn khách.");
      session.guestLeftAt = at;
      table.status = "CLEANING";
      notify("Khách đã rời · cần dọn bàn");
      break;
    }
    case "clean": {
      if (!command.confirmed) throw new Error("Cần xác nhận bàn thực sự đã dọn xong.");
      if (!session.guestLeftAt || bill.status !== "PAID" || table.status !== "CLEANING") throw new Error("Chỉ dọn xong khi khách đã rời và bàn đang dọn.");
      if (state.tableSessions.some((s) => s.id !== session.id && s.tableId === table.id && !s.closedAt)) throw new Error("Bàn còn lượt sử dụng khác chưa kết thúc.");
      if (state.reservations.some((r) => r.id !== reservation.id && r.tableId === table.id && ["ARRIVED", "SEATED"].includes(r.status))) throw new Error("Bàn còn khách hoặc lượt check-in khác.");
      if (state.drafts.some((d) => d.sessionId === session.id) || sessionItems(state, session.id).some((i) => !["SERVED", "CANCELLED"].includes(i.status))) throw new Error("Lượt phục vụ còn món chưa xử lý.");
      session.closedAt = at;
      reservation.status = "COMPLETED";
      reservation.history.push({ at, text: `${staff.name} xác nhận khách rời và bàn đã dọn.` });
      state.assignments.forEach((a) => { if (a.reservationId === reservation.id && !a.releasedAt) a.releasedAt = at; });
      table.status = "AVAILABLE";
      notify("Bàn đã dọn · sẵn sàng đón khách");
      // Also notify reception through its existing notification collection.
      state.notifications.unshift({ id: id("n"), title: "Bàn đã sẵn sàng", body: `Bàn ${table.code} đã dọn xong.`, at, read: false, tableId: table.id, reservationId: reservation.id });
      break;
    }
    default: throw new Error("Thao tác không hợp lệ.");
  }
  return state;
}
