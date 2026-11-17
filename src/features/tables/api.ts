import { authenticatedGet } from "../auth/api";
import type { RestaurantArea, RestaurantTable } from "./types";

export async function loadTables() {
  const [areas, tables] = await Promise.all([
    authenticatedGet<RestaurantArea[]>("areas"),
    authenticatedGet<RestaurantTable[]>("tables"),
  ]);
  return { areas, tables };
}
