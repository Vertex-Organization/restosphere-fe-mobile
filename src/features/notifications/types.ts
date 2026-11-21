export type ReceptionNotificationKind =
  | "TABLE_READY"
  | "TABLE_REASSIGNED"
  | "NEW_WEB_RESERVATION"
  | "REQUEST_DECIDED"
  | "RESERVATION_CANCELLED"
  | "AUTO_NO_SHOW"
  | "HOLD_EXPIRED";
export interface ReceptionNotification {
  id: string;
  kind?: ReceptionNotificationKind;
  title: string;
  body: string;
  at: string;
  read: boolean;
  reservationId?: string;
  tableId?: string;
}
