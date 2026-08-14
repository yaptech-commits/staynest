export type PaymentSessionInput = {
  booking: unknown;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
  gateway: "paystack" | "flutterwave";
  reference: string;
  expectedAmount: number;
  currency: "GHS" | "USD";
};

export function buildPaymentSession(input: PaymentSessionInput) {
  return {
    booking: input.booking,
    guestName: input.guestName,
    guestEmail: input.guestEmail,
    guestPhone: input.guestPhone,
    specialRequests: input.specialRequests ?? "",
    gateway: input.gateway,
    reference: input.reference,
    expectedAmount: input.expectedAmount,
    currency: input.currency,
  };
}

export function getPaymentCallbackParams(
  search: string,
  fallbackReference: string
) {
  const params = new URLSearchParams(search);
  return {
    reference:
      params.get("reference") ??
      params.get("trxref") ??
      params.get("tx_ref") ??
      fallbackReference,
    transactionId: params.get("transaction_id") ?? undefined,
  };
}
