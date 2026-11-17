export interface MenuCategory { id: string; name: string }
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  status: "AVAILABLE" | "SOLD_OUT" | "DISCONTINUED";
  notes: string;
  imageUrl?: string | null;
}
