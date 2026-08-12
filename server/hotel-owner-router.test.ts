import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const context = (): TrpcContext => ({
  user: { id: 8, openId: "owner-8", name: "Owner", email: "owner@example.com", loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("non-BillFlow hotel owner router access", () => {
  beforeEach(() => vi.stubEnv("DATABASE_URL", ""));
  afterEach(() => vi.unstubAllEnvs());

  it("rejects property updates when the hotel is not owned by the caller", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.hotel.update({ id: 9999, name: "Unauthorized update" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects room creation and room updates when the hotel is not owned by the caller", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.hotel.createRoom({ hotelId: 9999, name: "Room", roomType: "standard", capacity: 2, priceGhs: 500, priceUsd: 35, totalRooms: 2, amenities: [], images: [] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.hotel.updateRoom({ id: 10, hotelId: 9999, priceGhs: 600 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects manual availability queries when the hotel is not owned by the caller", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.hotel.availability({ hotelId: 9999, checkInDate: "2026-10-12", checkOutDate: "2026-10-15" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
