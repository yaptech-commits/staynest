// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: {
    isAuthenticated: true,
    user: {
      id: 1,
      name: "Wisdom Asaare",
      email: "wisdomasaare41@gmail.com",
      role: "superadmin" as const,
    },
    logout: vi.fn(),
  },
  users: [
    {
      id: 1,
      name: "Wisdom Asaare",
      email: "wisdomasaare41@gmail.com",
      role: "superadmin",
      loginMethod: "password",
      lastSignedIn: new Date("2026-08-14T10:00:00Z"),
    },
  ],
  summary: {
    hotelCount: 0,
    bookingCount: 0,
    gross: 0,
    commission: 0,
    conflictCount: 0,
  },
  hotels: [] as unknown[],
  bookings: [] as unknown[],
  payouts: [] as unknown[],
  rooms: [] as unknown[],
  blockedAvailability: [] as unknown[],
  payoutAccounts: [] as unknown[],
  notifications: [] as unknown[],
  approve: { mutate: vi.fn(), isPending: false },
  refund: { mutate: vi.fn(), isPending: false },
  markRead: { mutate: vi.fn(), isPending: false },
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => mocks.auth }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));
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
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
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
  useLocation: () => ["/admin", vi.fn()],
  useRoute: () => [false, {}],
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      admin: {
        users: { invalidate: vi.fn() },
        hotels: { invalidate: vi.fn() },
        bookings: { invalidate: vi.fn() },
        summary: { invalidate: vi.fn() },
      },
      notifications: { mine: { invalidate: vi.fn() } },
    }),
    admin: {
      summary: { useQuery: () => ({ data: mocks.summary }) },
      users: { useQuery: () => ({ data: mocks.users }) },
      hotels: { useQuery: () => ({ data: mocks.hotels }) },
      bookings: { useQuery: () => ({ data: mocks.bookings }) },
      payouts: { useQuery: () => ({ data: mocks.payouts }) },
      rooms: { useQuery: () => ({ data: mocks.rooms }) },
      blockedAvailability: {
        useQuery: () => ({ data: mocks.blockedAvailability }),
      },
      payoutAccounts: { useQuery: () => ({ data: mocks.payoutAccounts }) },
      approveHotel: { useMutation: () => mocks.approve },
      refundBooking: { useMutation: () => mocks.refund },
    },
    notifications: {
      mine: { useQuery: () => ({ data: mocks.notifications }) },
      markRead: { useMutation: () => mocks.markRead },
    },
  },
}));

import { AdminDashboard } from "../client/src/pages/StayNest";

beforeEach(() => {
  mocks.auth.isAuthenticated = true;
  mocks.users = [
    {
      id: 1,
      name: "Wisdom Asaare",
      email: "wisdomasaare41@gmail.com",
      role: "superadmin",
      loginMethod: "password",
      lastSignedIn: new Date("2026-08-14T10:00:00Z"),
    },
  ];
});

afterEach(() => cleanup());

describe("rendered superadmin dashboard", () => {
  it("shows the users tab and superadmin role badge", async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />);

    await user.click(screen.getByRole("button", { name: "users" }));

    expect(screen.getByText("Platform users")).toBeTruthy();
    expect(screen.getByText("wisdomasaare41@gmail.com")).toBeTruthy();
    expect(screen.getByText("superadmin")).toBeTruthy();
  });

  it("shows concrete owner-operation empty states", async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />);

    await user.click(screen.getByRole("button", { name: "operations" }));

    expect(screen.getByText("Room inventory")).toBeTruthy();
    expect(
      screen.getByText("No owner rooms have been listed yet.")
    ).toBeTruthy();
    expect(
      screen.getByText("No blocked availability windows have been recorded.")
    ).toBeTruthy();
    expect(
      screen.getByText("No owner payout accounts have been configured.")
    ).toBeTruthy();
  });

  it("shows an empty state when no platform users are returned", async () => {
    const user = userEvent.setup();
    mocks.users = [];
    render(<AdminDashboard />);

    await user.click(screen.getByRole("button", { name: "users" }));

    expect(screen.getByText("No registered users yet.")).toBeTruthy();
  });
});

export {};
