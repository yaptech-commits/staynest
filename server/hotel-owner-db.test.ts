import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  roomRows: [{ id: 10, hotelId: 4, name: "Garden King", roomType: "king", description: null, capacity: 2, priceGhs: "850.00", priceUsd: "58.50", totalRooms: 3, amenities: [], images: [] }],
  bookingRows: [{ roomId: 10, checkInDate: "2026-10-10", checkOutDate: "2026-10-13", bookingStatus: "booked" }],
  blockedRows: [],
  selectIndex: 0,
}));

const fakeDb = vi.hoisted(() => ({
  insert: vi.fn(() => ({ values: vi.fn(() => Promise.resolve([{ insertId: 42 }])) })),
  update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve([{ affectedRows: 1 }])) })) })),
  select: vi.fn(() => {
    const index = state.selectIndex++;
    const rows = index === 0 ? state.roomRows : index === 1 ? state.bookingRows : state.blockedRows;
    return {
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve(rows)),
        })),
      })),
    };
  }),
}));

vi.mock("drizzle-orm/mysql2", () => ({ drizzle: vi.fn(() => fakeDb) }));

import { blockedDates, bookings, rooms } from "../drizzle/schema";
import { createHotelForOwner, createRoomForHotel, listRoomAvailabilityForHotel, updateHotelForOwner, updateRoomForHotel } from "./db";

describe("non-BillFlow database helpers", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "mysql://test:test@localhost/staynest";
    state.roomRows = [{ id: 10, hotelId: 4, name: "Garden King", roomType: "king", description: null, capacity: 2, priceGhs: "850.00", priceUsd: "58.50", totalRooms: 3, amenities: [], images: [] }];
    state.bookingRows = [{ roomId: 10, checkInDate: "2026-10-10", checkOutDate: "2026-10-13", bookingStatus: "booked" }];
    state.blockedRows = [];
    state.selectIndex = 0;
    fakeDb.insert.mockClear();
    fakeDb.update.mockClear();
    fakeDb.select.mockClear();
  });

  it("creates a manual property through the real helper", async () => {
    const result = await createHotelForOwner({ ownerId: 7, name: "Akwaba House", location: "East Legon, Accra" });
    expect(result).toMatchObject({ id: 42, ownerId: 7, name: "Akwaba House", location: "East Legon, Accra", approvalStatus: "pending", isBillflowConnected: 0 });
    expect(fakeDb.insert).toHaveBeenCalledOnce();
  });

  it("creates and updates room inventory through the real helpers", async () => {
    const created = await createRoomForHotel({ hotelId: 4, name: "Garden King", roomType: "king", description: null, capacity: 2, priceGhs: "850.00", priceUsd: "58.50", totalRooms: 3, amenities: [], images: [] });
    const updated = await updateRoomForHotel({ id: 10, hotelId: 4, values: { priceGhs: "900.00", totalRooms: 4 } });

    expect(created).toMatchObject({ id: 42, hotelId: 4, priceGhs: "850.00" });
    expect(updated).toBe(true);
    expect(fakeDb.update).toHaveBeenCalledOnce();
  });

  it("updates only the owner-scoped property through the real helper", async () => {
    await expect(updateHotelForOwner({ id: 4, ownerId: 7, values: { description: "Updated details" } })).resolves.toBe(true);
    expect(fakeDb.update).toHaveBeenCalledOnce();
  });

  it("returns manual availability from the real query helper", async () => {
    const result = await listRoomAvailabilityForHotel({ hotelId: 4, checkInDate: "2026-10-12", checkOutDate: "2026-10-15" });
    expect(result[0]).toMatchObject({ id: 10, totalRooms: 3, bookedRooms: 1, blockedRooms: 0, availableRooms: 2 });
    expect([rooms, bookings, blockedDates]).toHaveLength(3);
  });
});
