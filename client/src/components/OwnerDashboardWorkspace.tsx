import React, { useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { BrandImage } from "@/components/BrandImage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STAYNEST_LOGO_ALT } from "@/brand";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BedDouble,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Grid2X2,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Package,
  Search,
  Settings,
  ShieldCheck,
  Star,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";

export type OwnerDashboardTab =
  | "overview"
  | "rooms"
  | "bookings"
  | "availability"
  | "messages"
  | "inventory"
  | "financials"
  | "reviews";

type OwnerDashboardWorkspaceProps = {
  userName?: string | null;
  activeHotel: any;
  hotels: any[];
  rooms: any[];
  bookings: any[];
  conflicts: any[];
  blockedDates: any[];
  payoutAccount?: any;
  activeHotelId: number;
  onSelectHotel: (hotelId: number) => void;
  tab: OwnerDashboardTab;
  onTabChange: (tab: OwnerDashboardTab) => void;
  inventoryPanel: ReactNode;
  roomForm: {
    name: string;
    roomType: string;
    capacity: string;
    priceGhs: string;
    priceUsd: string;
    totalRooms: string;
  };
  setRoomForm: (value: {
    name: string;
    roomType: string;
    capacity: string;
    priceGhs: string;
    priceUsd: string;
    totalRooms: string;
  }) => void;
  onSubmitRoom: () => void;
  roomSubmitPending: boolean;
  onEditRoomRate: (room: any) => void;
  onUpdateBooking: (
    booking: any,
    status: "booked" | "checked_in" | "checked_out" | "cancelled"
  ) => void;
  bookingUpdatePending: boolean;
  blockForm: { startDate: string; endDate: string; reason: string };
  setBlockForm: (value: {
    startDate: string;
    endDate: string;
    reason: string;
  }) => void;
  onBlockDates: () => void;
  onUnblockDate: (id: number) => void;
  blockPending: boolean;
  messageBookingId?: number | null;
  messages?: any[];
  messagesLoading?: boolean;
  messageText?: string;
  setMessageText?: (value: string) => void;
  onOpenConversation?: (bookingId: number) => void;
  onSendMessage?: () => void;
  messageSending?: boolean;
  payoutForm?: {
    payoutMethod: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    networkProvider: string;
  };
  setPayoutForm?: (value: {
    payoutMethod: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    networkProvider: string;
  }) => void;
  onSavePayout?: () => void;
  payoutSavePending?: boolean;
};

const money = (value: number, currency: "GHS" | "USD") =>
  new Intl.NumberFormat(currency === "GHS" ? "en-GH" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

const dateOnly = (value: unknown) => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatShortDate = (value: unknown) => {
  const date = dateOnly(value);
  return date
    ? date.toLocaleDateString("en-GH", { day: "numeric", month: "short" })
    : "—";
};

const isWithinDays = (value: unknown, days: number) => {
  const date = dateOnly(value);
  if (!date) return false;
  const now = Date.now();
  const difference = now - date.getTime();
  return difference >= 0 && difference <= days * 24 * 60 * 60 * 1000;
};

const navItems: Array<{
  id: OwnerDashboardTab;
  label: string;
  icon: ReactNode;
}> = [
  { id: "overview", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "bookings", label: "Reservations", icon: <ClipboardList size={16} /> },
  { id: "rooms", label: "Rooms", icon: <BedDouble size={16} /> },
  { id: "messages", label: "Messages", icon: <MessageSquare size={16} /> },
  { id: "inventory", label: "Inventory", icon: <Package size={16} /> },
  { id: "availability", label: "Calendar", icon: <CalendarDays size={16} /> },
  { id: "financials", label: "Financials", icon: <WalletCards size={16} /> },
  { id: "reviews", label: "Reviews", icon: <Star size={16} /> },
];

function MetricCard({
  label,
  value,
  detail,
  icon,
  tone = "mint",
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
  tone?: "mint" | "plain" | "lime" | "rose";
}) {
  const toneClass = {
    mint: "bg-[#d8f4e8]",
    plain: "bg-white",
    lime: "bg-[#eff9b7]",
    rose: "bg-[#fff0ed]",
  }[tone];
  return (
    <Card className={`rounded-2xl border-[#e2e9e1] shadow-none ${toneClass}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#718078]">
              {label}
            </p>
            <p className="mt-3 font-serif text-[29px] leading-none text-[#183a31]">
              {value}
            </p>
            <p className="mt-3 text-[11px] text-[#718078]">{detail}</p>
          </div>
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/75 text-[#2b6755]">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b18143]">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-serif text-[27px] leading-none text-[#183a31]">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function EmptyState({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#cfd9cf] bg-[#f8faf7] p-7 text-center">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#e7eee5] text-[#2b6755]">
        <Building2 size={18} />
      </div>
      <p className="mt-4 text-sm font-bold text-[#183a31]">{title}</p>
      <p className="mx-auto mt-2 max-w-[390px] text-xs leading-5 text-[#718078]">
        {copy}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function OwnerDashboardWorkspace({
  userName,
  activeHotel,
  hotels,
  rooms,
  bookings,
  conflicts,
  blockedDates,
  payoutAccount,
  activeHotelId,
  onSelectHotel,
  tab,
  onTabChange,
  inventoryPanel,
  roomForm,
  setRoomForm,
  onSubmitRoom,
  roomSubmitPending,
  onEditRoomRate,
  onUpdateBooking,
  bookingUpdatePending,
  blockForm,
  setBlockForm,
  onBlockDates,
  onUnblockDate,
  blockPending,
  messageBookingId,
  messages = [],
  messagesLoading = false,
  messageText = "",
  setMessageText,
  onOpenConversation,
  onSendMessage,
  messageSending = false,
  payoutForm,
  setPayoutForm,
  onSavePayout,
  payoutSavePending = false,
}: OwnerDashboardWorkspaceProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const successfulBookings = bookings.filter(
    booking =>
      booking.paymentStatus === "success" &&
      booking.bookingStatus !== "cancelled"
  );
  const newBookings = bookings.filter(booking =>
    isWithinDays(booking.createdAt, 7)
  ).length;
  const checkIns = bookings.filter(booking => {
    const date = dateOnly(booking.checkInDate);
    return date ? date.toDateString() === new Date().toDateString() : false;
  }).length;
  const checkOuts = bookings.filter(booking => {
    const date = dateOnly(booking.checkOutDate);
    return date ? date.toDateString() === new Date().toDateString() : false;
  }).length;
  const revenue = successfulBookings.reduce(
    (totals, booking) => {
      const amount = Number(booking.totalAmount ?? 0);
      if (booking.currency === "USD") totals.usd += amount;
      else totals.ghs += amount;
      return totals;
    },
    { ghs: 0, usd: 0 }
  );
  const revenuePoints = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthBookings = successfulBookings.filter(booking => {
        const bookingDate = dateOnly(booking.createdAt ?? booking.checkInDate);
        return (
          bookingDate?.getMonth() === month &&
          bookingDate.getFullYear() === year
        );
      });
      return {
        label: date.toLocaleDateString("en-GH", { month: "short" }),
        ghs: monthBookings
          .filter(booking => booking.currency !== "USD")
          .reduce((sum, booking) => sum + Number(booking.totalAmount ?? 0), 0),
        usd: monthBookings
          .filter(booking => booking.currency === "USD")
          .reduce((sum, booking) => sum + Number(booking.totalAmount ?? 0), 0),
      };
    });
  }, [successfulBookings]);
  const chartCurrency: "GHS" | "USD" =
    revenue.ghs > 0 || revenue.usd === 0 ? "GHS" : "USD";
  const chartValues = revenuePoints.map(point =>
    chartCurrency === "GHS" ? point.ghs : point.usd
  );
  const chartMax = Math.max(...chartValues, 1);
  const totalRooms = rooms.reduce(
    (sum, room) => sum + Number(room.totalRooms ?? 0),
    0
  );
  const guestCount = new Set(
    bookings.map(booking => booking.userId).filter(Boolean)
  ).size;
  const hasRating = Number(activeHotel?.rating ?? 0) > 0;
  const propertyTasks = [
    activeHotel?.approvalStatus !== "approved"
      ? "Awaiting StayNest property approval"
      : null,
    rooms.length === 0 ? "Add your first room type" : null,
    !activeHotel?.description ? "Complete your property story" : null,
    !Array.isArray(activeHotel?.images) || activeHotel.images.length === 0
      ? "Add property photography"
      : null,
  ].filter(Boolean) as string[];

  const setTabAndClose = (nextTab: OwnerDashboardTab) => {
    onTabChange(nextTab);
    setMobileNavOpen(false);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="New bookings"
          value={newBookings}
          detail="from the last 7 days"
          icon={<CalendarDays size={17} />}
          tone="mint"
        />
        <MetricCard
          label="Check-in today"
          value={checkIns}
          detail={checkIns ? "Guests arriving today" : "No arrivals scheduled"}
          icon={<ArrowRight size={17} />}
          tone="plain"
        />
        <MetricCard
          label="Check-out today"
          value={checkOuts}
          detail={
            checkOuts ? "Guests departing today" : "No departures scheduled"
          }
          icon={<ArrowRight size={17} />}
          tone="plain"
        />
        <MetricCard
          label="Total revenue"
          value={
            revenue.ghs
              ? money(revenue.ghs, "GHS")
              : revenue.usd
                ? money(revenue.usd, "USD")
                : "GH₵0"
          }
          detail={
            revenue.ghs && revenue.usd
              ? `${money(revenue.usd, "USD")} also recorded`
              : "Verified paid bookings"
          }
          icon={<DollarSign size={17} />}
          tone="lime"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.4fr_.85fr]">
        <Card className="rounded-2xl border-[#e2e9e1] bg-white shadow-none">
          <CardHeader className="flex-row items-start justify-between p-5 pb-3">
            <SectionHeading
              eyebrow="Room availability"
              title="Inventory footprint"
            />
            <MoreHorizontal size={18} className="text-[#8a9890]" />
          </CardHeader>
          <CardContent className="p-5 pt-2">
            {rooms.length === 0 ? (
              <EmptyState
                title="No rooms yet"
                copy="Add a room type to begin selling this property."
                action={
                  <Button
                    onClick={() => onTabChange("inventory")}
                    className="rounded-lg bg-[#183a31] text-xs font-bold text-white"
                  >
                    Add room <ArrowRight size={14} />
                  </Button>
                }
              />
            ) : (
              <>
                <div className="flex h-12 overflow-hidden rounded-xl bg-[#eef3ed]">
                  {rooms.map((room, index) => (
                    <div
                      key={room.id}
                      title={room.name}
                      className={`h-full ${index % 3 === 0 ? "bg-[#c9f2e1]" : index % 3 === 1 ? "bg-[#eff9b7]" : "bg-[#d9e8bd]"}`}
                      style={{
                        width: `${Math.max((Number(room.totalRooms ?? 0) / Math.max(totalRooms, 1)) * 100, 4)}%`,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#f8faf7] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a9890]">
                      Room types
                    </p>
                    <p className="mt-2 font-serif text-3xl text-[#183a31]">
                      {rooms.length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#f8faf7] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a9890]">
                      Total rooms
                    </p>
                    <p className="mt-2 font-serif text-3xl text-[#183a31]">
                      {totalRooms}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#e2e9e1] bg-white shadow-none">
          <CardHeader className="flex-row items-start justify-between p-5 pb-3">
            <SectionHeading
              eyebrow="Revenue"
              title="Verified earnings"
              action={
                <Badge className="border-0 bg-[#eff9b7] text-[#596714]">
                  Last 6 months
                </Badge>
              }
            />
            <MoreHorizontal size={18} className="text-[#8a9890]" />
          </CardHeader>
          <CardContent className="p-5 pt-2">
            {successfulBookings.length === 0 ? (
              <EmptyState
                title="Revenue starts with your first paid booking"
                copy="Verified booking revenue will appear here in GHS or USD after guests complete payment."
              />
            ) : (
              <>
                <div className="flex h-[150px] items-end gap-3 border-b border-dashed border-[#dce5dc] px-1 pb-2">
                  {chartValues.map((value, index) => (
                    <div
                      key={`${revenuePoints[index].label}-${index}`}
                      className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                    >
                      <div
                        className="w-full max-w-10 rounded-t-lg bg-[#bfe9d8] transition-all"
                        style={{
                          height: `${Math.max((value / chartMax) * 100, value > 0 ? 9 : 2)}%`,
                        }}
                        title={`${revenuePoints[index].label}: ${money(value, chartCurrency)}`}
                      />
                      <span className="text-[10px] font-semibold text-[#8a9890]">
                        {revenuePoints[index].label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a9890]">
                      Recorded revenue
                    </p>
                    <p className="mt-1 font-serif text-2xl text-[#183a31]">
                      {money(
                        chartCurrency === "GHS" ? revenue.ghs : revenue.usd,
                        chartCurrency
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-[#718078]">
                    {successfulBookings.length} paid booking
                    {successfulBookings.length === 1 ? "" : "s"}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#e2e9e1] bg-white shadow-none">
          <CardHeader className="flex-row items-start justify-between p-5 pb-3">
            <SectionHeading
              eyebrow="Property health"
              title="Guest confidence"
            />
            <MoreHorizontal size={18} className="text-[#8a9890]" />
          </CardHeader>
          <CardContent className="p-5 pt-2">
            {hasRating ? (
              <>
                <div className="flex items-end gap-2">
                  <span className="font-serif text-4xl text-[#183a31]">
                    {Number(activeHotel.rating).toFixed(1)}
                  </span>
                  <span className="mb-1 text-xs text-[#8a9890]">/ 5</span>
                </div>
                <p className="mt-2 text-xs text-[#718078]">
                  {activeHotel.reviewCount ?? 0} verified review
                  {Number(activeHotel.reviewCount ?? 0) === 1 ? "" : "s"}
                </p>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#edf2ec]">
                  <div
                    className="h-full rounded-full bg-[#d9f280]"
                    style={{
                      width: `${Math.min((Number(activeHotel.rating) / 5) * 100, 100)}%`,
                    }}
                  />
                </div>
              </>
            ) : (
              <EmptyState
                title="No ratings yet"
                copy="Ratings will appear after verified guests complete stays at this property."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <Card className="rounded-2xl border-[#e2e9e1] bg-white shadow-none">
          <CardHeader className="flex-row items-start justify-between p-5 pb-3">
            <SectionHeading
              eyebrow="Reservations"
              title="Recent guest activity"
              action={
                <Button
                  variant="outline"
                  onClick={() => onTabChange("bookings")}
                  className="rounded-lg border-[#dfe7df] text-xs font-bold text-[#183a31]"
                >
                  View all <ArrowRight size={13} />
                </Button>
              }
            />
          </CardHeader>
          <CardContent className="p-5 pt-2">
            {bookings.length === 0 ? (
              <EmptyState
                title="No reservations yet"
                copy="Reservations will appear here after a guest pays and the booking is verified."
                action={
                  <Button
                    onClick={() => onTabChange("rooms")}
                    variant="outline"
                    className="rounded-lg border-[#dfe7df] text-xs font-bold text-[#183a31]"
                  >
                    Review rooms <ArrowRight size={14} />
                  </Button>
                }
              />
            ) : (
              <div className="divide-y divide-[#edf1ed]">
                {bookings.slice(0, 5).map(booking => (
                  <div
                    key={booking.id}
                    className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e7eee5] text-sm font-bold text-[#2b6755]">
                        {String(booking.guestName ?? "G")
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#183a31]">
                          {booking.guestName ?? "Guest reservation"}
                        </p>
                        <p className="mt-1 text-xs text-[#8a9890]">
                          {formatShortDate(booking.checkInDate)} →{" "}
                          {formatShortDate(booking.checkOutDate)} ·{" "}
                          {booking.guestsCount ?? 1} guest
                          {Number(booking.guestsCount ?? 1) === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <Badge
                        className={
                          booking.bookingStatus === "conflict_flagged"
                            ? "border-0 bg-[#fff0ed] text-[#a35c29]"
                            : "border-0 bg-[#e7f3eb] text-[#2b6755]"
                        }
                      >
                        {booking.bookingStatus ?? "booked"}
                      </Badge>
                      <span className="text-sm font-bold text-[#183a31]">
                        {money(
                          Number(booking.totalAmount ?? 0),
                          booking.currency === "USD" ? "USD" : "GHS"
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-[#e2e9e1] bg-[#183a31] text-white shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#e7c77b]">
                <ClipboardList size={16} />
                <span className="text-[10px] font-bold uppercase tracking-[0.14em]">
                  Tasks
                </span>
              </div>
              <button
                onClick={() => onTabChange("inventory")}
                className="grid h-8 w-8 place-items-center rounded-lg bg-[#eff9b7] text-[#183a31] transition hover:bg-white"
              >
                <Grid2X2 size={15} />
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {propertyTasks.length === 0 ? (
                <div className="rounded-xl bg-white/10 p-4 text-xs leading-5 text-[#d8e4d9]">
                  <CheckCircle2 size={16} className="mb-2 text-[#d9f280]" /> No
                  outstanding setup tasks.
                </div>
              ) : (
                propertyTasks.slice(0, 4).map(task => (
                  <button
                    key={task}
                    onClick={() => onTabChange("inventory")}
                    className="flex w-full items-start gap-3 rounded-xl bg-white/10 p-3 text-left transition hover:bg-white/15"
                  >
                    <span className="mt-0.5 h-4 w-4 rounded border border-[#d9f280]" />
                    <span className="text-xs leading-5 text-[#eef5ec]">
                      {task}
                    </span>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-[#e2e9e1] bg-white shadow-none">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-[#2b6755]">
              <MessageSquare size={16} />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]">
                Messages
              </p>
            </div>
            <p className="mt-4 text-sm font-bold text-[#183a31]">
              {bookings.length
                ? "Guest conversations are tied to reservations."
                : "No booking messages yet."}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#718078]">
              Keep guest and property-owner communication attached to the
              correct booking.
            </p>
            <Button
              onClick={() =>
                onTabChange(bookings.length ? "bookings" : "messages")
              }
              variant="outline"
              className="mt-4 rounded-lg border-[#dfe7df] text-xs font-bold text-[#183a31]"
            >
              {bookings.length ? "Open reservations" : "View messages"}{" "}
              <ArrowRight size={13} />
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-[#e2e9e1] bg-white shadow-none">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-[#2b6755]">
              <UsersRound size={16} />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]">
                Guests
              </p>
            </div>
            <p className="mt-4 font-serif text-3xl text-[#183a31]">
              {guestCount}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#718078]">
              Unique guests represented in your current reservations.
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-[#e2e9e1] bg-white shadow-none">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-[#2b6755]">
              <ShieldCheck size={16} />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]">
                StayNest status
              </p>
            </div>
            <p className="mt-4 text-sm font-bold text-[#183a31]">
              {activeHotel?.isBillflowConnected
                ? "BillFlow connected"
                : "Manual inventory active"}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#718078]">
              {activeHotel?.approvalStatus === "approved"
                ? "Your property is approved for the marketplace."
                : "Your property remains private until approval."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderRooms = () => (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <Card className="rounded-2xl border-[#e2e9e1] bg-white shadow-none">
        <CardHeader className="p-5">
          <SectionHeading
            eyebrow="Rooms"
            title="Room inventory"
            action={
              <Badge className="border-0 bg-[#e7f3eb] text-[#2b6755]">
                {rooms.length} types
              </Badge>
            }
          />
        </CardHeader>
        <CardContent className="space-y-3 p-5 pt-0">
          {rooms.length === 0 ? (
            <EmptyState
              title="Your room list is empty"
              copy="Add a room type with both GHS and USD nightly rates to make this property bookable."
              action={
                <Button
                  onClick={() => onTabChange("inventory")}
                  className="rounded-lg bg-[#183a31] text-xs font-bold text-white"
                >
                  Open inventory <ArrowRight size={14} />
                </Button>
              }
            />
          ) : (
            rooms.map(room => (
              <div
                key={room.id}
                className="flex flex-col gap-4 rounded-xl border border-[#e5ebe4] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-serif text-[22px] text-[#183a31]">
                    {room.name}
                  </p>
                  <p className="mt-1 text-xs text-[#718078]">
                    {room.roomType} · sleeps {room.capacity} · {room.totalRooms}{" "}
                    rooms
                  </p>
                  <p className="mt-2 text-xs font-bold text-[#2b6755]">
                    {money(Number(room.priceGhs), "GHS")} ·{" "}
                    {money(Number(room.priceUsd), "USD")} per night
                  </p>
                </div>
                <Button
                  onClick={() => onEditRoomRate(room)}
                  variant="outline"
                  className="rounded-lg border-[#dfe7df] text-xs font-bold text-[#183a31]"
                >
                  Edit rate
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-[#e2e9e1] bg-white shadow-none">
        <CardHeader className="p-5">
          <SectionHeading eyebrow="Quick add" title="New room type" />
        </CardHeader>
        <CardContent className="space-y-4 p-5 pt-0">
          <Input
            value={roomForm.name}
            onChange={event =>
              setRoomForm({ ...roomForm, name: event.target.value })
            }
            placeholder="Room name"
            className="h-10 rounded-xl border-[#dfe4dc]"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              value={roomForm.roomType}
              onChange={event =>
                setRoomForm({ ...roomForm, roomType: event.target.value })
              }
              placeholder="Type"
              className="h-10 rounded-xl border-[#dfe4dc]"
            />
            <Input
              type="number"
              value={roomForm.capacity}
              onChange={event =>
                setRoomForm({ ...roomForm, capacity: event.target.value })
              }
              placeholder="Sleeps"
              className="h-10 rounded-xl border-[#dfe4dc]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              value={roomForm.priceGhs}
              onChange={event =>
                setRoomForm({ ...roomForm, priceGhs: event.target.value })
              }
              placeholder="GHS / night"
              className="h-10 rounded-xl border-[#dfe4dc]"
            />
            <Input
              type="number"
              value={roomForm.priceUsd}
              onChange={event =>
                setRoomForm({ ...roomForm, priceUsd: event.target.value })
              }
              placeholder="USD / night"
              className="h-10 rounded-xl border-[#dfe4dc]"
            />
          </div>
          <Input
            type="number"
            value={roomForm.totalRooms}
            onChange={event =>
              setRoomForm({ ...roomForm, totalRooms: event.target.value })
            }
            placeholder="Number of rooms"
            className="h-10 rounded-xl border-[#dfe4dc]"
          />
          <Button
            onClick={onSubmitRoom}
            disabled={roomSubmitPending}
            className="h-11 w-full rounded-xl bg-[#183a31] text-sm font-bold text-white"
          >
            {roomSubmitPending ? "Adding…" : "Add room type"}{" "}
            <ArrowRight size={15} />
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderBookings = () => (
    <Card className="rounded-2xl border-[#e2e9e1] bg-white shadow-none">
      <CardHeader className="p-5">
        <SectionHeading
          eyebrow="Reservations"
          title="Guest stays"
          action={
            <Badge className="border-0 bg-[#e7f3eb] text-[#2b6755]">
              {bookings.length} total
            </Badge>
          }
        />
      </CardHeader>
      <CardContent className="space-y-3 p-5 pt-0">
        {bookings.length === 0 ? (
          <EmptyState
            title="No reservations yet"
            copy="Guest stays will appear here after payment verification."
          />
        ) : (
          bookings.map(booking => (
            <div
              key={booking.id}
              className={`rounded-xl border p-4 ${booking.bookingStatus === "conflict_flagged" ? "border-[#f3c8b4] bg-[#fffaf5]" : "border-[#e5ebe4]"}`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={
                        booking.bookingStatus === "conflict_flagged"
                          ? "border-0 bg-[#fff0ed] text-[#a35c29]"
                          : "border-0 bg-[#e7f3eb] text-[#2b6755]"
                      }
                    >
                      {booking.bookingStatus ?? "booked"}
                    </Badge>
                    <span className="font-mono text-[10px] text-[#8a9890]">
                      {booking.bookingReference}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-[#183a31]">
                    {booking.guestName ?? "Guest reservation"} ·{" "}
                    {money(
                      Number(booking.totalAmount ?? 0),
                      booking.currency === "USD" ? "USD" : "GHS"
                    )}
                  </p>
                  <p className="mt-1 text-xs text-[#718078]">
                    {formatShortDate(booking.checkInDate)} →{" "}
                    {formatShortDate(booking.checkOutDate)} ·{" "}
                    {booking.guestsCount ?? 1} guest
                    {Number(booking.guestsCount ?? 1) === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => onUpdateBooking(booking, "checked_in")}
                    disabled={
                      bookingUpdatePending ||
                      booking.bookingStatus === "checked_in"
                    }
                    variant="outline"
                    className="rounded-lg border-[#dfe7df] text-xs font-bold text-[#183a31]"
                  >
                    Check in
                  </Button>
                  <Button
                    onClick={() => onUpdateBooking(booking, "checked_out")}
                    disabled={
                      bookingUpdatePending ||
                      booking.bookingStatus === "checked_out"
                    }
                    variant="outline"
                    className="rounded-lg border-[#dfe7df] text-xs font-bold text-[#183a31]"
                  >
                    Check out
                  </Button>
                </div>
              </div>
              {booking.conflictDetails && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#fff0ed] p-3 text-xs leading-5 text-[#a35c29]">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />{" "}
                  {booking.conflictDetails}
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  const renderAvailability = () => (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <Card className="rounded-2xl border-[#e2e9e1] bg-white shadow-none">
        <CardHeader className="p-5">
          <SectionHeading
            eyebrow="Calendar"
            title="Availability controls"
            action={
              <Badge className="border-0 bg-[#e7f3eb] text-[#2b6755]">
                {blockedDates.length} blocked periods
              </Badge>
            }
          />
        </CardHeader>
        <CardContent className="space-y-3 p-5 pt-0">
          {rooms.length === 0 ? (
            <EmptyState
              title="Add rooms before managing availability"
              copy="Room-level inventory controls will appear here once you add a room type."
            />
          ) : (
            rooms.map(room => (
              <div
                key={room.id}
                className="flex items-center justify-between rounded-xl border border-[#e5ebe4] p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#e7eee5] text-[#2b6755]">
                    <BedDouble size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#183a31]">
                      {room.name}
                    </p>
                    <p className="mt-1 text-xs text-[#718078]">
                      {room.totalRooms} rooms · rates in GHS and USD
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => onTabChange("rooms")}
                  variant="outline"
                  className="rounded-lg border-[#dfe7df] text-xs font-bold text-[#183a31]"
                >
                  Edit rates
                </Button>
              </div>
            ))
          )}
          {blockedDates.length > 0 && (
            <div className="mt-5 border-t border-[#edf1ed] pt-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a9890]">
                Blocked periods
              </p>
              {blockedDates.map(blocked => (
                <div
                  key={blocked.id}
                  className="mb-2 flex items-center justify-between rounded-lg bg-[#fff8e7] px-3 py-2 text-xs"
                >
                  <span className="font-semibold text-[#795b1d]">
                    {blocked.startDate} → {blocked.endDate}
                  </span>
                  <button
                    onClick={() => onUnblockDate(blocked.id)}
                    className="font-bold text-[#a35c29]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-[#e2e9e1] bg-white shadow-none">
        <CardHeader className="p-5">
          <SectionHeading eyebrow="Block dates" title="Protect inventory" />
        </CardHeader>
        <CardContent className="space-y-4 p-5 pt-0">
          <div>
            <Label className="text-xs font-bold text-[#607269]">
              Start date
            </Label>
            <Input
              type="date"
              value={blockForm.startDate}
              onChange={event =>
                setBlockForm({ ...blockForm, startDate: event.target.value })
              }
              className="mt-2 h-10 rounded-xl border-[#dfe4dc]"
            />
          </div>
          <div>
            <Label className="text-xs font-bold text-[#607269]">End date</Label>
            <Input
              type="date"
              value={blockForm.endDate}
              onChange={event =>
                setBlockForm({ ...blockForm, endDate: event.target.value })
              }
              className="mt-2 h-10 rounded-xl border-[#dfe4dc]"
            />
          </div>
          <Input
            value={blockForm.reason}
            onChange={event =>
              setBlockForm({ ...blockForm, reason: event.target.value })
            }
            placeholder="Reason, e.g. maintenance"
            className="h-10 rounded-xl border-[#dfe4dc]"
          />
          <Button
            onClick={onBlockDates}
            disabled={blockPending}
            className="h-11 w-full rounded-xl bg-[#183a31] text-sm font-bold text-white"
          >
            {blockPending ? "Blocking…" : "Block dates"}{" "}
            <CalendarDays size={15} />
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderOther = () => {
    if (tab === "inventory")
      return (
        <div className="rounded-2xl border border-[#e2e9e1] bg-white p-2">
          {inventoryPanel}
        </div>
      );
    if (tab === "messages")
      return (
        <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
          <Card className="rounded-2xl border-[#e2e9e1] bg-white shadow-none">
            <CardHeader className="p-5">
              <SectionHeading
                eyebrow="Guest communication"
                title="Booking conversations"
                action={
                  <Badge className="border-0 bg-[#e7f3eb] text-[#2b6755]">
                    {bookings.length} stays
                  </Badge>
                }
              />
            </CardHeader>
            <CardContent className="space-y-3 p-5 pt-0">
              {bookings.length === 0 ? (
                <EmptyState
                  title="No conversations yet"
                  copy="Guest-owner messages become available when your first reservation is confirmed."
                  action={
                    <Button
                      onClick={() => onTabChange("rooms")}
                      className="rounded-lg bg-[#183a31] text-xs font-bold text-white"
                    >
                      Review rooms <ArrowRight size={14} />
                    </Button>
                  }
                />
              ) : (
                bookings.map(booking => (
                  <button
                    key={booking.id}
                    onClick={() => onOpenConversation?.(booking.id)}
                    className={`w-full rounded-xl border p-4 text-left transition hover:border-[#b9d1bd] hover:bg-[#f8faf7] ${messageBookingId === booking.id ? "border-[#2b6755] bg-[#f1f7f0]" : "border-[#e5ebe4]"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[#183a31]">
                          {booking.guestName ?? "Guest reservation"}
                        </p>
                        <p className="mt-1 text-xs text-[#8a9890]">
                          {formatShortDate(booking.checkInDate)} →{" "}
                          {formatShortDate(booking.checkOutDate)}
                        </p>
                      </div>
                      <MessageSquare size={16} className="text-[#2b6755]" />
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-[#e2e9e1] bg-white shadow-none">
            <CardHeader className="p-5">
              <SectionHeading
                eyebrow="Conversation"
                title="Guest-owner channel"
              />
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {!messageBookingId ? (
                <EmptyState
                  title="Choose a reservation"
                  copy="Select a stay to read and send messages without losing the booking context."
                />
              ) : messagesLoading ? (
                <div className="h-56 animate-pulse rounded-xl bg-[#f3f5f0]" />
              ) : (
                <>
                  <div className="max-h-72 space-y-3 overflow-y-auto rounded-xl bg-[#f8faf7] p-4">
                    {messages.length === 0 ? (
                      <p className="py-12 text-center text-xs text-[#8a9890]">
                        No messages in this conversation yet.
                      </p>
                    ) : (
                      messages.map((message: any) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === activeHotel?.ownerId ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-5 ${message.senderId === activeHotel?.ownerId ? "bg-[#183a31] text-white" : "bg-white text-[#50605a]"}`}
                          >
                            {message.messageText}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Input
                      value={messageText}
                      onChange={event => setMessageText?.(event.target.value)}
                      placeholder="Write to this guest…"
                      className="h-11 rounded-xl border-[#dfe4dc]"
                    />
                    <Button
                      onClick={onSendMessage}
                      disabled={!messageText.trim() || messageSending}
                      className="h-11 rounded-xl bg-[#183a31] px-4 text-xs font-bold text-white"
                    >
                      {messageSending ? "Sending…" : "Send"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      );
    if (tab === "financials")
      return (
        <div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
          <Card className="rounded-2xl border-[#e2e9e1] bg-white shadow-none">
            <CardHeader className="p-5">
              <SectionHeading
                eyebrow="Financials"
                title="Verified settlements"
              />
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-0">
              <div className="rounded-xl bg-[#e7f3eb] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#607269]">
                  Verified revenue
                </p>
                <p className="mt-3 font-serif text-3xl text-[#183a31]">
                  {revenue.ghs ? money(revenue.ghs, "GHS") : "GH₵0"}
                </p>
                <p className="mt-2 text-xs text-[#718078]">
                  {revenue.usd
                    ? `${money(revenue.usd, "USD")} also recorded`
                    : "No USD payments recorded"}
                </p>
              </div>
              <div className="rounded-xl border border-[#e5ebe4] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#607269]">
                    Account status
                  </p>
                  <Badge
                    className={
                      payoutAccount
                        ? "border-0 bg-[#e7f3eb] text-[#2b6755]"
                        : "border-0 bg-[#fff8e7] text-[#795b1d]"
                    }
                  >
                    {payoutAccount ? "Ready" : "Setup needed"}
                  </Badge>
                </div>
                <p className="mt-3 text-sm font-bold text-[#183a31]">
                  {payoutAccount?.payoutMethod ?? "No payout method configured"}
                </p>
                <p className="mt-2 text-xs leading-5 text-[#718078]">
                  StayNest keeps owner settlements separate from guest checkout
                  and shows only verified paid bookings here.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-[#e2e9e1] bg-white shadow-none">
            <CardHeader className="p-5">
              <SectionHeading
                eyebrow="Payout setup"
                title="Where should we settle?"
              />
            </CardHeader>
            <CardContent className="grid gap-4 p-5 pt-0 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="text-xs font-bold text-[#607269]">
                  Payout method
                </Label>
                <select
                  value={payoutForm?.payoutMethod ?? "mobile_money"}
                  onChange={event =>
                    setPayoutForm?.({
                      ...(payoutForm ?? {
                        accountName: "",
                        accountNumber: "",
                        bankName: "",
                        networkProvider: "",
                      }),
                      payoutMethod: event.target.value,
                    })
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-[#dfe4dc] bg-white px-3 text-sm text-[#183a31] outline-none"
                >
                  <option value="mobile_money">Mobile money</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="manual">Manual settlement</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-bold text-[#607269]">
                  Account name
                </Label>
                <Input
                  value={payoutForm?.accountName ?? ""}
                  onChange={event =>
                    setPayoutForm?.({
                      ...(payoutForm ?? {
                        payoutMethod: "mobile_money",
                        accountNumber: "",
                        bankName: "",
                        networkProvider: "",
                      }),
                      accountName: event.target.value,
                    })
                  }
                  placeholder="Legal or business name"
                  className="mt-2 h-11 rounded-xl border-[#dfe4dc]"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-[#607269]">
                  Account number
                </Label>
                <Input
                  value={payoutForm?.accountNumber ?? ""}
                  onChange={event =>
                    setPayoutForm?.({
                      ...(payoutForm ?? {
                        payoutMethod: "mobile_money",
                        accountName: "",
                        bankName: "",
                        networkProvider: "",
                      }),
                      accountNumber: event.target.value,
                    })
                  }
                  placeholder="MoMo or bank account"
                  className="mt-2 h-11 rounded-xl border-[#dfe4dc]"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-[#607269]">
                  Bank name
                </Label>
                <Input
                  value={payoutForm?.bankName ?? ""}
                  onChange={event =>
                    setPayoutForm?.({
                      ...(payoutForm ?? {
                        payoutMethod: "mobile_money",
                        accountName: "",
                        accountNumber: "",
                        networkProvider: "",
                      }),
                      bankName: event.target.value,
                    })
                  }
                  placeholder="Optional for bank transfer"
                  className="mt-2 h-11 rounded-xl border-[#dfe4dc]"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-[#607269]">
                  Network provider
                </Label>
                <Input
                  value={payoutForm?.networkProvider ?? ""}
                  onChange={event =>
                    setPayoutForm?.({
                      ...(payoutForm ?? {
                        payoutMethod: "mobile_money",
                        accountName: "",
                        accountNumber: "",
                        bankName: "",
                      }),
                      networkProvider: event.target.value,
                    })
                  }
                  placeholder="MTN, Vodafone, AirtelTigo"
                  className="mt-2 h-11 rounded-xl border-[#dfe4dc]"
                />
              </div>
              <Button
                onClick={onSavePayout}
                disabled={
                  payoutSavePending ||
                  !payoutForm?.accountName ||
                  !payoutForm?.accountNumber
                }
                className="h-11 rounded-xl bg-[#183a31] text-xs font-bold text-white sm:col-span-2"
              >
                {payoutSavePending
                  ? "Saving payout details…"
                  : "Save payout details"}{" "}
                <ArrowRight size={14} />
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    return (
      <Card className="rounded-2xl border-[#e2e9e1] bg-white shadow-none">
        <CardHeader className="p-5">
          <SectionHeading eyebrow="Reviews" title="Guest confidence" />
        </CardHeader>
        <CardContent className="p-5 pt-0">
          {hasRating ? (
            <div className="rounded-xl bg-[#e7f3eb] p-6">
              <p className="font-serif text-5xl text-[#183a31]">
                {Number(activeHotel?.rating).toFixed(1)}
                <span className="text-xl text-[#8a9890]"> / 5</span>
              </p>
              <p className="mt-2 text-sm text-[#718078]">
                Based on {activeHotel?.reviewCount ?? 0} verified guest reviews.
              </p>
            </div>
          ) : (
            <EmptyState
              title="Reviews will appear after verified stays"
              copy="Keep your room details and guest experience current to build trust over time."
            />
          )}
        </CardContent>
      </Card>
    );
  };

  const body =
    tab === "overview"
      ? renderOverview()
      : tab === "rooms"
        ? renderRooms()
        : tab === "bookings"
          ? renderBookings()
          : tab === "availability"
            ? renderAvailability()
            : renderOther();

  return (
    <div
      data-testid="owner-dashboard-workspace"
      className="min-h-screen bg-[#f3f5f1] text-[#183a31]"
    >
      <div className="flex min-h-screen">
        <aside
          className={`${mobileNavOpen ? "fixed inset-y-0 left-0 z-50 flex w-[260px]" : "hidden"} w-[238px] shrink-0 flex-col border-r border-[#e0e8df] bg-white px-4 py-5 lg:flex`}
        >
          <div className="flex items-center justify-between px-2">
            <Link href="/" className="inline-flex items-center">
              <BrandImage
                alt={STAYNEST_LOGO_ALT}
                className="h-9 w-auto max-w-[160px] object-contain"
              />
            </Link>
            <button
              className="rounded-lg p-2 text-[#718078] lg:hidden"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close dashboard navigation"
            >
              <X size={18} />
            </button>
          </div>
          <div className="mt-7 rounded-xl bg-[#f5f8f4] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#8a9890]">
              Active property
            </p>
            <select
              aria-label="Active hotel"
              value={activeHotelId}
              onChange={event => onSelectHotel(Number(event.target.value))}
              className="mt-2 w-full bg-transparent text-sm font-bold text-[#183a31] outline-none"
            >
              {hotels.map(hotel => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-[#718078]">
              <span
                className={`h-2 w-2 rounded-full ${activeHotel?.approvalStatus === "approved" ? "bg-[#65be91]" : "bg-[#e3b95b]"}`}
              />
              {activeHotel?.approvalStatus === "approved"
                ? "Live property"
                : "Awaiting approval"}
            </div>
          </div>
          <nav className="mt-7 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setTabAndClose(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold transition ${tab === item.id ? "bg-[#eff9b7] text-[#183a31]" : "text-[#718078] hover:bg-[#f5f8f4] hover:text-[#183a31]"}`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.id === "messages" && bookings.length > 0 && (
                  <span className="ml-auto rounded-full bg-[#e95c5c] px-1.5 py-0.5 text-[9px] text-white">
                    {bookings.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-1 border-t border-[#edf1ed] pt-4">
            <button
              onClick={() => toast.info("Dashboard settings coming soon")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-xs font-bold text-[#718078] hover:bg-[#f5f8f4] hover:text-[#183a31]"
            >
              <Settings size={16} /> Settings
            </button>
            <Link
              href="/account"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-xs font-bold text-[#718078] hover:bg-[#f5f8f4] hover:text-[#183a31]"
            >
              <UsersRound size={16} /> Account
            </Link>
          </div>
        </aside>
        {mobileNavOpen && (
          <button
            className="fixed inset-0 z-40 bg-[#09231d]/35 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close dashboard navigation overlay"
          />
        )}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[#e0e8df] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                className="rounded-xl border border-[#e0e8df] p-2 text-[#183a31] lg:hidden"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open dashboard navigation"
              >
                <Menu size={18} />
              </button>
              <div className="hidden items-center gap-2 rounded-xl bg-[#f5f8f4] px-3 py-2 text-xs text-[#8a9890] sm:flex">
                <Search size={15} />
                <span>Search rooms, guests, bookings</span>
              </div>
              <div className="sm:hidden">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b18143]">
                  Owner workspace
                </p>
                <p className="text-sm font-serif text-[#183a31]">
                  {activeHotel?.name ?? "StayNest"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() =>
                  toast.info(
                    "Notifications will appear here when a booking needs attention."
                  )
                }
                className="relative rounded-xl p-2 text-[#718078] hover:bg-[#f5f8f4]"
                aria-label="Notifications"
              >
                <Bell size={18} />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#e95c5c]" />
              </button>
              <div className="hidden h-8 w-px bg-[#e0e8df] sm:block" />
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e7eee5] text-xs font-bold text-[#2b6755]">
                  {String(userName ?? "O")
                    .slice(0, 1)
                    .toUpperCase()}
                </span>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-[#183a31]">
                    {userName ?? "Property owner"}
                  </p>
                  <p className="text-[10px] text-[#8a9890]">Owner account</p>
                </div>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-[1420px] px-4 pb-16 pt-7 sm:px-6 lg:px-8">
            <div className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b18143]">
                  Hotel management dashboard
                </p>
                <h1 className="mt-2 font-serif text-[42px] leading-none tracking-[-0.04em] text-[#183a31]">
                  {tab === "overview"
                    ? "Your property, clearly managed."
                    : navItems.find(item => item.id === tab)?.label}
                </h1>
                <p className="mt-3 max-w-[650px] text-sm leading-6 text-[#718078]">
                  {activeHotel?.name ?? "StayNest property"} ·{" "}
                  {activeHotel?.location ?? "Ghana"} · Keep every room,
                  reservation, and guest touchpoint in view.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="border-0 bg-white text-[#607269]">
                  {activeHotel?.isBillflowConnected
                    ? "BillFlow connected"
                    : "Manual inventory"}
                </Badge>
                <Badge
                  className={
                    activeHotel?.approvalStatus === "approved"
                      ? "border-0 bg-[#e7f3eb] text-[#2b6755]"
                      : "border-0 bg-[#fff8e7] text-[#795b1d]"
                  }
                >
                  {activeHotel?.approvalStatus ?? "pending"}
                </Badge>
              </div>
            </div>
            {body}
          </main>
        </div>
      </div>
    </div>
  );
}
