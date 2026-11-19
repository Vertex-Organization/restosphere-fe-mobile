import { apiBaseUrl } from "../auth/api";
import type { MenuCategory, MenuItem } from "./types";

async function get<T>(path: string): Promise<T> {
  const base = apiBaseUrl();
  if (!base) throw new Error("Chưa cấu hình EXPO_PUBLIC_API_URL.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${base}/menu/${path}`, { signal: controller.signal });
    if (!response.ok) throw new Error("Không tải được thực đơn từ máy chủ.");
    return await response.json() as T;
  } finally { clearTimeout(timer); }
}

export async function loadMenu() {
  const [menuCategories, items] = await Promise.all([
    get<MenuCategory[]>("categories"),
    get<(Omit<MenuItem, "notes"> & { description: string | null })[]>("items"),
  ]);
  return { menuCategories, menuItems: items.map(item => ({ ...item, notes: item.description ?? "" })) };
}
