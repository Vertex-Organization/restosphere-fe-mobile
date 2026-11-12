export type PaymentStatus = "UNPAID" | "PAYMENT_REQUESTED" | "PAID";
export interface Bill {
  id: string;
  sessionId: string;
  status: PaymentStatus;
  requestedAt?: string;
  paidAt?: string;
  amount?: number;
}
