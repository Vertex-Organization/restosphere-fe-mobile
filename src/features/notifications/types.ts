export interface ReceptionNotification {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  reservationId?: string;
  tableId?: string;
}
