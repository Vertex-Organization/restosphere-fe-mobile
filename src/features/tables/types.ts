export type TableStatus = "AVAILABLE" | "OCCUPIED" | "CLEANING" | "OUT_OF_SERVICE";
export interface RestaurantArea {
  id: string;
  name: string;
  active?: boolean;
  sortOrder?: number;
}
export interface RestaurantTable {
  id: string;
  code: string;
  areaId: string;
  capacity: number;
  status: TableStatus;
}
