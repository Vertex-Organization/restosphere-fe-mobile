export type PaymentStatus = "UNPAID" | "PAYMENT_REQUESTED" | "PAID";
export interface Bill {
  id: string;
  sessionId: string;
  status: PaymentStatus;
  requestedAt?: string;
  paidAt?: string;
  amount?: number;
  requestedAmount?: number;
  currentAmount?: number;
  payos?: { paymentId: string; qrCode?: string; checkoutUrl?: string; orderCode: number } | null;
}
