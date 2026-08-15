// @vitest-environment jsdom
import React, { useState } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  adminUser: {
    id: 1,
    name: "Wisdom Asaare",
    email: "wisdomasaare41@gmail.com",
    role: "superadmin" as const,
    loginMethod: "password",
    lastSignedIn: new Date("2026-08-14T10:00:00Z"),
  },
  adminSummary: {
    hotelCount: 0,
    bookingCount: 0,
    gross: 0,
    commission: 0,
    conflictCount: 0,
  },
  adminUsers: [] as unknown[],
  adminHotels: [] as unknown[],
  adminBookings: [] as unknown[],
  adminPayouts: [] as unknown[],
  adminRooms: [] as unknown[],
  adminBlockedAvailability: [] as unknown[],
  adminPayoutAccounts: [] as unknown[],
  notifications: [] as unknown[],
  approval: { mutate: vi.fn(), isPending: false },
  refund: { mutate: vi.fn(), isPending: false },
  deactivateUser: { mutate: vi.fn(), isPending: false },
  markRead: { mutate: vi.fn(), isPending: false },
}));

type LoginMutationOptions = {
  onSuccess?: (result: {
    success: true;
    user: { role: "superadmin"; email: string };
  }) => void | Promise<void>;
};

let openAuthModal: (() => void) | undefined;
let currentRoute = "/account";
let navigateTo: ((path: string) => void) | undefined;

vi.mock("@/const", () => ({
  registerAuthModalOpener: (opener: () => void) => {
    openAuthModal = opener;
  },
  startLogin: vi.fn(),
}));
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: mocks.adminUser,
    logout: vi.fn(),
  }),
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
  useLocation: () => [
    currentRoute,
    (path: string) => {
      navigateTo?.(path);
    },
  ],
  useRoute: () => [false, {}],
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      auth: { me: { invalidate: vi.fn().mockResolvedValue(undefined) } },
      admin: {
        users: { invalidate: vi.fn() },
        hotels: { invalidate: vi.fn() },
        bookings: { invalidate: vi.fn() },
        summary: { invalidate: vi.fn() },
      },
      notifications: { mine: { invalidate: vi.fn() } },
    }),
    auth: {
      localLogin: {
        useMutation: (options: LoginMutationOptions) => ({
          isPending: false,
          mutate: () =>
            options.onSuccess?.({
              success: true,
              user: {
                role: "superadmin",
                email: "wisdomasaare41@gmail.com",
              },
            }),
        }),
      },
      localRegister: {
        useMutation: () => ({ isPending: false, mutate: vi.fn() }),
      },
    },
    admin: {
      summary: { useQuery: () => ({ data: mocks.adminSummary }) },
      users: { useQuery: () => ({ data: mocks.adminUsers }) },
      hotels: { useQuery: () => ({ data: mocks.adminHotels }) },
      bookings: { useQuery: () => ({ data: mocks.adminBookings }) },
      payouts: { useQuery: () => ({ data: mocks.adminPayouts }) },
      rooms: { useQuery: () => ({ data: mocks.adminRooms }) },
      blockedAvailability: {
        useQuery: () => ({ data: mocks.adminBlockedAvailability }),
      },
      payoutAccounts: { useQuery: () => ({ data: mocks.adminPayoutAccounts }) },
      approveHotel: { useMutation: () => mocks.approval },
      refundBooking: { useMutation: () => mocks.refund },
      deactivateUser: { useMutation: () => mocks.deactivateUser },
    },
    notifications: {
      mine: { useQuery: () => ({ data: mocks.notifications }) },
      markRead: { useMutation: () => mocks.markRead },
    },
  },
}));
vi.mock("@/components/BrandImage", () => ({
  BrandImage: (props: Record<string, unknown>) =>
    React.createElement("img", props),
}));
vi.mock("@/brand", () => ({
  STAYNEST_HERO_BACKGROUND_SRC: "hero.jpg",
  STAYNEST_LOGO_ALT: "StayNest",
}));
vi.mock("@/components/Map", () => ({ MapView: () => null }));
vi.mock("@/components/PartnerInventoryPanel", () => ({
  PartnerInventoryPanel: () => null,
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

import { AuthModal } from "../client/src/components/AuthModal";
import { AdminDashboard } from "../client/src/pages/StayNest";

function LoginToAdminHarness() {
  const [route, setRoute] = useState("/account");
  currentRoute = route;
  navigateTo = setRoute;

  return (
    <>
      <AuthModal />
      {route === "/admin" ? (
        <AdminDashboard />
      ) : (
        <main data-testid="guest-account">Guest account</main>
      )}
    </>
  );
}

afterEach(() => {
  cleanup();
  openAuthModal = undefined;
  navigateTo = undefined;
  currentRoute = "/account";
});

describe("superadmin login to real admin dashboard flow", () => {
  it("navigates from AuthModal success to visible real platform dashboard content", async () => {
    render(<LoginToAdminHarness />);

    act(() => openAuthModal?.());
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "wisdomasaare41@gmail.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "Gist_zone@blogger1" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Sign in to StayNest/i })
    );

    await waitFor(() => {
      expect(screen.getByText("Keep the marketplace healthy.")).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "users" }));
    expect(screen.getByText("Platform users")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "operations" }));
    expect(screen.getByText("Room inventory")).toBeTruthy();
    expect(screen.queryByTestId("guest-account")).toBeNull();
  });
});
