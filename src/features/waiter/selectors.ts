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
export const sessionBill = (state: ReceptionState, sessionId: string) =>
  state.bills.find((b) => {
    const session = state.tableSessions.find((s) => s.id === sessionId);
    return session?.billId ? b.id === session.billId : b.sessionId === sessionId;
  });
export const sessionTotal = (state: ReceptionState, sessionId: string) =>
  sessionItems(state, sessionId)
    .filter((i) => !["DRAFT", "REJECTED", "CANCELLED", "VOIDED"].includes(i.status))
    .reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
/** Payment closed the session; the table waits for the waiter to confirm it is cleaned. */
export const needsCleaning = (state: ReceptionState, session: TableSession) =>
  !!session.closedAt &&
  state.tables.some((t) => t.id === session.tableId && t.status === "CLEANING") &&
  !state.tableSessions.some(
    (s) => s.tableId === session.tableId && !s.closedAt,
  );
export function canViewSession(state: ReceptionState, session: TableSession) {
  if (!hasPermission(state.session, "table.read_assigned")) return false;
  if (session.waiterId === state.session?.id) return true;
  const areaId = state.session?.areaId;
  const sameArea = !areaId || state.tables.find((t) => t.id === session.tableId)?.areaId === areaId;
  return !session.waiterId && !session.closedAt && sameArea;
}
export const visibleSessions = (state: ReceptionState) =>
  state.tableSessions.filter((s) => canViewSession(state, s));
export function canViewNotification(state: ReceptionState, n: WaiterNotification) {
  if (n.kind === "MENU_AVAILABILITY") return hasPermission(state.session, "table.read_assigned");
  const session = state.tableSessions.find((s) => s.id === n.sessionId);
  return (
    !!session && canViewSession(state, session) && (!n.waiterId || n.waiterId === state.session?.id)
  );
}
export const visibleNotifications = (state: ReceptionState) =>
  state.waiterNotifications.filter((n) => canViewNotification(state, n));
export function canOrder(state: ReceptionState, session: TableSession) {
  return (
    hasPermission(state.session, "order.create") &&
    session.waiterId === state.session?.id &&
    !!session.acceptedAt &&
    !session.closedAt &&
    !session.paymentRequested &&
    (!sessionBill(state, session.id) || sessionBill(state, session.id)?.status === "UNPAID") &&
    state.tables.some((t) => t.id === session.tableId && t.status === "OCCUPIED")
  );
}
export function paymentBlockReason(state: ReceptionState, session: TableSession) {
  if (!canOrder(state, session))
    return "Lượt phục vụ không ở trạng thái có thể yêu cầu thanh toán.";
  if (state.drafts.some((d) => d.sessionId === session.id))
    return "Còn món trong giỏ chưa gửi. Hãy gửi hoặc xóa giỏ trước.";
  const items = sessionItems(state, session.id).filter(
    (i) => !["DRAFT", "REJECTED", "CANCELLED", "VOIDED"].includes(i.status),
  );
  if (!items.length) return "Chưa có món hợp lệ để thanh toán.";
  if (items.some((i) => i.status !== "SERVED"))
    return "Cần phục vụ hết món trước khi yêu cầu thanh toán.";
  return "";
}
export function serviceLabel(state: ReceptionState, session: TableSession) {
  if (needsCleaning(state, session)) return "Cần dọn bàn";
  if (session.closedAt) return "Đã hoàn tất";
  if (!session.acceptedAt) return "Chờ tiếp nhận";
  const status = sessionBill(state, session.id)?.status;
  if (status === "PAID") return "Đã thanh toán";
  if (session.paymentRequested || status === "PAYMENT_REQUESTED") return "Chờ thanh toán";
  return "Đang phục vụ";
}
