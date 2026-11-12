import type { OrderItemStatus } from "./types";
export const ITEM_LABELS: Record<OrderItemStatus, string> = {
  DRAFT: "Chưa gửi", SUBMITTED: "Đã gửi bếp", PREPARING: "Đang chế biến",
  READY: "Sẵn sàng", SERVED: "Đã phục vụ", CANCELLED: "Đã hủy",
};
export const PAYMENT_LABELS = { UNPAID: "Chưa thanh toán", PAYMENT_REQUESTED: "Chờ thu ngân", PAID: "Đã thanh toán" } as const;
