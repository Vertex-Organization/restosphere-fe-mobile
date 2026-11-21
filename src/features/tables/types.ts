export type TableStatus = "AVAILABLE" | "OCCUPIED" | "CLEANING" | "OUT_OF_SERVICE";
export interface RestaurantArea {
  id: string;
  name: string;
}
export interface RestaurantTable {
  id: string;
  code: string;
  areaId: string;
  capacity: number;
  status: TableStatus;
}
