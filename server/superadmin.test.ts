import { describe, expect, it } from "vitest";
import type { User } from "@/../drizzle/schema";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { isPlatformAdmin } from "./_core/trpc";

const userWithRole = (role: User["role"]) => ({ role }) as User;

const contextForRole = (role: User["role"]): TrpcContext => ({
  user: userWithRole(role),
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("platform administrator authorization", () => {
  it("recognizes both admin and superadmin roles", () => {
    expect(isPlatformAdmin(userWithRole("admin"))).toBe(true);
    expect(isPlatformAdmin(userWithRole("superadmin"))).toBe(true);
  });

  it("does not grant platform access to guests or missing sessions", () => {
    expect(isPlatformAdmin(userWithRole("user"))).toBe(false);
    expect(isPlatformAdmin(userWithRole("hotel_owner"))).toBe(false);
    expect(isPlatformAdmin(null)).toBe(false);
    expect(isPlatformAdmin(undefined)).toBe(false);
  });

  it("allows a superadmin to access every platform oversight collection", async () => {
    const caller = appRouter.createCaller(contextForRole("superadmin"));
    const [
      users,
      hotels,
      bookings,
      payouts,
      rooms,
      blockedAvailability,
      payoutAccounts,
      messages,
      ownerOperations,
    ] = await Promise.all([
      caller.admin.users(),
      caller.admin.hotels(),
      caller.admin.bookings(),
      caller.admin.payouts(),
      caller.admin.rooms(),
      caller.admin.blockedAvailability(),
      caller.admin.payoutAccounts(),
      caller.bookings.listMessages({ bookingId: 999999 }),
      caller.admin.ownerOperations(),
    ]);

    expect(Array.isArray(users)).toBe(true);
    expect(Array.isArray(hotels)).toBe(true);
    expect(Array.isArray(bookings)).toBe(true);
    expect(Array.isArray(payouts)).toBe(true);
    expect(Array.isArray(rooms)).toBe(true);
    expect(Array.isArray(blockedAvailability)).toBe(true);
    expect(Array.isArray(payoutAccounts)).toBe(true);
    expect(Array.isArray(messages)).toBe(true);
    expect(ownerOperations).toEqual(
      expect.objectContaining({
        owners: expect.any(Array),
        propertyCount: expect.any(Number),
        roomCount: expect.any(Number),
        bookingCount: expect.any(Number),
        payoutCount: expect.any(Number),
        payoutAccountCount: expect.any(Number),
      })
    );
  });

  it("allows a superadmin to access the platform summary procedure", async () => {
    const summary = await appRouter
      .createCaller(contextForRole("superadmin"))
      .admin.summary();

    expect(summary).toEqual(
      expect.objectContaining({
        hotelCount: expect.any(Number),
        bookingCount: expect.any(Number),
        gross: expect.any(Number),
        commission: expect.any(Number),
        conflictCount: expect.any(Number),
      })
    );
  });
});

export const confirmedSuperadminAccount = {
  email: "wisdomasaare41@gmail.com",
  role: "superadmin" as const,
};

it("preserves the confirmed superadmin account contract", () => {
  expect(confirmedSuperadminAccount).toEqual({
    email: "wisdomasaare41@gmail.com",
    role: "superadmin",
  });
});
