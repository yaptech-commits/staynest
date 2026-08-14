import { describe, expect, it, vi } from "vitest";
import {
  completePaymentFlow,
  startHostedCheckout,
} from "../client/src/lib/paymentOrchestration";

type MemoryStorage = {
  values: Record<string, string>;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const createStorage = (): MemoryStorage => {
  const values: Record<string, string> = {};
  return {
    values,
    setItem: (key, value) => {
      values[key] = value;
    },
    removeItem: key => {
      delete values[key];
    },
  };
};

const booking = {
  hotel: { id: 1 },
  room: { id: 101 },
  currency: "GHS" as const,
  checkInDate: "2026-08-28",
  checkOutDate: "2026-08-31",
  guestsCount: 2,
};

describe("production checkout orchestration", () => {
  it("writes the payment session and redirects to hosted checkout", async () => {
    const storage = createStorage();
    const redirect = vi.fn();
    const initialize = vi.fn().mockResolvedValue({
      configured: true,
      checkoutUrl: "https://checkout.example.test/session",
      reference: "SN-FLOW-1234",
    });

    const result = await startHostedCheckout({
      gatewayLabel: "Paystack",
      session: {
        booking,
        guestName: "Guest",
        guestEmail: "guest@example.com",
        guestPhone: "+233200000000",
        gateway: "paystack",
        expectedAmount: 2850,
        currency: "GHS",
      },
      initialize,
      storage,
      redirect,
    });

    expect(result.state).toBe("redirect");
    expect(initialize).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledWith(
      "https://checkout.example.test/session"
    );
    expect(JSON.parse(storage.values.staynest_payment)).toMatchObject({
      guestEmail: "guest@example.com",
      reference: "SN-FLOW-1234",
      expectedAmount: 2850,
    });
  });

  it("does not initialize or redirect an already-paid booking", async () => {
    const initialize = vi.fn();
    const result = await startHostedCheckout({
      paymentStatus: "success",
      gatewayLabel: "Paystack",
      session: {
        booking,
        guestName: "Guest",
        guestEmail: "guest@example.com",
        guestPhone: "+233200000000",
        gateway: "paystack",
        expectedAmount: 2850,
        currency: "GHS",
      },
      initialize,
      storage: createStorage(),
      redirect: vi.fn(),
    });

    expect(result).toEqual({
      state: "already-paid",
      message: "This booking is already paid. No second charge was created.",
    });
    expect(initialize).not.toHaveBeenCalled();
  });

  it("stops on failed verification without creating or navigating to a booking", async () => {
    const storage = createStorage();
    storage.values.staynest_payment = JSON.stringify({
      booking,
      guestName: "Guest",
      guestEmail: "guest@example.com",
      guestPhone: "+233200000000",
      gateway: "paystack",
      reference: "SN-FLOW-FAIL",
      expectedAmount: 2850,
      currency: "GHS",
    });
    const createBooking = vi.fn();
    const navigate = vi.fn();

    await expect(
      completePaymentFlow({
        payment: JSON.parse(storage.values.staynest_payment),
        search: "?reference=SN-FLOW-FAIL",
        verify: vi
          .fn()
          .mockResolvedValue({ configured: true, verified: false }),
        createBooking,
        storage,
        navigate,
      })
    ).rejects.toThrow(
      "The payment could not be verified. No booking was confirmed."
    );

    expect(createBooking).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(storage.values.staynest_confirmation).toBeUndefined();
  });

  it("verifies, creates the booking, clears the payment session, and navigates to confirmation", async () => {
    const storage = createStorage();
    storage.values.staynest_payment = JSON.stringify({
      booking,
      guestName: "Guest",
      guestEmail: "guest@example.com",
      guestPhone: "+233200000000",
      gateway: "flutterwave",
      reference: "SN-FLOW-SUCCESS",
      expectedAmount: 2850,
      currency: "GHS",
    });
    const verify = vi.fn().mockResolvedValue({
      configured: true,
      verified: true,
      verificationToken: "verified-token",
    });
    const createBooking = vi
      .fn()
      .mockResolvedValue({ id: 88, bookingReference: "SN-FLOW-SUCCESS" });
    const navigate = vi.fn();
    const onVerified = vi.fn();

    const result = await completePaymentFlow({
      payment: JSON.parse(storage.values.staynest_payment),
      search: "?tx_ref=SN-FLOW-SUCCESS&transaction_id=99",
      verify,
      createBooking,
      storage,
      navigate,
      onVerified,
    });

    expect(verify).toHaveBeenCalledWith({
      gateway: "flutterwave",
      reference: "SN-FLOW-SUCCESS",
      transactionId: "99",
      expectedAmount: 2850,
      currency: "GHS",
    });
    expect(onVerified).toHaveBeenCalledOnce();
    expect(createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentReference: "SN-FLOW-SUCCESS",
        verificationToken: "verified-token",
        paymentStatus: "success",
      })
    );
    expect(result.reference).toBe("SN-FLOW-SUCCESS");
    expect(JSON.parse(storage.values.staynest_confirmation)).toMatchObject({
      created: { id: 88 },
      guestEmail: "guest@example.com",
    });
    expect(storage.values.staynest_payment).toBeUndefined();
    expect(storage.values.staynest_booking).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith("/confirmation");
  });
});
