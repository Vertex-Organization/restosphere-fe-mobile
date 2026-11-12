import type { Staff } from "../auth/types";
import type { ReceptionNotification } from "../notifications/types";
import type { RestaurantArea, RestaurantTable } from "../tables/types";
import type { ServiceData } from "../waiter/types";

export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ARRIVED"
  | "SEATED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "NO_SHOW";
export interface Customer {
  name: string;
  phone: string;
}
export interface ReservationInput {
  customer: Customer;
  startsAt: string;
  guests: number;
  duration: number;
  areaId?: string;
  tableId?: string;
  notes: string;
  specialRequests: string;
}
export interface Reservation extends ReservationInput {
  id: string;
  code: string;
  status: ReservationStatus;
  source: "WEB" | "PHONE" | "WALK_IN";
  actualGuests?: number;
  arrivedAt?: string;
  handedOverAt?: string;
  reason?: string;
  history: { at: string; text: string }[];
}
export interface TableAssignment {
  id: string;
  reservationId: string;
  tableId: string;
  assignedAt: string;
  releasedAt?: string;
}
export interface ReceptionState extends ServiceData {
  version: 1;
  seedDay: string;
  session: Staff | null;
  areas: RestaurantArea[];
  tables: RestaurantTable[];
  reservations: Reservation[];
  notifications: ReceptionNotification[];
  assignments: TableAssignment[];
  nextId: number;
}
export interface ReceptionRepository {
  load(): Promise<ReceptionState>;
  save(state: ReceptionState): Promise<void>;
}
export type ReservationAction =
  | "confirm"
  | "reject"
  | "cancel"
  | "edit"
  | "assign"
  | "check-in"
  | "handover"
  | "no-show";
export type ReceptionCommand =
  | { type: "create"; input: ReservationInput; walkIn?: boolean }
  | { type: "edit"; id: string; input: ReservationInput }
  | {
      type: "confirm" | "reject" | "cancel" | "no-show";
      id: string;
      reason?: string;
    }
  | { type: "assign"; id: string; tableId: string }
  | { type: "check-in"; id: string; actualGuests: number }
  | { type: "handover"; id: string }
  | { type: "read"; id?: string };
export type RuleResult = { ok: true } | { ok: false; reason: string };
