export const TABLE_LABELS = {
  AVAILABLE: "Sẵn sàng",
  OCCUPIED: "Đang sử dụng",
  CLEANING: "Đang dọn",
  OUT_OF_SERVICE: "Tạm ngưng",
} as const;

/** Readable table code (e.g. "A05") instead of the backend UUID. Returns "—" when the table is unknown. */
export function tableCode(tables: readonly { id: string; code: string }[], id?: string | null) {
  if (!id) return "";
  return tables.find((t) => t.id === id)?.code ?? "—";
}
