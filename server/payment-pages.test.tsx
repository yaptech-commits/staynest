// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const initialize = vi.fn();
  const verify = vi.fn();
  const createBooking = vi.fn();
  return {
    auth: {
      isAuthenticated: true,
      user: { id: 42, name: "Guest", email: "guest@example.com", role: "user" },
      logout: vi.fn(),
    },
    initialize,
    verify,
    createBooking,
    initializeMutation: { mutateAsync: initialize, isPending: false },
    verifyMutation: { mutateAsync: verify, isPending: false },
    createBookingMutation: { mutateAsync: createBooking, isPending: false },
    navigate: vi.fn(),
    redirect: vi.fn(),
    toastError: vi.fn(),
    toastInfo: vi.fn(),
    startLogin: vi.fn(),
  };
});

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => mocks.auth }));
vi.mock("@/const", () => ({ startLogin: mocks.startLogin }));
vi.mock("@/brand", () => ({
  STAYNEST_HERO_BACKGROUND_SRC: "hero.jpg",
  STAYNEST_LOGO_ALT: "StayNest",
}));
vi.mock("@/components/BrandImage", () => ({
  BrandImage: (props: Record<string, unknown>) =>
    React.createElement("img", props),
}));
vi.mock("@/components/Map", () => ({ MapView: () => null }));
vi.mock("@/components/PartnerInventoryPanel", () => ({
  PartnerInventoryPanel: () => null,
}));
vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, info: mocks.toastInfo, success: vi.fn() },
}));
vi.mock("wouter", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => React.createElement("a", { href, ...props }, children),
  useLocation: () => ["/payment-complete", mocks.navigate],
  useRoute: () => [false, {}],
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    payments: {
      initialize: { useMutation: () => mocks.initializeMutation },
      verify: { useMutation: () => mocks.verifyMutation },
    },
    bookings: {
      createAfterVerifiedPayment: {
        useMutation: () => mocks.createBookingMutation,
      },
    },
  },
}));
vi.mock("@/lib/paymentOrchestration", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/paymentOrchestration")
  >("@/lib/paymentOrchestration");
  return { ...actual, redirectToCheckout: mocks.redirect };
});

import { BookingPage, PaymentCompletePage } from "../client/src/pages/StayNest";

const booking = {
  hotel: { id: 1, name: "The Gold Coast House" },
  room: {
    id: 101,
    name: "Garden King",
    priceGhs: 2850,
    priceUsd: 180,
    images: [],
  },
  currency: "GHS" as const,
  checkInDate: "2026-08-28",
  checkOutDate: "2026-08-31",
  guestsCount: 2,
};

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState({}, "", "/booking");
  mocks.initialize.mockReset();
  mocks.verify.mockReset();
  mocks.createBooking.mockReset();
  mocks.navigate.mockReset();
  mocks.redirect.mockReset();
  mocks.toastError.mockReset();
  mocks.toastInfo.mockReset();
  mocks.auth.isAuthenticated = true;
  mocks.auth.user = {
    id: 42,
    name: "Guest",
    email: "guest@example.com",
    role: "user",
  };
});

afterEach(() => cleanup());

describe("rendered booking payment pages", () => {
  it("submits BookingPage payment, persists the real session payload, and triggers hosted redirect", async () => {
    const user = userEvent.setup();
    mocks.initialize.mockResolvedValue({
      configured: true,
      checkoutUrl: "https://checkout.example.test/session",
      reference: "SN-PAGE-1234",
    });
    sessionStorage.setItem("staynest_booking", JSON.stringify(booking));

    render(<BookingPage />);
    await user.type(screen.getByPlaceholderText("+233 …"), "+233200000000");
    await user.click(
      screen.getAllByRole("button", { name: /Review payment/ })[0]
    );
    await user.click(screen.getByRole("button", { name: /Pay now/ }));

    await waitFor(() =>
      expect(mocks.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "guest@example.com",
          amount: 8550,
          currency: "GHS",
        })
      )
    );
    await waitFor(() =>
      expect(mocks.redirect).toHaveBeenCalledWith(
        "https://checkout.example.test/session"
      )
    );
    expect(
      JSON.parse(sessionStorage.getItem("staynest_payment") ?? "null")
    ).toMatchObject({
      guestEmail: "guest@example.com",
      guestPhone: "+233200000000",
      reference: "SN-PAGE-1234",
      expectedAmount: 8550,
    });
  });

  it("renders PaymentCompletePage failure without creating a booking", async () => {
    const user = userEvent.setup();
    void user;
    mocks.verify.mockResolvedValue({ configured: true, verified: false });
    sessionStorage.setItem(
      "staynest_payment",
      JSON.stringify({
        booking,
        guestName: "Guest",
        guestEmail: "guest@example.com",
        guestPhone: "+233200000000",
        gateway: "paystack",
        reference: "SN-PAGE-FAIL",
        expectedAmount: 8550,
        currency: "GHS",
      })
    );
    window.history.replaceState(
      {},
      "",
      "/payment-complete?reference=SN-PAGE-FAIL"
    );

    render(<PaymentCompletePage />);

    await waitFor(() =>
      expect(
        screen.getByText(
          "The payment could not be verified. No booking was confirmed."
        )
      ).toBeTruthy()
    );
    expect(mocks.createBooking).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("renders PaymentCompletePage success, creates the booking, and navigates to confirmation", async () => {
    mocks.verify.mockResolvedValue({
      configured: true,
      verified: true,
      verificationToken: "verified-token",
    });
    mocks.createBooking.mockResolvedValue({
      id: 88,
      bookingReference: "SN-PAGE-SUCCESS",
    });
    sessionStorage.setItem(
      "staynest_payment",
      JSON.stringify({
        booking,
        guestName: "Guest",
        guestEmail: "guest@example.com",
        guestPhone: "+233200000000",
        gateway: "flutterwave",
        reference: "SN-PAGE-SUCCESS",
        expectedAmount: 8550,
        currency: "GHS",
      })
    );
    window.history.replaceState(
      {},
      "",
      "/payment-complete?tx_ref=SN-PAGE-SUCCESS&transaction_id=99"
    );

    render(<PaymentCompletePage />);

    await waitFor(() =>
      expect(mocks.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentReference: "SN-PAGE-SUCCESS",
          paymentStatus: "success",
          verificationToken: "verified-token",
        })
      )
    );
    expect(mocks.navigate).toHaveBeenCalledWith("/confirmation");
    expect(
      JSON.parse(sessionStorage.getItem("staynest_confirmation") ?? "null")
    ).toMatchObject({ created: { id: 88 }, guestEmail: "guest@example.com" });
  });
});
