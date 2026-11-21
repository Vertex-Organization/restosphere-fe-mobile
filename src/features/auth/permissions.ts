import type { Staff } from "./types";

export const WAITER_PERMISSIONS = [
  "table.read_assigned",
  "table.accept_handover",
  "order.create",
  "order.submit",
  "order.read",
  "order.mark_served",
  "order.request_cancel",
  "order.request_priority",
  "payment.request",
  "payment.read_status",
  "table.mark_guest_left",
  "table.mark_cleaned",
] as const;
export type WaiterPermission = (typeof WAITER_PERMISSIONS)[number];
export function hasPermission(staff: Staff | null, permission: WaiterPermission) {
  return staff?.role === "WAITER" && WAITER_PERMISSIONS.includes(permission);
}
export function requirePermission(staff: Staff | null, permission: WaiterPermission) {
  if (!hasPermission(staff, permission))
    throw new Error("Bạn không có quyền thực hiện thao tác phục vụ này.");
}
