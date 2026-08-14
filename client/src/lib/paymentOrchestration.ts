import {
  buildPaymentSession,
  getPaymentCallbackParams,
  type PaymentSessionInput,
} from "./paymentSession";
import {
  classifyPaymentVerification,
  decidePaymentStart,
  type PaymentStartResult,
  type PaymentVerificationResult,
} from "./paymentFlow";

export type PaymentStorage = {
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export function redirectToCheckout(checkoutUrl: string) {
  window.location.href = checkoutUrl;
}

export async function startHostedCheckout(input: {
  paymentStatus?: string;
  gatewayLabel: string;
  session: Omit<PaymentSessionInput, "reference">;
  initialize: () => Promise<PaymentStartResult>;
  storage: PaymentStorage;
  redirect?: (checkoutUrl: string) => void;
}) {
  if (input.paymentStatus === "success") {
    return decidePaymentStart({
      paymentStatus: "success",
      isPending: false,
    });
  }

  const result = await input.initialize();
  const decision = decidePaymentStart({
    paymentStatus: input.paymentStatus,
    isPending: false,
    result,
    gatewayLabel: input.gatewayLabel,
  });

  if (decision.state !== "redirect") return decision;

  input.storage.setItem(
    "staynest_payment",
    JSON.stringify(
      buildPaymentSession({
        ...input.session,
        reference: decision.reference,
      })
    )
  );
  (input.redirect ?? redirectToCheckout)(decision.checkoutUrl);
  return decision;
}

export async function completePaymentFlow(input: {
  payment: any;
  search: string;
  verify: (payload: {
    gateway: "paystack" | "flutterwave";
    reference: string;
    transactionId?: string;
    expectedAmount: number;
    currency: "GHS" | "USD";
  }) => Promise<PaymentVerificationResult>;
  createBooking: (payload: any) => Promise<any>;
  storage: PaymentStorage;
  navigate: (path: string) => void;
  onVerified?: () => void;
}) {
  const { payment } = input;
  const { reference, transactionId } = getPaymentCallbackParams(
    input.search,
    payment.reference
  );
  const result = await input.verify({
    gateway: payment.gateway,
    reference,
    transactionId,
    expectedAmount: payment.expectedAmount,
    currency: payment.currency,
  });
  const verification = classifyPaymentVerification(result);
  if (verification.state !== "success" || !result.verificationToken) {
    throw new Error(
      verification.message ??
        "The payment could not be verified. No booking was confirmed."
    );
  }

  input.onVerified?.();
  const booking = payment.booking;
  const created = await input.createBooking({
    hotelId: booking.hotel.id,
    roomId: booking.room.id,
    bookingReference: reference,
    paymentReference: reference,
    paymentGateway: payment.gateway,
    paymentStatus: "success",
    verificationToken: result.verificationToken,
    currency: booking.currency,
    totalAmount: payment.expectedAmount,
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    guestsCount: booking.guestsCount,
    guestName: payment.guestName,
    guestEmail: payment.guestEmail,
    guestPhone: payment.guestPhone,
    specialRequests: payment.specialRequests,
  });
  input.storage.setItem(
    "staynest_confirmation",
    JSON.stringify({
      created,
      booking,
      guestName: payment.guestName,
      guestEmail: payment.guestEmail,
    })
  );
  input.storage.removeItem("staynest_payment");
  input.storage.removeItem("staynest_booking");
  input.navigate("/confirmation");
  return { created, booking, reference };
}
