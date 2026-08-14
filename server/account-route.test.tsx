// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigate = vi.fn();

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: {
      id: 1,
      name: "Wisdom Asaare",
      email: "wisdomasaare41@gmail.com",
      role: "superadmin",
    },
  }),
}));
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
  useLocation: () => ["/account", navigate],
  useRoute: () => [false, {}],
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    bookings: {
      mine: { useQuery: () => ({ data: [], isLoading: false }) },
      cancel: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    auth: {
      onboardingProfile: { useQuery: () => ({ data: undefined }) },
      resendVerification: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
    },
  },
}));

import { AccountPage } from "../client/src/pages/StayNest";

afterEach(() => {
  cleanup();
  navigate.mockReset();
});

describe("superadmin account route guard", () => {
  it("redirects superadmins to the platform dashboard instead of rendering guest account content", async () => {
    render(<AccountPage />);

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/admin"));
    expect(screen.getByText("Opening the platform dashboard…")).toBeTruthy();
    expect(screen.queryByText("Guest account")).toBeNull();
  });
});

export {};
