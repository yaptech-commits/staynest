import { describe, expect, it } from "vitest";
import {
  classifyPaymentVerification,
  decidePaymentStart,
} from "../client/src/lib/paymentFlow";

describe("booking payment flow", () => {
  it("stays pending while checkout initialization is in flight", () => {
    expect(decidePaymentStart({ isPending: true })).toEqual({
      state: "pending",
      message: "Preparing secure checkout…",
    });
  });

  it("reports an unconfigured gateway instead of redirecting", () => {
    expect(
      decidePaymentStart({
        isPending: false,
        gatewayLabel: "Paystack",
        result: { configured: false, checkoutUrl: null },
      })
    ).toEqual({
      state: "unconfigured",
      message: "Add the Paystack secret key to enable live checkout.",
    });
  });

  it("returns a hosted checkout redirect only when the gateway provides all fields", () => {
    expect(
      decidePaymentStart({
        isPending: false,
        result: {
          configured: true,
          checkoutUrl: "https://checkout.example.test/session",
          reference: "SN-REDIRECT-123",
        },
      })
    ).toEqual({
      state: "redirect",
      checkoutUrl: "https://checkout.example.test/session",
      reference: "SN-REDIRECT-123",
    });
  });

  it("blocks a second charge for an already-paid booking", () => {
    expect(
      decidePaymentStart({
        paymentStatus: "success",
        isPending: false,
        result: {
          configured: true,
          checkoutUrl: "https://checkout.example.test/should-not-open",
          reference: "SN-ALREADY-PAID",
        },
      })
    ).toEqual({
      state: "already-paid",
      message: "This booking is already paid. No second charge was created.",
    });
  });

  it("distinguishes failed, unconfigured, and verified payment callbacks", () => {
    expect(classifyPaymentVerification({ configured: false })).toEqual({
      state: "unconfigured",
      message:
        "Payment verification is not configured. No booking was confirmed.",
    });
    expect(
      classifyPaymentVerification({ configured: true, verified: false })
    ).toEqual({
      state: "failed",
      message: "The payment could not be verified. No booking was confirmed.",
    });
    expect(
      classifyPaymentVerification({
        configured: true,
        verified: true,
        verificationToken: "verified-token",
      })
    ).toEqual({ state: "success" });
  });
});
