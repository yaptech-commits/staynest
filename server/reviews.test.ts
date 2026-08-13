import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("Interactive Guest Reviews with Photo Attachments", () => {
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
        photoUrls: ["https://example.com/photo.jpg"],
      })
    ).rejects.toThrow("Reviews are only available for confirmed and completed stays.");
  });

  it("rejects non-image MIME types in review photo uploads", async () => {
    const caller = appRouter.createCaller({
      user: { id: 999, openId: "test-guest", name: "Test Guest", email: "guest@example.com", role: "user", loginMethod: "manus", lastSignedIn: new Date() },
    });

    const invalidBase64 = "data:application/pdf;base64,JVBERi0xLjMK";

    await expect(
      caller.bookings.uploadReviewPhoto({
        base64Data: invalidBase64,
        fileName: "document.pdf",
      })
    ).rejects.toThrow("Only JPEG, PNG, and WebP image formats are supported.");
  });
});
