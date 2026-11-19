export const TABLE_LABELS = {
  AVAILABLE: "Sẵn sàng",
  OCCUPIED: "Đang sử dụng",
  CLEANING: "Đang dọn",
  OUT_OF_SERVICE: "Tạm ngưng",
} as const;

/** Mã bàn dễ đọc (vd. "A05") thay cho id UUID từ backend. Không tìm thấy bàn thì trả "—". */
export function tableCode(tables: readonly { id: string; code: string }[], id?: string | null) {
  if (!id) return "";
  return tables.find((t) => t.id === id)?.code ?? "—";
}
