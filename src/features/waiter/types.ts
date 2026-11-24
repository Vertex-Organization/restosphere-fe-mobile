import type { Staff } from "../auth/types";
import type { Bill } from "../billing/types";
import type { MenuCategory, MenuItem } from "../menu/types";
import type { DraftItem, Order, OrderItem } from "../orders/types";

export interface TableSession {
  id: string;
  tableId: string;
  reservationId: string;
  billId?: string;
  guests?: number;
  paymentRequested?: boolean;
  waiterId?: string;
  handedOverAt: string;
  acceptedAt?: string;
  guestLeftAt?: string;
  closedAt?: string;
}
export interface WaiterNotification {
  id: string;
  sessionId?: string;
  waiterId?: string;
  kind:
    | "HANDOVER"
    | "READY"
    | "TABLE_REASSIGNED"
    | "MENU_AVAILABILITY"
    | "ITEM_REJECTED"
    | "PAYMENT"
    | "PAYMENT_RETURNED"
    | "PAYMENT_VOIDED"
    | "BILL_UPDATED"
    | "TABLE"
    | "INCIDENT"
    | "REQUEST_DECIDED";
  title: string;
  body: string;
  at: string;
  readBy: string[];
}
export interface CancelItemRequest {
  id: string;
  code: string;
  type: "CANCEL_ITEM";
  status: "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";
  targetType: "ORDER_ITEM";
  targetId: string;
  itemId: string;
  sessionId: string;
  amount: number;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  decidedBy?: string;
  decidedAt?: string;
  decisionNote?: string;
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
  requests: CancelItemRequest[];
  outbox: {
    id: string;
    kind: "APPROVAL" | "CANCELLED" | "PRIORITY" | "PAYMENT_REQUEST" | "PAYMENT_REQUEST_WITHDRAWN";
    audience: "MANAGER" | "KITCHEN" | "CASHIER";
    targetId: string;
    at: string;
    title: string;
    body: string;
  }[];
}
export type WaiterCommand =
  | { type: "accept"; sessionId: string }
  | { type: "add-draft"; sessionId: string; menuItemId: string }
  | { type: "edit-draft"; sessionId: string; draftId: string; quantity: number; note: string }
  | { type: "remove-draft"; sessionId: string; draftId: string }
  | { type: "submit" | "request-payment" | "withdraw-payment-request"; sessionId: string }
  | { type: "serve"; sessionId: string; itemId: string }
  | { type: "request-cancel"; sessionId: string; itemId: string; reason: string }
  | { type: "request-priority"; sessionId: string; orderId: string; reason: string }
  | { type: "guest-left" | "clean"; sessionId: string; confirmed: boolean }
  | { type: "read-notification"; id?: string };
