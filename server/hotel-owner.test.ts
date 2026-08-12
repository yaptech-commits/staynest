import { describe, expect, it } from "vitest";
import { buildManualHotelValues, buildManualRoomValues, calculateRoomAvailability, isHotelOwner } from "./db";

describe("manual hotel inventory availability", () => {
  const room = { id: 10, totalRooms: 3 };

  it("subtracts overlapping booked rooms but ignores cancelled and non-overlapping stays", () => {
    const result = calculateRoomAvailability(
      room,
      [
        { roomId: 10, checkInDate: "2026-10-10", checkOutDate: "2026-10-13", bookingStatus: "booked" },
        { roomId: 10, checkInDate: "2026-10-11", checkOutDate: "2026-10-12", bookingStatus: "cancelled" },
        { roomId: 10, checkInDate: "2026-10-20", checkOutDate: "2026-10-22", bookingStatus: "checked_out" },
      ],
      [],
      "2026-10-12",
      "2026-10-15",
    );

    expect(result).toEqual({ bookedRooms: 1, blockedRooms: 0, availableRooms: 2 });
  });

  it("treats a room-specific block and a whole-property block as unavailable", () => {
    const roomBlock = calculateRoomAvailability(
      room,
      [],
      [{ roomId: 10, startDate: "2026-10-10", endDate: "2026-10-13" }],
      "2026-10-12",
      "2026-10-15",
    );
    const propertyBlock = calculateRoomAvailability(
      room,
      [],
      [{ roomId: null, startDate: "2026-10-10", endDate: "2026-10-13" }],
      "2026-10-12",
      "2026-10-15",
    );

    expect(roomBlock.availableRooms).toBe(0);
    expect(propertyBlock.availableRooms).toBe(0);
  });

  it("builds a pending manual property payload with listing details", () => {
    const values = buildManualHotelValues({ ownerId: 7, name: "  Akwaba House  ", location: "  East Legon, Accra  ", address: "12 Wawa Street", description: "A quiet garden stay.", amenities: ["Breakfast", "Pool"], images: ["https://example.com/house.jpg"], lat: 5.6037, lng: -0.187 });

    expect(values).toMatchObject({ ownerId: 7, name: "Akwaba House", location: "East Legon, Accra", address: "12 Wawa Street", approvalStatus: "pending", isBillflowConnected: 0, amenities: ["Breakfast", "Pool"], images: ["https://example.com/house.jpg"], lat: "5.603700", lng: "-0.187000" });
    expect(values.slug).toMatch(/^akwaba-house-[-_a-z0-9]{6}$/);
  });

  it("builds manual room inventory with normalized rates and details", () => {
    expect(buildManualRoomValues({ hotelId: 4, name: "  Garden King ", roomType: "  king ", description: "Garden-facing room", capacity: 2, priceGhs: 850, priceUsd: 58.5, totalRooms: 4, amenities: ["Breakfast"], images: ["https://example.com/room.jpg"] })).toEqual({ hotelId: 4, name: "Garden King", roomType: "king", description: "Garden-facing room", capacity: 2, priceGhs: "850.00", priceUsd: "58.50", totalRooms: 4, amenities: ["Breakfast"], images: ["https://example.com/room.jpg"] });
  });

  it("allows only the owning hotel partner to manage a property", () => {
    expect(isHotelOwner({ ownerId: 7 }, 7)).toBe(true);
    expect(isHotelOwner({ ownerId: 7 }, 8)).toBe(false);
    expect(isHotelOwner(undefined, 7)).toBe(false);
  });

  it("keeps inventory available when bookings and blocks do not overlap", () => {
    const result = calculateRoomAvailability(
      room,
      [{ roomId: 10, checkInDate: "2026-10-01", checkOutDate: "2026-10-03", bookingStatus: "booked" }],
      [{ roomId: 10, startDate: "2026-10-04", endDate: "2026-10-05" }],
      "2026-10-10",
      "2026-10-12",
    );

    expect(result).toEqual({ bookedRooms: 0, blockedRooms: 0, availableRooms: 3 });
  });
});
