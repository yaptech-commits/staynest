import { describe, expect, it } from "vitest";
import {
  buildPaymentSession,
  getPaymentCallbackParams,
} from "../client/src/lib/paymentSession";

describe("checkout session handoff", () => {
  it("persists the exact payload needed by PaymentCompletePage after redirect", () => {
    const session = buildPaymentSession({
      booking: { hotel: { id: 1 }, room: { id: 101 }, currency: "GHS" },
      guestName: "Guest",
      guestEmail: "guest@example.com",
      guestPhone: "+233200000000",
      specialRequests: "Late arrival",
      gateway: "paystack",
      reference: "SN-SESSION-1234",
      expectedAmount: 2850,
      currency: "GHS",
    });

    expect(session).toEqual({
      booking: { hotel: { id: 1 }, room: { id: 101 }, currency: "GHS" },
      guestName: "Guest",
      guestEmail: "guest@example.com",
      guestPhone: "+233200000000",
      specialRequests: "Late arrival",
      gateway: "paystack",
      reference: "SN-SESSION-1234",
      expectedAmount: 2850,
      currency: "GHS",
    });
  });

  it("accepts Paystack, Flutterwave, and fallback callback references", () => {
    expect(
      getPaymentCallbackParams(
        "?reference=SN-PAYSTACK&transaction_id=1",
        "fallback"
      )
    ).toEqual({
      reference: "SN-PAYSTACK",
      transactionId: "1",
    });
    expect(
      getPaymentCallbackParams("?tx_ref=SN-FLUTTERWAVE", "fallback")
    ).toEqual({
      reference: "SN-FLUTTERWAVE",
      transactionId: undefined,
    });
    expect(getPaymentCallbackParams("", "SN-FALLBACK")).toEqual({
      reference: "SN-FALLBACK",
      transactionId: undefined,
    });
  });
});
