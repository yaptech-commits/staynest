import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { getBookingByPaymentReference } = vi.hoisted(() => ({
  getBookingByPaymentReference: vi.fn(),
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, getBookingByPaymentReference };
});

vi.mock("./staynest", async () => {
  const actual =
    await vi.importActual<typeof import("./staynest")>("./staynest");
  return { ...actual, verifyPaymentToken: vi.fn().mockResolvedValue(true) };
});

import { appRouter } from "./routers";

const context = (): TrpcContext => ({
  user: {
    id: 42,
    openId: "guest-42",
    name: "Guest",
    email: "guest@example.com",
    loginMethod: "password",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

const input = {
  hotelId: 1,
  roomId: 101,
  bookingReference: "SN-REPEAT-1234",
  paymentReference: "SN-REPEAT-1234",
  paymentGateway: "paystack" as const,
  paymentStatus: "success" as const,
  verificationToken: "verified-payment-token-123456789",
  currency: "GHS" as const,
  totalAmount: 2850,
  checkInDate: "2026-08-28",
  checkOutDate: "2026-08-31",
  guestsCount: 2,
  guestName: "Guest",
  guestEmail: "guest@example.com",
  guestPhone: "+233200000000",
};

describe("paid booking idempotency", () => {
  beforeEach(() => {
    getBookingByPaymentReference.mockResolvedValue({
      id: 77,
      paymentReference: input.paymentReference,
      paymentStatus: "success",
      userId: 42,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a payment reference that already created a booking", async () => {
    const caller = appRouter.createCaller(context());

    await expect(
      caller.bookings.createAfterVerifiedPayment(input)
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message:
        "This payment reference has already been used. The booking was not charged twice.",
    });
    expect(getBookingByPaymentReference).toHaveBeenCalledWith(
      input.paymentReference
    );
  });
});
