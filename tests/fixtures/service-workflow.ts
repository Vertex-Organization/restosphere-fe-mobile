import type { ReceptionState } from "../../src/features/reservations/types";
import { sessionItems, sessionTotal } from "../../src/features/waiter/selectors";

/** Events from other roles; never accepted by the waiter command API. */
export type MockServiceEvent =
  | { type: "kitchen-accept"; itemId: string }
  | { type: "kitchen-ready"; itemId: string }
  | { type: "kitchen-reject"; itemId: string; reason: string }
  | { type: "kitchen-incident"; itemId: string; description: string }
  | { type: "kitchen-menu-status"; menuItemId: string; status: "AVAILABLE" | "SOLD_OUT" }
  | { type: "web-reservation"; customer: string; phone: string; guests: number; startsAt: string }
  | { type: "manager-exception-decision"; reservationId: string; approve: boolean; reason: string }
  | { type: "cashier-paid"; billId: string }
  | { type: "cashier-bill-updated"; billId: string }
  | { type: "cashier-return"; billId: string; reason: string }
  | { type: "cashier-void"; billId: string; reason: string }
  | { type: "manager-cancel-decision"; requestId: string; approve: boolean; reason: string };
export function applyMockServiceEvent(current: ReceptionState, event: MockServiceEvent, now = new Date()): ReceptionState {
  const state: ReceptionState = JSON.parse(JSON.stringify(current));
  const at = now.toISOString();
  if (event.type === "web-reservation") {
    const customer = event.customer.trim(), phone = event.phone.trim();
    if (!customer || !/^0\d{9,10}$/.test(phone) || !Number.isInteger(event.guests) || event.guests < 1 || event.guests > 20 || !Number.isFinite(new Date(event.startsAt).getTime())) throw new Error("Thông tin đặt bàn từ web không hợp lệ.");
    const rid = `r${state.nextId++}`;
    const r = { id: rid, code: `RS${rid.slice(1).padStart(4, "0")}`, customer: { name: customer, phone }, startsAt: event.startsAt, guests: event.guests, duration: 120,
      notes: "", specialRequests: "", source: "WEB" as const, status: "PENDING" as const, history: [{ at, text: "Khách đặt qua website." }] };
    state.reservations.unshift(r);
    state.notifications.unshift({ id: `n${state.nextId++}`, kind: "NEW_WEB_RESERVATION", title: "Đặt bàn mới từ web", body: `${r.code} · ${customer}`, at, read: false, reservationId: rid });
    return state;
  }
  if (event.type === "manager-exception-decision") {
    const r = state.reservations.find((x) => x.id === event.reservationId);
    const reason = event.reason.trim();
    if (!r || !state.outbox.some((m) => m.kind === "APPROVAL" && m.targetId === r.id)) throw new Error("Không có yêu cầu ngoại lệ cho lịch này.");
    if (reason.length < 5 || reason.length > 200) throw new Error("Lý do cần từ 5 đến 200 ký tự.");
    r.history.push({ at, text: `Quản lý ${event.approve ? "duyệt" : "từ chối"} yêu cầu ngoại lệ: ${reason}` });
    state.notifications.unshift({ id: `n${state.nextId++}`, kind: "REQUEST_DECIDED", title: `Yêu cầu ngoại lệ ${event.approve ? "được duyệt" : "bị từ chối"}`, body: `${r.code} · ${reason}`, at, read: false, reservationId: r.id });
    return state;
  }
  if (event.type === "kitchen-menu-status") {
    const menu = state.menuItems.find((m) => m.id === event.menuItemId);
    if (!menu) throw new Error("Không tìm thấy món trong thực đơn.");
    if (menu.status === "DISCONTINUED") throw new Error("Món đã ngừng bán, do Quản lý quản lý.");
    if (menu.status === event.status) throw new Error("Món đã ở trạng thái này.");
    menu.status = event.status;
    state.waiterNotifications.unshift({ id: `wn${state.nextId++}`, kind: "MENU_AVAILABILITY", title: event.status === "SOLD_OUT" ? `${menu.name} tạm hết` : `${menu.name} đã mở bán lại`,
      body: "Bếp cập nhật tình trạng món", at, readBy: [] });
    return state;
  }
  let sessionId: string;
  let title: string;
  let kind: "READY" | "INCIDENT" | "ITEM_REJECTED" | "PAYMENT" | "PAYMENT_RETURNED" | "PAYMENT_VOIDED" | "BILL_UPDATED" | "REQUEST_DECIDED";
  if (event.type === "manager-cancel-decision") {
    const request = state.requests.find((r) => r.id === event.requestId);
    const reason = event.reason.trim();
    if (!request || request.status !== "PENDING") throw new Error("Yêu cầu đã được xử lý hoặc không tồn tại.");
    if (reason.length < 5 || reason.length > 200) throw new Error("Lý do cần từ 5 đến 200 ký tự.");
    const item = sessionItems(state, request.sessionId).find((i) => i.id === request.itemId);
    const session = state.tableSessions.find((s) => s.id === request.sessionId);
    if (event.approve && (!item || !["PREPARING", "READY"].includes(item.status) || !session || session.closedAt || session.guestLeftAt || state.bills.find((b) => b.sessionId === session.id)?.status !== "UNPAID")) throw new Error("Món đã thay đổi, không thể hủy.");
    if (event.approve && request.amount > 500000) throw new Error("Giá trị yêu cầu vượt hạn mức phê duyệt được cấp (VNĐ).");
    request.status = event.approve ? "APPROVED" : "REJECTED";
    request.decidedBy = "NV001"; request.decidedAt = at; request.decisionNote = reason;
    if (event.approve && item) {
      item.status = "CANCELLED"; item.cancellationReason = request.reason;
      state.outbox.unshift({ id: `out${state.nextId++}`, kind: "CANCELLED", audience: "KITCHEN", targetId: item.id, at, title: `Đã hủy ${item.name}`, body: request.reason });
    }
    sessionId = request.sessionId; kind = "REQUEST_DECIDED";
    title = `${request.code} ${event.approve ? "đã được duyệt" : "bị từ chối"} · ${reason}`;
  } else if (event.type === "cashier-bill-updated") {
    const bill = state.bills.find((b) => b.id === event.billId);
    if (!bill || bill.status !== "PAYMENT_REQUESTED") throw new Error("Hóa đơn không ở trạng thái chờ thanh toán.");
    const total = sessionTotal(state, bill.sessionId);
    bill.currentAmount = total;
    bill.amount = total;
    sessionId = bill.sessionId;
    title = `Hóa đơn đã được cập nhật lại: ${total.toLocaleString("vi-VN")} ₫`;
    kind = "BILL_UPDATED";
  } else if (event.type === "cashier-return") {
    const bill = state.bills.find((b) => b.id === event.billId);
    if (!bill || bill.status !== "PAYMENT_REQUESTED") throw new Error("Chỉ trả lại yêu cầu đang chờ thanh toán.");
    const reason = event.reason.trim();
    if (reason.length < 5) throw new Error("Lý do trả lại cần ít nhất 5 ký tự.");
    bill.status = "UNPAID";
    delete bill.requestedAt;
    sessionId = bill.sessionId;
    title = `Thu ngân trả lại yêu cầu thanh toán: ${reason}`;
    kind = "PAYMENT_RETURNED";
  } else if (event.type === "cashier-void") {
    const bill = state.bills.find((b) => b.id === event.billId);
    if (!bill || bill.status !== "PAID") throw new Error("Chỉ hủy giao dịch của hóa đơn đã thanh toán.");
    if (event.reason.trim().length < 5 || event.reason.trim().length > 200) throw new Error("Lý do cần từ 5 đến 200 ký tự.");
    bill.status = "PAYMENT_REQUESTED";
    delete bill.paidAt;
    sessionId = bill.sessionId;
    title = `Giao dịch thanh toán đã bị hủy: ${event.reason}`;
    kind = "PAYMENT_VOIDED";
  } else if (event.type === "cashier-paid") {
    const bill = state.bills.find((b) => b.id === event.billId);
    if (!bill || bill.status !== "PAYMENT_REQUESTED") throw new Error("Hóa đơn chưa có yêu cầu thanh toán.");
    if (sessionItems(state, bill.sessionId).some((i) => !["SERVED", "REJECTED", "CANCELLED", "VOIDED"].includes(i.status))) throw new Error("Hóa đơn cần được đối soát trước khi thanh toán.");
    bill.status = "PAID";
    bill.paidAt = at;
    sessionId = bill.sessionId;
    title = "Thu ngân đã xác nhận thanh toán";
    kind = "PAYMENT";
  } else {
    const item = state.orderItems.find((i) => i.id === event.itemId);
    const order = state.orders.find((o) => o.id === item?.orderId);
    if (!item || !order) throw new Error("Không tìm thấy món đã gửi.");
    sessionId = order.sessionId;
    const active = state.tableSessions.find((s) => s.id === sessionId);
    if (!active || active.closedAt || active.guestLeftAt || state.bills.find((b) => b.sessionId === sessionId)?.status !== "UNPAID") throw new Error("Lượt phục vụ không còn nhận cập nhật chế biến.");
    if (event.type === "kitchen-incident") {
      const description = event.description.trim();
      if (description.length < 5 || description.length > 500) throw new Error("Description must be 5 to 500 characters.");
      title = `${item.name}: ${description}`;
      kind = "INCIDENT";
    } else if (event.type === "kitchen-accept") {
      if (item.status !== "SUBMITTED") throw new Error("Bếp chỉ nhận món mới gửi.");
      item.status = "PREPARING";
      return state;
    } else if (event.type === "kitchen-ready") {
      if (item.status !== "PREPARING") throw new Error("Bếp chỉ hoàn thành món đang chế biến.");
      item.status = "READY";
      item.readyAt = at;
      title = `${item.name} đã sẵn sàng`;
      kind = "READY";
    } else {
      if (item.status !== "SUBMITTED" || !event.reason.trim()) throw new Error("Chỉ từ chối món chưa chế biến và phải có lý do.");
      if (event.reason.trim().length < 5 || event.reason.trim().length > 200) throw new Error("Lý do cần từ 5 đến 200 ký tự.");
      item.status = "REJECTED";
      item.rejectionReason = event.reason.trim();
      title = `${item.name}: bếp từ chối · ${item.rejectionReason}`;
      kind = "ITEM_REJECTED";
    }
  }
  const session = state.tableSessions.find((s) => s.id === sessionId);
  if (!session || session.closedAt) throw new Error("Lượt phục vụ đã kết thúc.");
  state.waiterNotifications.unshift({ id: `wn${state.nextId++}`, sessionId, waiterId: session.waiterId, kind,
    title, body: `Bàn ${session.tableId}`, at, readBy: [] });
  return state;
}
