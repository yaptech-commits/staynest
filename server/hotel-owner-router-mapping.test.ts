import { beforeEach, describe, expect, it, vi } from "vitest";

const manualHotel = {
  id: 21,
  ownerId: 7,
  name: "Akwaba House",
  slug: "akwaba-house-abc123",
  location: "East Legon, Accra",
  address: "12 Wawa Street",
  description: "A quiet garden stay.",
  images: [],
  amenities: ["Breakfast"],
  rating: "4.5",
  reviewCount: 8,
  isBillflowConnected: 0,
  approvalStatus: "approved",
  lat: "5.603700",
  lng: "-0.187000",
};
const manualRoom = {
  id: 31,
  hotelId: 21,
  name: "Garden King",
  roomType: "king",
  description: "Garden-facing room",
  capacity: 2,
  priceGhs: "850.00",
  priceUsd: "58.50",
  totalRooms: 3,
  amenities: ["Breakfast"],
  images: [],
};
const scenario = { bookingRows: [] as Array<{ roomId: number; checkInDate: string; checkOutDate: string; bookingStatus: string }>, blockedRows: [] as Array<{ roomId: number | null; startDate: string; endDate: string }> };

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    listApprovedHotels: vi.fn(async () => [manualHotel]),
    listRoomsForHotel: vi.fn(async () => [manualRoom]),
    listRoomAvailabilityForHotel: vi.fn(async ({ checkInDate, checkOutDate }: { hotelId: number; checkInDate: string; checkOutDate: string }) => [{ ...manualRoom, ...actual.calculateRoomAvailability(manualRoom, scenario.bookingRows, scenario.blockedRows, checkInDate, checkOutDate) }]),
    getHotelById: vi.fn(async (id: number) => id === manualHotel.id ? manualHotel : undefined),
    listReviewsForHotel: vi.fn(async () => []),
  };
});

vi.mock("./staynest", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./staynest")>();
  return { ...actual, getLiveAvailability: vi.fn(async () => ({ source: "fallback" as const })) };
});

import { appRouter } from "./routers";

const publicContext = () => ({ user: undefined, req: { protocol: "https", headers: {} } as any, res: {} as any });
const defaultTestStayDates = () => {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 14);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 3);
  return { checkInDate: checkIn.toISOString().slice(0, 10), checkOutDate: checkOut.toISOString().slice(0, 10) };
};

describe("guest-facing manual inventory mappings", () => {
  beforeEach(() => {
    const dates = defaultTestStayDates();
    scenario.bookingRows = [{ roomId: 31, checkInDate: dates.checkInDate, checkOutDate: dates.checkOutDate, bookingStatus: "booked" }];
    scenario.blockedRows = [];
  });

  it("propagates reduced manual availability from an overlapping active booking through catalog search", async () => {
    const result = await appRouter.createCaller(publicContext()).catalog.search({ location: "Accra", guestsCount: 2, currency: "GHS" });
    expect(result[0]?.isBillflowConnected).toBe(false);
    expect(result[0]?.rooms[0]).toMatchObject({ id: 31, availableRooms: 2, liveSource: "staynest" });
  });

  it("propagates zero manual availability from a whole-property block through the property page", async () => {
    scenario.bookingRows = [];
    const dates = defaultTestStayDates();
    scenario.blockedRows = [{ roomId: null, startDate: dates.checkInDate, endDate: dates.checkOutDate }];
    const result = await appRouter.createCaller(publicContext()).catalog.getHotel({ id: 21 });
    expect(result.rooms[0]).toMatchObject({ id: 31, availableRooms: 0, liveSource: "staynest" });
  });

  it("propagates zero manual availability from a room-specific block through live availability", async () => {
    scenario.bookingRows = [];
    const dates = defaultTestStayDates();
    scenario.blockedRows = [{ roomId: 31, startDate: dates.checkInDate, endDate: dates.checkOutDate }];
    const result = await appRouter.createCaller(publicContext()).catalog.liveAvailability({ hotelId: 21, roomTypeId: 31, ...dates });
    expect(result).toMatchObject({ availableRooms: 0, source: "staynest" });
  });

  it("uses StayNest as the live-availability source with reduced inventory for an overlapping booking", async () => {
    const dates = defaultTestStayDates();
    const result = await appRouter.createCaller(publicContext()).catalog.liveAvailability({ hotelId: 21, roomTypeId: 31, ...dates });
    expect(result).toMatchObject({ availableRooms: 2, source: "staynest", livePricing: { ghs: 850, usd: 58.5 } });
  });
});
