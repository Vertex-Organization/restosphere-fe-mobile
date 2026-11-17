import { authenticatedRequest } from "../features/auth/api";
import type { ReceptionCommand, ReceptionState } from "../features/reservations/types";
import type { WaiterCommand } from "../features/waiter/types";

export type Snapshot = Omit<ReceptionState, "session">;
export function mapSnapshot(data: Snapshot, staffId: string): Snapshot {
  const collections = ["areas", "tables", "reservations", "notifications", "assignments", "employees", "tableSessions", "menuCategories", "menuItems", "orders", "orderItems", "drafts", "bills", "waiterNotifications", "requests", "outbox"] as const;
  if (!data || collections.some(key => !Array.isArray(data[key])) || !data.settings || !Number.isFinite(data.settings.bufferMinutes) || !Number.isFinite(data.settings.noShowMinutes)) {
    throw new Error("Dữ liệu khu làm việc không hợp lệ. Vui lòng tải lại.");
  }
  return { ...data,
    waiterNotifications: data.waiterNotifications.map(n => {
      const target = n.sessionId;
      const request = data.requests.find(r => r.id === target);
      const order = data.orders.find(o => o.id === target);
      const item = data.orderItems.find(i => i.id === target);
      return { ...n, sessionId: request?.sessionId ?? order?.sessionId ?? data.orders.find(o => o.id === item?.orderId)?.sessionId ?? target };
    }),
    reservations: data.reservations.map(r => ({ ...r, notes: r.notes ?? "", specialRequests: r.specialRequests ?? "" })),
    menuItems: data.menuItems.map(item => ({ ...item, notes: (item as typeof item & { description?: string }).description ?? "" })),
    notifications: data.notifications.map(n => {
      const wire = n as typeof n & { readBy: string[]; targetId?: string };
      return { ...n, read: wire.readBy.includes(staffId),
        reservationId: data.reservations.some(r => r.id === wire.targetId) ? wire.targetId : undefined,
        tableId: data.tables.some(t => t.id === wire.targetId) ? wire.targetId : undefined };
    }),
  };
}
export const loadWorkspace = () => authenticatedRequest<Snapshot>("workspaces/staff");
export async function sendCommand(command: ReceptionCommand | WaiterCommand) {
  const result = await authenticatedRequest<{ data: Snapshot; state: Snapshot; summary: string; reservationId?: string }>("workspaces/staff/commands", command);
  if (!result?.data || typeof result.summary !== "string" ||
      (command.type === "create" && !result.reservationId)) {
    throw new Error("Phản hồi thao tác không hợp lệ. Tải lại dữ liệu trước khi thử lại.");
  }
  return result;
}
