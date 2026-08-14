// @vitest-environment jsdom
import React, { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/brand", () => ({ STAYNEST_LOGO_ALT: "StayNest" }));
vi.mock("@/components/BrandImage", () => ({
  BrandImage: (props: Record<string, unknown>) =>
    React.createElement("img", props),
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
}));
vi.mock("sonner", () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

import {
  OwnerDashboardWorkspace,
  type OwnerDashboardTab,
} from "../client/src/components/OwnerDashboardWorkspace";

afterEach(() => cleanup());

const props = {
  userName: "Ama Owner",
  activeHotel: {
    id: 7,
    name: "Akwaba House",
    location: "East Legon",
    approvalStatus: "pending",
    isBillflowConnected: false,
  },
  hotels: [{ id: 7, name: "Akwaba House" }],
  rooms: [],
  bookings: [],
  conflicts: [],
  blockedDates: [],
  activeHotelId: 7,
  onSelectHotel: vi.fn(),
  tab: "overview" as const,
  onTabChange: vi.fn(),
  inventoryPanel: <div>Inventory panel</div>,
  roomForm: {
    name: "",
    roomType: "standard",
    capacity: "2",
    priceGhs: "",
    priceUsd: "",
    totalRooms: "1",
  },
  setRoomForm: vi.fn(),
  onSubmitRoom: vi.fn(),
  roomSubmitPending: false,
  onEditRoomRate: vi.fn(),
  onUpdateBooking: vi.fn(),
  bookingUpdatePending: false,
  blockForm: {
    startDate: "2026-09-01",
    endDate: "2026-09-02",
    reason: "Maintenance",
  },
  setBlockForm: vi.fn(),
  onBlockDates: vi.fn(),
  onUnblockDate: vi.fn(),
  blockPending: false,
  payoutAccount: undefined,
  messages: [],
  messageBookingId: null,
  messageText: "",
  setMessageText: vi.fn(),
  onOpenConversation: vi.fn(),
  onSendMessage: vi.fn(),
  payoutForm: {
    payoutMethod: "mobile_money",
    accountName: "Ama Hospitality",
    accountNumber: "0241234567",
    bankName: "",
    networkProvider: "MTN",
  },
  setPayoutForm: vi.fn(),
  onSavePayout: vi.fn(),
  payoutSavePending: false,
};

function DashboardTestHarness() {
  const [tab, setTab] = useState<OwnerDashboardTab>("overview");
  return <OwnerDashboardWorkspace {...props} tab={tab} onTabChange={setTab} />;
}

describe("rendered owner dashboard workspace", () => {
  it("renders real-data empty states without fabricated hotel metrics", () => {
    render(<DashboardTestHarness />);

    expect(screen.getByText("Your property, clearly managed.")).toBeTruthy();
    expect(screen.getByText("No rooms yet")).toBeTruthy();
    expect(screen.getByText("No reservations yet")).toBeTruthy();
    expect(screen.getByText("No ratings yet")).toBeTruthy();
    expect(screen.getByText("GH₵0")).toBeTruthy();
  });

  it("switches between the Lodgify-inspired sidebar sections", async () => {
    const user = userEvent.setup();
    render(<DashboardTestHarness />);

    await user.click(screen.getByRole("button", { name: "Rooms" }));
    expect(screen.getByText("Room inventory")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Calendar" }));
    expect(screen.getByText("Availability controls")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Financials" }));
    expect(screen.getByText("Verified settlements")).toBeTruthy();
  });

  it.each([
    ["desktop", 1440],
    ["mobile", 390],
  ])(
    "renders the authenticated owner workspace at %s width",
    (_label, width) => {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: width,
      });
      render(<DashboardTestHarness />);
      expect(screen.getByTestId("owner-dashboard-workspace")).toBeTruthy();
      expect(screen.getByText("Your property, clearly managed.")).toBeTruthy();
    }
  );

  it("keeps room inventory and booking status actions available to owners", async () => {
    const user = userEvent.setup();
    const onSubmitRoom = vi.fn();
    const onUpdateBooking = vi.fn();
    const booking = {
      id: 42,
      bookingReference: "SN-42",
      guestName: "Kojo Guest",
      checkInDate: "2026-09-01",
      checkOutDate: "2026-09-03",
      guestsCount: 2,
      bookingStatus: "booked",
      paymentStatus: "success",
      totalAmount: "1200",
      currency: "GHS",
      userId: 8,
    };
    const room = {
      id: 10,
      name: "Garden King",
      roomType: "standard",
      totalRooms: 3,
      priceGhs: "1200",
      priceUsd: "95",
    };

    render(
      <OwnerDashboardWorkspace
        {...props}
        rooms={[room]}
        onSubmitRoom={onSubmitRoom}
        tab="rooms"
      />
    );
    expect(screen.getByText("Room inventory")).toBeTruthy();
    await user.type(screen.getByPlaceholderText("Room name"), "Garden Suite");
    await user.click(screen.getByRole("button", { name: "Add room type" }));
    expect(onSubmitRoom).toHaveBeenCalledTimes(1);

    cleanup();
    render(
      <OwnerDashboardWorkspace
        {...props}
        bookings={[booking]}
        onUpdateBooking={onUpdateBooking}
        tab="bookings"
      />
    );
    expect(screen.getByText(/Kojo Guest/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Check in" }));
    expect(onUpdateBooking).toHaveBeenCalledWith(booking, "checked_in");
    await user.click(screen.getByRole("button", { name: "Check out" }));
    expect(onUpdateBooking).toHaveBeenCalledWith(booking, "checked_out");
  });

  it("keeps booking messaging and payout actions available to owners", async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();
    const onSavePayout = vi.fn();
    const booking = {
      id: 42,
      guestName: "Kojo Guest",
      checkInDate: "2026-09-01",
      checkOutDate: "2026-09-03",
      guestsCount: 2,
      bookingStatus: "booked",
      paymentStatus: "success",
      totalAmount: "1200",
      currency: "GHS",
      userId: 8,
    };
    const workflowProps = {
      ...props,
      bookings: [booking],
      payoutAccount: {
        payoutMethod: "mobile_money",
        accountName: "Ama Hospitality",
        accountNumber: "0241234567",
        networkProvider: "MTN",
      },
      messages: [{ id: 1, senderId: 8, messageText: "Can I check in early?" }],
      messageBookingId: 42,
      messageText: "Thanks, we will confirm shortly.",
      onSendMessage,
      onSavePayout,
    };

    render(<OwnerDashboardWorkspace {...workflowProps} tab="messages" />);
    expect(screen.getByText("Guest-owner channel")).toBeTruthy();
    expect(screen.getByText("Can I check in early?")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(onSendMessage).toHaveBeenCalledTimes(1);

    cleanup();
    render(<OwnerDashboardWorkspace {...workflowProps} tab="financials" />);
    expect(screen.getByText("Payout setup")).toBeTruthy();
    const saveButton = screen.getByRole("button", {
      name: "Save payout details",
    });
    expect(saveButton).toBeTruthy();
    await user.click(saveButton);
    expect(onSavePayout).toHaveBeenCalledTimes(1);
  });
});
