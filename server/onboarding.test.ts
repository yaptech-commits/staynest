import { describe, expect, it } from "vitest";
import { completeOnboardingIntent, createOnboardingIntent, isValidOnboardingEmail, onboardingDestination, onboardingNavigationTarget, verificationPromptEmail } from "../shared/onboarding";
import { buildOnboardingPersistencePayload, saveOnboardingProfile } from "./db";

describe("StayNest onboarding validation", () => {
  it("accepts a guest onboarding intent and normalizes contact details", () => {
    expect(isValidOnboardingEmail("guest@example.com")).toBe(true);
    expect(createOnboardingIntent({
      role: "guest",
      fullName: "  Ama Mensah ",
      email: " AMA@EXAMPLE.COM ",
      now: 123,
    })).toEqual({
      role: "guest",
      fullName: "Ama Mensah",
      email: "ama@example.com",
      createdAt: 123,
    });
  });

  it("routes guests and partners to their correct post-sign-up experiences", () => {
    expect(onboardingDestination("guest")).toBe("/account?onboarding=complete");
    expect(onboardingDestination("partner")).toBe("/hotel-dashboard?onboarding=complete");
  });

  it("preserves onboarding completion queries when auth returns to the same path", () => {
    expect(onboardingNavigationTarget("/hotel-dashboard?onboarding=complete", "/hotel-dashboard", "")).toBe("/hotel-dashboard?onboarding=complete");
    expect(onboardingNavigationTarget("/hotel-dashboard?onboarding=complete", "/hotel-dashboard", "?onboarding=complete")).toBeNull();
    expect(onboardingNavigationTarget("/account?onboarding=complete", "/account", "")).toBe("/account?onboarding=complete");
  });

  it("shows the partner verification prompt only when an email is pending", () => {
    expect(verificationPromptEmail("pending", "partner@example.com")).toBe("partner@example.com");
    expect(verificationPromptEmail("verified", "partner@example.com")).toBeUndefined();
    expect(verificationPromptEmail("pending", null)).toBeUndefined();
  });

  it("consumes a stored partner intent, saves it, clears it, and redirects", async () => {
    const saved: unknown[] = [];
    const cleared: boolean[] = [];
    const redirects: string[] = [];
    const completed = await completeOnboardingIntent({
      rawIntent: JSON.stringify({ role: "partner", fullName: "Kojo Mensah", email: "kojo@example.com", businessName: "Akwaba House", createdAt: 123 }),
      save: async (intent) => { saved.push(intent); },
      clear: () => { cleared.push(true); },
      redirect: (destination) => { redirects.push(destination); },
    });

    expect(completed).toBe(true);
    expect(saved).toEqual([{ role: "partner", fullName: "Kojo Mensah", email: "kojo@example.com", businessName: "Akwaba House" }]);
    expect(cleared).toHaveLength(1);
    expect(redirects).toEqual(["/hotel-dashboard?onboarding=complete"]);
  });

  it("maps partner onboarding details to a hotel_owner user and profile upsert", () => {
    expect(buildOnboardingPersistencePayload({
      userId: 41,
      role: "partner",
      fullName: "Kojo Mensah",
      email: "kojo@example.com",
      businessName: "Akwaba House",
    })).toEqual({
      user: { name: "Kojo Mensah", email: "kojo@example.com", role: "hotel_owner" },
      profile: { userId: 41, role: "partner", fullName: "Kojo Mensah", email: "kojo@example.com", businessName: "Akwaba House" },
    });
  });

  it("exercises the onboarding profile upsert path without a real database", async () => {
    const userUpdates: unknown[] = [];
    const profileUpserts: unknown[] = [];
    const profiles = new Map<number, unknown>();
    const store = {
      updateUser: async (userId: number, values: unknown) => { userUpdates.push({ userId, values }); },
      upsertProfile: async (profile: { userId: number }) => { profileUpserts.push(profile); profiles.set(profile.userId, profile); },
      getProfile: async (userId: number) => profiles.get(userId),
    };

    await saveOnboardingProfile({ userId: 7, role: "guest", fullName: "Ama Mensah", email: "ama@example.com" }, store);
    await saveOnboardingProfile({ userId: 7, role: "partner", fullName: "Ama Mensah", email: "ama@example.com", businessName: "Akwaba House" }, store);

    expect(userUpdates).toEqual([
      { userId: 7, values: { name: "Ama Mensah", email: "ama@example.com", role: "user" } },
      { userId: 7, values: { name: "Ama Mensah", email: "ama@example.com", role: "hotel_owner" } },
    ]);
    expect(profileUpserts).toHaveLength(2);
    expect(profiles.get(7)).toMatchObject({ userId: 7, role: "partner", fullName: "Ama Mensah", email: "ama@example.com", businessName: "Akwaba House", emailVerificationStatus: "pending" });
    const savedProfile = profiles.get(7) as { emailVerificationToken?: unknown; emailVerificationExpiresAt?: unknown };
    expect(typeof savedProfile.emailVerificationToken).toBe("string");
    expect(savedProfile.emailVerificationToken).toHaveLength(40);
    expect(savedProfile.emailVerificationExpiresAt).toBeInstanceOf(Date);
  });

  it("does not save malformed onboarding intent", async () => {
    const saved: unknown[] = [];
    const cleared: boolean[] = [];
    const completed = await completeOnboardingIntent({
      rawIntent: "not-json",
      save: async (intent) => { saved.push(intent); },
      clear: () => { cleared.push(true); },
      redirect: () => undefined,
    });

    expect(completed).toBe(false);
    expect(saved).toEqual([]);
    expect(cleared).toHaveLength(1);
  });

  it("requires a business name for hotel partners", () => {
    expect(() => createOnboardingIntent({
      role: "partner",
      fullName: "Kojo Mensah",
      email: "kojo@example.com",
      now: 123,
    })).toThrow("hotel or business name");
  });

  it("rejects invalid contact details and missing names", () => {
    expect(isValidOnboardingEmail("not-an-email")).toBe(false);
    expect(() => createOnboardingIntent({
      role: "guest",
      fullName: "A",
      email: "guest@example.com",
    })).toThrow("full name");
    expect(() => createOnboardingIntent({
      role: "guest",
      fullName: "Ama Mensah",
      email: "not-an-email",
    })).toThrow("valid email");
  });
});
