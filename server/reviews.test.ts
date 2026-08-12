import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("Interactive Guest Reviews", () => {
  it("enforces that only guests with a matching booking can submit a review", async () => {
    const caller = appRouter.createCaller({
      user: { id: 999, openId: "test-guest", name: "Test Guest", email: "guest@example.com", role: "user", loginMethod: "manus", lastSignedIn: new Date() },
    });

    await expect(
      caller.bookings.addReview({
        hotelId: 1,
        bookingId: 999999,
        rating: 5,
        comment: "Wonderful stay!",
      })
    ).rejects.toThrow("Reviews are only available for confirmed and completed stays.");
  });
});
