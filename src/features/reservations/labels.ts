export const STATUS_LABELS = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  ARRIVED: "Đã đến",
  SEATED: "Đã bàn giao",
  COMPLETED: "Đã kết thúc",
  REJECTED: "Từ chối",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Không đến",
} as const;
export const SOURCE_LABELS = {
  WEB: "Khách đặt qua website",
  PHONE: "Gọi điện",
  WALK_IN: "Khách trực tiếp",
} as const;
