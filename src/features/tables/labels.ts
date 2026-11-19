export const TABLE_LABELS = {
  AVAILABLE: "Sẵn sàng",
  OCCUPIED: "Đang sử dụng",
  CLEANING: "Đang dọn",
  OUT_OF_SERVICE: "Tạm ngưng",
} as const;
export const tableCode = (tables: { id: string; code: string }[], id?: string) =>
  tables.find((t) => t.id === id)?.code ?? "—";
