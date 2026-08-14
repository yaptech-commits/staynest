import { describe, expect, it } from "vitest";
import {
  buildWelcomeVerificationUrl,
  calculateCommission,
  createBillFlowReservation,
  getLiveAvailability,
  initializePayment,
  makeBookingReference,
} from "./staynest";

describe("StayNest commercial rules", () => {
  it("calculates the fixed 15% platform commission", () => {
    expect(calculateCommission(1000)).toEqual({
      commission: 150,
      hotelPayout: 850,
    });
    expect(calculateCommission(2850)).toEqual({
      commission: 427.5,
      hotelPayout: 2422.5,
    });
  });

  it("creates a recognizable unique booking reference", () => {
    const reference = makeBookingReference();
    expect(reference).toMatch(/^SN-\d{4}-[A-Z0-9]{8}$/);
  });

  it("builds verification links from a configured production base URL and rejects missing bases", () => {
    expect(
      buildWelcomeVerificationUrl(
        "token/with spaces",
        "https://staynest-yaptech.vercel.app/"
      )
    ).toBe(
      "https://staynest-yaptech.vercel.app/verify-email?token=token%2Fwith%20spaces"
    );
    expect(buildWelcomeVerificationUrl("token", "")).toBeNull();
  });

  it("returns an explicit availability fallback when BillFlow credentials are absent", async () => {
    const billflowBaseUrl = process.env.BILLFLOW_API_BASE_URL;
    const billflowKey = process.env.BILLFLOW_API_KEY;
    delete process.env.BILLFLOW_API_BASE_URL;
    delete process.env.BILLFLOW_API_KEY;
    try {
      await expect(
        getLiveAvailability({
          roomTypeId: "101",
          checkInDate: "2026-09-01",
          checkOutDate: "2026-09-03",
        })
      ).resolves.toEqual({
        source: "staynest",
        availableRooms: null,
        livePricing: null,
      });
    } finally {
      if (billflowBaseUrl) process.env.BILLFLOW_API_BASE_URL = billflowBaseUrl;
      if (billflowKey) process.env.BILLFLOW_API_KEY = billflowKey;
    }
  });

  it("creates a reservation contract without hiding the source when BillFlow is not configured", async () => {
    const billflowBaseUrl = process.env.BILLFLOW_API_BASE_URL;
    const billflowKey = process.env.BILLFLOW_API_KEY;
    delete process.env.BILLFLOW_API_BASE_URL;
    delete process.env.BILLFLOW_API_KEY;
    try {
      const result = await createBillFlowReservation({
        propertyId: "property-1",
        roomTypeId: "Garden King",
        checkInDate: "2026-09-01",
        checkOutDate: "2026-09-03",
      });
      expect(result.source).toBe("staynest");
      expect(result.conflict).toBe(false);
      expect(result.reservationId).toMatch(/^staynest-/);
    } finally {
      if (billflowBaseUrl) process.env.BILLFLOW_API_BASE_URL = billflowBaseUrl;
      if (billflowKey) process.env.BILLFLOW_API_KEY = billflowKey;
    }
  });

  it("does not pretend a payment succeeded when credentials are not configured", async () => {
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    const flutterwaveKey = process.env.FLUTTERWAVE_SECRET_KEY;
    delete process.env.PAYSTACK_SECRET_KEY;
    delete process.env.FLUTTERWAVE_SECRET_KEY;
    try {
      const result = await initializePayment({
        gateway: "paystack",
        email: "guest@example.com",
        amount: 1200,
        currency: "GHS",
        reference: "SN-TEST-1234",
        callbackUrl: "http://localhost/booking/complete",
        metadata: { hotelId: 1 },
      });
      expect(result).toEqual({ configured: false, checkoutUrl: null });
    } finally {
      if (paystackKey) process.env.PAYSTACK_SECRET_KEY = paystackKey;
      if (flutterwaveKey) process.env.FLUTTERWAVE_SECRET_KEY = flutterwaveKey;
    }
  });
});
