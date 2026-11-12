import type { Staff } from "../auth/types";
import type { Bill } from "../billing/types";
import type { MenuCategory, MenuItem } from "../menu/types";
import type { DraftItem, Order, OrderItem } from "../orders/types";

export interface TableSession {
  id: string;
  tableId: string;
  reservationId: string;
  waiterId?: string;
  handedOverAt: string;
  acceptedAt?: string;
  guestLeftAt?: string;
  closedAt?: string;
}
export interface WaiterNotification {
  id: string;
  sessionId: string;
  waiterId?: string;
  kind: "HANDOVER" | "READY" | "REJECTED" | "PAYMENT" | "TABLE";
  title: string;
  body: string;
  at: string;
  readBy: string[];
}
export interface ServiceData {
  serviceVersion: 1;
  employees: Staff[];
  tableSessions: TableSession[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  orders: Order[];
  orderItems: OrderItem[];
  drafts: DraftItem[];
  bills: Bill[];
  waiterNotifications: WaiterNotification[];
}
export type WaiterCommand =
  | { type: "accept"; sessionId: string }
  | { type: "add-draft"; sessionId: string; menuItemId: string }
  | { type: "edit-draft"; sessionId: string; draftId: string; quantity: number; note: string }
  | { type: "remove-draft"; sessionId: string; draftId: string }
  | { type: "submit" | "request-payment"; sessionId: string }
  | { type: "serve"; sessionId: string; itemId: string }
  | { type: "guest-left" | "clean"; sessionId: string; confirmed: boolean }
  | { type: "read-notification"; id?: string };
