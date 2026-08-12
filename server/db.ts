import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, hotels, rooms, bookings, reviews, blockedDates, onboardingProfiles } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      const value = user[field] ?? null;
      values[field] = value;
      updateSet[field] = value;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listApprovedHotels() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hotels).where(eq(hotels.approvalStatus, "approved")).orderBy(desc(hotels.createdAt));
}

export async function getHotelById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(hotels).where(eq(hotels.id, id)).limit(1);
  return result[0];
}

export async function listRoomsForHotel(hotelId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rooms).where(eq(rooms.hotelId, hotelId)).orderBy(rooms.priceGhs);
}

export async function createBooking(input: typeof bookings.$inferInsert) {
  const db = await getDb();
  if (!db) return { id: 0, ...input } as typeof input & { id: number };
  const result = await db.insert(bookings).values(input);
  return { id: Number(result[0].insertId), ...input };
}

export async function getBookingsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt));
}

export async function getAllBookings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).orderBy(desc(bookings.createdAt));
}

export async function cancelBookingForUser(id: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(bookings).set({ bookingStatus: "cancelled" }).where(and(eq(bookings.id, id), eq(bookings.userId, userId)));
  return result[0].affectedRows > 0;
}

export async function listHotelsForOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hotels).where(eq(hotels.ownerId, ownerId)).orderBy(desc(hotels.createdAt));
}

export async function listAllHotels() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hotels).orderBy(desc(hotels.createdAt));
}

export async function updateHotelApproval(id: number, approvalStatus: "approved" | "rejected" | "pending") {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(hotels).set({ approvalStatus }).where(eq(hotels.id, id));
  return result[0].affectedRows > 0;
}

export async function addReview(input: typeof reviews.$inferInsert) {
  const db = await getDb();
  if (!db) return { id: 0, ...input } as typeof input & { id: number };
  const result = await db.insert(reviews).values(input);
  return { id: Number(result[0].insertId), ...input };
}

export async function listReviewsForHotel(hotelId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.hotelId, hotelId)).orderBy(desc(reviews.createdAt));
}

export async function blockDates(input: typeof blockedDates.$inferInsert) {
  const db = await getDb();
  if (!db) return { id: 0, ...input } as typeof input & { id: number };
  const result = await db.insert(blockedDates).values(input);
  return { id: Number(result[0].insertId), ...input };
}

export async function listBlockedDates(hotelId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blockedDates).where(eq(blockedDates.hotelId, hotelId)).orderBy(desc(blockedDates.startDate));
}

export async function listBookingsForHotel(hotelId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(eq(bookings.hotelId, hotelId)).orderBy(desc(bookings.createdAt));
}

export async function listConflictBookingsForHotel(hotelId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(and(eq(bookings.hotelId, hotelId), eq(bookings.bookingStatus, "conflict_flagged"))).orderBy(desc(bookings.createdAt));
}

export async function updateBookingStatusForHotel(input: { id: number; hotelId: number; bookingStatus: "booked" | "checked_in" | "checked_out" | "cancelled" | "conflict_flagged"; conflictDetails?: string | null }) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(bookings).set({ bookingStatus: input.bookingStatus, conflictDetails: input.conflictDetails ?? null }).where(and(eq(bookings.id, input.id), eq(bookings.hotelId, input.hotelId)));
  return result[0].affectedRows > 0;
}

export async function createRoomForHotel(input: typeof rooms.$inferInsert) {
  const db = await getDb();
  if (!db) return { id: 0, ...input } as typeof input & { id: number };
  const result = await db.insert(rooms).values(input);
  return { id: Number(result[0].insertId), ...input };
}

export async function updateRoomForHotel(input: { id: number; hotelId: number; values: Partial<typeof rooms.$inferInsert> }) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(rooms).set(input.values).where(and(eq(rooms.id, input.id), eq(rooms.hotelId, input.hotelId)));
  return result[0].affectedRows > 0;
}

export async function deleteBlockedDateForHotel(id: number, hotelId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(blockedDates).where(and(eq(blockedDates.id, id), eq(blockedDates.hotelId, hotelId)));
  return result[0].affectedRows > 0;
}

export async function refundBookingForAdmin(id: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(bookings).set({ paymentStatus: "refunded", bookingStatus: "cancelled", conflictDetails: "Refunded by StayNest platform operations." }).where(eq(bookings.id, id));
  return result[0].affectedRows > 0;
}

export async function recordAvailabilityEvent(input: import("../drizzle/schema").InsertAvailabilityEvent) {
  const db = await getDb();
  if (!db) return { id: 0, ...input } as import("../drizzle/schema").AvailabilityEvent & { id: number };
  const result = await db.insert((await import("../drizzle/schema")).availabilityEvents).values(input);
  return { id: Number(result[0].insertId), ...input };
}

export async function updateBookingFromBillFlow(input: { bookingReference: string; bookingStatus: "booked" | "cancelled" | "conflict_flagged"; conflictDetails?: string | null }) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(bookings).set({ bookingStatus: input.bookingStatus, conflictDetails: input.conflictDetails ?? null }).where(eq(bookings.bookingReference, input.bookingReference));
  return result[0].affectedRows > 0;
}

export async function getBookingForUser(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookings).where(and(eq(bookings.id, id), eq(bookings.userId, userId))).limit(1);
  return result[0];
}

export async function recordBookingFinance(input: { bookingId: number; hotelId: number; currency: string; grossAmount: number; commissionRate: number; commissionAmount: number; hotelPayoutAmount: number }) {
  const db = await getDb();
  if (!db) return { ledgerId: 0, payoutId: 0 };
  const ledger = await db.insert((await import("../drizzle/schema")).commissionLedger).values({ bookingId: input.bookingId, hotelId: input.hotelId, currency: input.currency, grossAmount: input.grossAmount.toFixed(2), commissionRate: input.commissionRate.toFixed(4), commissionAmount: input.commissionAmount.toFixed(2), hotelPayoutAmount: input.hotelPayoutAmount.toFixed(2), status: "pending" });
  const payout = await db.insert((await import("../drizzle/schema")).payouts).values({ hotelId: input.hotelId, currency: input.currency, amount: input.hotelPayoutAmount.toFixed(2), status: "pending" });
  return { ledgerId: Number(ledger[0].insertId), payoutId: Number(payout[0].insertId) };
}

export async function listPayouts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from((await import("../drizzle/schema")).payouts).orderBy(desc((await import("../drizzle/schema")).payouts.createdAt));
}

export function buildOnboardingPersistencePayload(input: { userId: number; role: "guest" | "partner"; fullName: string; email: string; businessName?: string }) {
  return {
    user: {
      name: input.fullName,
      email: input.email,
      role: input.role === "partner" ? "hotel_owner" as const : "user" as const,
    },
    profile: {
      userId: input.userId,
      role: input.role,
      fullName: input.fullName,
      email: input.email,
      businessName: input.businessName ?? null,
    },
  };
}

type OnboardingProfilePersistenceStore = {
  updateUser: (userId: number, values: { name: string; email: string; role: "user" | "hotel_owner" }) => Promise<void>;
  upsertProfile: (profile: { userId: number; role: "guest" | "partner"; fullName: string; email: string; businessName: string | null }) => Promise<void>;
  getProfile: (userId: number) => Promise<unknown | undefined>;
};

export async function saveOnboardingProfile(input: { userId: number; role: "guest" | "partner"; fullName: string; email: string; businessName?: string }, injectedStore?: OnboardingProfilePersistenceStore) {
  let store = injectedStore;
  if (!store) {
    const db = await getDb();
    if (!db) return { id: 0, ...input };
    store = {
      updateUser: async (userId, values) => {
        await db.update(users).set(values).where(eq(users.id, userId));
      },
      upsertProfile: async (profile) => {
        await db.insert(onboardingProfiles).values(profile).onDuplicateKeyUpdate({ set: profile });
      },
      getProfile: async (userId) => {
        const result = await db.select().from(onboardingProfiles).where(eq(onboardingProfiles.userId, userId)).limit(1);
        return result[0];
      },
    };
  }

  const payload = buildOnboardingPersistencePayload(input);
  await store.updateUser(input.userId, payload.user);
  await store.upsertProfile(payload.profile);
  return await store.getProfile(input.userId) ?? { id: 0, ...input };
}
