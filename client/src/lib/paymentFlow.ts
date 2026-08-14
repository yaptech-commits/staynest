export type PaymentStartResult = {
  configured?: boolean;
  checkoutUrl?: string | null;
  reference?: string;
};

export type PaymentStartDecision =
  | { state: "pending"; message: string }
  | { state: "already-paid"; message: string }
  | { state: "unconfigured"; message: string }
  | { state: "redirect"; checkoutUrl: string; reference: string };

export function decidePaymentStart(input: {
  paymentStatus?: string;
  isPending: boolean;
  result?: PaymentStartResult;
  gatewayLabel?: string;
}): PaymentStartDecision {
  if (input.paymentStatus === "success") {
    return {
      state: "already-paid",
      message: "This booking is already paid. No second charge was created.",
    };
  }

  if (input.isPending) {
    return { state: "pending", message: "Preparing secure checkout…" };
  }

  if (
    !input.result?.configured ||
    !input.result.checkoutUrl ||
    !input.result.reference
  ) {
    return {
      state: "unconfigured",
      message: `Add the ${input.gatewayLabel ?? "payment"} secret key to enable live checkout.`,
    };
  }

  return {
    state: "redirect",
    checkoutUrl: input.result.checkoutUrl,
    reference: input.result.reference,
  };
}

export type PaymentVerificationResult = {
  configured?: boolean;
  verified?: boolean;
  verificationToken?: string | null;
};

export type PaymentVerificationState = "unconfigured" | "failed" | "success";

export function classifyPaymentVerification(
  result: PaymentVerificationResult
): { state: PaymentVerificationState; message?: string } {
  if (!result.configured) {
    return {
      state: "unconfigured",
      message:
        "Payment verification is not configured. No booking was confirmed.",
    };
  }

  if (!result.verified || !result.verificationToken) {
    return {
      state: "failed",
      message: "The payment could not be verified. No booking was confirmed.",
    };
  }

  return { state: "success" };
}
