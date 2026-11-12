import type { ReceptionState } from "../features/reservations/types";
import { sessionItems, sessionTotal } from "../features/waiter/selectors";

/** Events from other roles; never accepted by the waiter command API. */
export type MockServiceEvent =
  | { type: "kitchen-accept"; itemId: string }
  | { type: "kitchen-ready"; itemId: string }
  | { type: "kitchen-reject"; itemId: string; reason: string }
  | { type: "cashier-paid"; billId: string };
export function applyMockServiceEvent(current: ReceptionState, event: MockServiceEvent, now = new Date()): ReceptionState {
  const state: ReceptionState = JSON.parse(JSON.stringify(current));
  const at = now.toISOString();
  let sessionId: string;
  let title: string;
  let kind: "READY" | "REJECTED" | "PAYMENT";
  if (event.type === "cashier-paid") {
    const bill = state.bills.find((b) => b.id === event.billId);
    if (!bill || bill.status !== "PAYMENT_REQUESTED") throw new Error("Hóa đơn chưa có yêu cầu thanh toán.");
    if (bill.amount !== sessionTotal(state, bill.sessionId) || sessionItems(state, bill.sessionId).some((i) => !["SERVED", "CANCELLED"].includes(i.status))) throw new Error("Hóa đơn cần được đối soát trước khi thanh toán.");
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
    if (event.type === "kitchen-accept") {
      if (item.status !== "SUBMITTED") throw new Error("Bếp chỉ nhận món mới gửi.");
      item.status = "PREPARING";
      return state;
    }
    if (event.type === "kitchen-ready") {
      if (item.status !== "PREPARING") throw new Error("Bếp chỉ hoàn thành món đang chế biến.");
      item.status = "READY";
      item.readyAt = at;
      title = `${item.name} đã sẵn sàng`;
      kind = "READY";
    } else {
      if (item.status !== "SUBMITTED" || !event.reason.trim()) throw new Error("Chỉ từ chối món chưa chế biến và phải có lý do.");
      item.status = "CANCELLED";
      item.cancellationReason = event.reason.trim();
      title = `${item.name}: bếp từ chối · ${item.cancellationReason}`;
      kind = "REJECTED";
    }
  }
  const session = state.tableSessions.find((s) => s.id === sessionId);
  if (!session || session.closedAt) throw new Error("Lượt phục vụ đã kết thúc.");
  state.waiterNotifications.unshift({ id: `wn${state.nextId++}`, sessionId, waiterId: session.waiterId, kind,
    title, body: `Bàn ${session.tableId}`, at, readBy: [] });
  return state;
}
