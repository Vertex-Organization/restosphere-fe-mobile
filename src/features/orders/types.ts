export type OrderItemStatus = "DRAFT" | "SUBMITTED" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";
export interface Order {
  id: string;
  sessionId: string;
  waiterId: string;
  submittedAt: string;
  sequence: number;
}
export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  note: string;
  status: Exclude<OrderItemStatus, "DRAFT">;
  submittedAt: string;
  readyAt?: string;
  servedAt?: string;
  cancellationReason?: string;
}
export interface DraftItem {
  id: string;
  sessionId: string;
  waiterId: string;
  menuItemId: string;
  quantity: number;
  note: string;
}
