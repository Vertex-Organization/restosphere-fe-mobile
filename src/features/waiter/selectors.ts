import type { ReceptionState } from "../reservations/types";
import type { TableSession, WaiterNotification } from "./types";
import { hasPermission } from "../auth/permissions";

export const money = (amount: number) => `${amount.toLocaleString("vi-VN")} ₫`;
export const sessionItems = (state: ReceptionState, sessionId: string) => {
  const orderIds = new Set(state.orders.filter((o) => o.sessionId === sessionId).map((o) => o.id));
  return state.orderItems.filter((i) => orderIds.has(i.orderId));
};
export const sessionDrafts = (state: ReceptionState, sessionId: string) =>
  state.drafts.filter((d) => d.sessionId === sessionId && d.waiterId === state.session?.id);
export const sessionBill = (state: ReceptionState, sessionId: string) => state.bills.find((b) => b.sessionId === sessionId);
export const sessionTotal = (state: ReceptionState, sessionId: string) =>
  sessionItems(state, sessionId).filter((i) => i.status !== "CANCELLED").reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
export function canViewSession(state: ReceptionState, session: TableSession) {
  return hasPermission(state.session, "table.read_assigned") &&
    (session.waiterId === state.session?.id || (!session.waiterId && !session.closedAt));
}
export const visibleSessions = (state: ReceptionState) => state.tableSessions.filter((s) => canViewSession(state, s));
export function canViewNotification(state: ReceptionState, n: WaiterNotification) {
  const session = state.tableSessions.find((s) => s.id === n.sessionId);
  return !!session && canViewSession(state, session) && (!n.waiterId || n.waiterId === state.session?.id);
}
export const visibleNotifications = (state: ReceptionState) => state.waiterNotifications.filter((n) => canViewNotification(state, n));
export function canOrder(state: ReceptionState, session: TableSession) {
  return hasPermission(state.session, "order.create") && session.waiterId === state.session?.id &&
    !!session.acceptedAt && !session.guestLeftAt && !session.closedAt &&
    sessionBill(state, session.id)?.status === "UNPAID" &&
    state.tables.some((t) => t.id === session.tableId && t.status === "OCCUPIED");
}
export function paymentBlockReason(state: ReceptionState, session: TableSession) {
  if (!canOrder(state, session)) return "Lượt phục vụ không ở trạng thái có thể yêu cầu thanh toán.";
  if (state.drafts.some((d) => d.sessionId === session.id)) return "Còn món trong giỏ chưa gửi. Hãy gửi hoặc xóa giỏ trước.";
  const items = sessionItems(state, session.id).filter((i) => i.status !== "CANCELLED");
  if (!items.length) return "Chưa có món hợp lệ để thanh toán.";
  if (items.some((i) => i.status !== "SERVED")) return "Cần phục vụ hết món trước khi yêu cầu thanh toán.";
  return "";
}
export function serviceLabel(state: ReceptionState, session: TableSession) {
  if (session.closedAt) return "Đã hoàn tất";
  if (session.guestLeftAt) return "Đang dọn";
  if (!session.acceptedAt) return "Chờ tiếp nhận";
  const status = sessionBill(state, session.id)?.status;
  if (status === "PAID") return "Đã thanh toán · khách tại bàn";
  if (status === "PAYMENT_REQUESTED") return "Chờ thanh toán";
  return "Đang phục vụ";
}
