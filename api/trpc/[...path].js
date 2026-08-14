var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  availabilityEvents: () => availabilityEvents,
  blockedDates: () => blockedDates,
  bookings: () => bookings,
  cancellationPolicies: () => cancellationPolicies,
  commissionLedger: () => commissionLedger,
  hotels: () => hotels,
  messages: () => messages,
  notifications: () => notifications,
  onboardingProfiles: () => onboardingProfiles,
  partnerPayoutAccounts: () => partnerPayoutAccounts,
  payouts: () => payouts,
  ratePlans: () => ratePlans,
  reviews: () => reviews,
  rooms: () => rooms,
  userPreferences: () => userPreferences,
  users: () => users
});
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";
var users, hotels, rooms, bookings, reviews, blockedDates, ratePlans, availabilityEvents, commissionLedger, payouts, cancellationPolicies, notifications, onboardingProfiles, partnerPayoutAccounts, userPreferences, messages;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      passwordHash: varchar("passwordHash", { length: 255 }),
      avatarUrl: text("avatarUrl"),
      passwordResetToken: varchar("passwordResetToken", { length: 128 }),
      passwordResetExpires: timestamp("passwordResetExpires"),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "hotel_owner", "admin"]).default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    hotels = mysqlTable("staynest_hotels", {
      id: int("id").autoincrement().primaryKey(),
      ownerId: int("ownerId").notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      slug: varchar("slug", { length: 255 }).notNull().unique(),
      description: text("description"),
      location: varchar("location", { length: 255 }).notNull(),
      // e.g. "East Legon, Accra"
      address: text("address"),
      lat: decimal("lat", { precision: 10, scale: 6 }),
      lng: decimal("lng", { precision: 10, scale: 6 }),
      images: json("images").notNull(),
      // array of image URLs
      amenities: json("amenities").notNull(),
      // array of strings
      rating: decimal("rating", { precision: 3, scale: 2 }).default("4.80"),
      reviewCount: int("reviewCount").default(0),
      isBillflowConnected: int("isBillflowConnected").default(0),
      // 1 for connected, 0 for manual
      billflowBusinessId: varchar("billflowBusinessId", { length: 128 }),
      billflowPropertyId: varchar("billflowPropertyId", { length: 128 }),
      approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    rooms = mysqlTable("staynest_rooms", {
      id: int("id").autoincrement().primaryKey(),
      hotelId: int("hotelId").notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      // e.g. "Deluxe Executive King"
      roomType: varchar("roomType", { length: 128 }).notNull(),
      description: text("description"),
      capacity: int("capacity").default(2).notNull(),
      priceGhs: decimal("priceGhs", { precision: 10, scale: 2 }).notNull(),
      priceUsd: decimal("priceUsd", { precision: 10, scale: 2 }).notNull(),
      totalRooms: int("totalRooms").default(5).notNull(),
      amenities: json("amenities"),
      images: json("images"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    bookings = mysqlTable("staynest_bookings", {
      id: int("id").autoincrement().primaryKey(),
      bookingReference: varchar("bookingReference", { length: 64 }).notNull().unique(),
      userId: int("userId").notNull(),
      hotelId: int("hotelId").notNull(),
      roomId: int("roomId").notNull(),
      roomNumber: varchar("roomNumber", { length: 64 }),
      billflowReservationId: varchar("billflowReservationId", { length: 128 }),
      checkInDate: varchar("checkInDate", { length: 32 }).notNull(),
      checkOutDate: varchar("checkOutDate", { length: 32 }).notNull(),
      numberOfNights: int("numberOfNights").notNull(),
      guestsCount: int("guestsCount").default(1).notNull(),
      guestName: varchar("guestName", { length: 255 }).notNull(),
      guestEmail: varchar("guestEmail", { length: 320 }).notNull(),
      guestPhone: varchar("guestPhone", { length: 64 }),
      currency: varchar("currency", { length: 8 }).default("GHS").notNull(),
      totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
      commissionAmount: decimal("commissionAmount", { precision: 10, scale: 2 }).notNull(),
      // 15% flat
      hotelPayoutAmount: decimal("hotelPayoutAmount", { precision: 10, scale: 2 }).notNull(),
      paymentGateway: varchar("paymentGateway", { length: 32 }).default("paystack").notNull(),
      // paystack or flutterwave
      paymentReference: varchar("paymentReference", { length: 128 }),
      paymentStatus: mysqlEnum("paymentStatus", ["pending", "success", "failed", "refunded"]).default("pending").notNull(),
      bookingStatus: mysqlEnum("bookingStatus", ["booked", "checked_in", "checked_out", "cancelled", "conflict_flagged"]).default("booked").notNull(),
      specialRequests: text("specialRequests"),
      conflictDetails: text("conflictDetails"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    reviews = mysqlTable("staynest_reviews", {
      id: int("id").autoincrement().primaryKey(),
      hotelId: int("hotelId").notNull(),
      userId: int("userId").notNull(),
      bookingId: int("bookingId").notNull(),
      rating: int("rating").notNull(),
      // 1 to 5
      comment: text("comment"),
      photoUrls: json("photoUrls"),
      // array of S3 / storage image URLs attached by guest
      guestName: varchar("guestName", { length: 255 }).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    blockedDates = mysqlTable("staynest_blocked_dates", {
      id: int("id").autoincrement().primaryKey(),
      hotelId: int("hotelId").notNull(),
      roomId: int("roomId"),
      startDate: varchar("startDate", { length: 32 }).notNull(),
      endDate: varchar("endDate", { length: 32 }).notNull(),
      reason: text("reason"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    ratePlans = mysqlTable("staynest_rate_plans", {
      id: int("id").autoincrement().primaryKey(),
      hotelId: int("hotelId").notNull(),
      roomId: int("roomId").notNull(),
      name: varchar("name", { length: 128 }).notNull(),
      currency: varchar("currency", { length: 8 }).notNull(),
      nightlyAmount: decimal("nightlyAmount", { precision: 10, scale: 2 }).notNull(),
      cancellationPolicyId: int("cancellationPolicyId"),
      billflowRatePlanId: varchar("billflowRatePlanId", { length: 128 }),
      isActive: int("isActive").default(1).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    availabilityEvents = mysqlTable("staynest_availability_events", {
      id: int("id").autoincrement().primaryKey(),
      hotelId: int("hotelId").notNull(),
      roomId: int("roomId").notNull(),
      source: varchar("source", { length: 32 }).notNull(),
      eventType: varchar("eventType", { length: 64 }).notNull(),
      checkInDate: varchar("checkInDate", { length: 32 }).notNull(),
      checkOutDate: varchar("checkOutDate", { length: 32 }).notNull(),
      externalReference: varchar("externalReference", { length: 128 }),
      payload: json("payload"),
      conflictFlagged: int("conflictFlagged").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    commissionLedger = mysqlTable("staynest_commission_ledger", {
      id: int("id").autoincrement().primaryKey(),
      bookingId: int("bookingId").notNull(),
      hotelId: int("hotelId").notNull(),
      currency: varchar("currency", { length: 8 }).notNull(),
      grossAmount: decimal("grossAmount", { precision: 10, scale: 2 }).notNull(),
      commissionRate: decimal("commissionRate", { precision: 5, scale: 4 }).notNull(),
      commissionAmount: decimal("commissionAmount", { precision: 10, scale: 2 }).notNull(),
      hotelPayoutAmount: decimal("hotelPayoutAmount", { precision: 10, scale: 2 }).notNull(),
      status: mysqlEnum("status", ["pending", "payable", "paid", "refunded"]).default("pending").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    payouts = mysqlTable("staynest_payouts", {
      id: int("id").autoincrement().primaryKey(),
      hotelId: int("hotelId").notNull(),
      currency: varchar("currency", { length: 8 }).notNull(),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      status: mysqlEnum("status", ["pending", "processing", "paid", "failed"]).default("pending").notNull(),
      processorReference: varchar("processorReference", { length: 128 }),
      paidAt: timestamp("paidAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    cancellationPolicies = mysqlTable("staynest_cancellation_policies", {
      id: int("id").autoincrement().primaryKey(),
      hotelId: int("hotelId").notNull(),
      name: varchar("name", { length: 128 }).notNull(),
      freeCancellationHours: int("freeCancellationHours").default(48).notNull(),
      refundPercentageAfterWindow: int("refundPercentageAfterWindow").default(0).notNull(),
      isNonRefundable: int("isNonRefundable").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    notifications = mysqlTable("staynest_notifications", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      bookingId: int("bookingId"),
      type: varchar("type", { length: 64 }).notNull(),
      title: varchar("title", { length: 255 }).notNull(),
      message: text("message").notNull(),
      readAt: timestamp("readAt"),
      dedupeKey: varchar("dedupeKey", { length: 255 }).notNull().unique(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    onboardingProfiles = mysqlTable("staynest_onboarding_profiles", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull().unique(),
      role: mysqlEnum("role", ["guest", "partner"]).notNull(),
      fullName: varchar("fullName", { length: 255 }).notNull(),
      email: varchar("email", { length: 320 }).notNull(),
      businessName: varchar("businessName", { length: 255 }),
      emailVerificationStatus: mysqlEnum("emailVerificationStatus", ["pending", "verified"]).default("pending").notNull(),
      emailVerificationToken: varchar("emailVerificationToken", { length: 128 }),
      emailVerificationExpiresAt: timestamp("emailVerificationExpiresAt"),
      emailVerifiedAt: timestamp("emailVerifiedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    partnerPayoutAccounts = mysqlTable("staynest_payout_accounts", {
      id: int("id").autoincrement().primaryKey(),
      hotelId: int("hotelId").notNull(),
      ownerId: int("ownerId").notNull(),
      payoutMethod: varchar("payoutMethod", { length: 32 }).notNull(),
      // "bank" | "mobile_money" | "cash"
      accountName: varchar("accountName", { length: 255 }).notNull(),
      accountNumber: varchar("accountNumber", { length: 128 }).notNull(),
      bankName: varchar("bankName", { length: 128 }),
      networkProvider: varchar("networkProvider", { length: 64 }),
      // e.g. "MTN Mobile Money"
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    userPreferences = mysqlTable("staynest_user_preferences", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull().unique(),
      phone: varchar("phone", { length: 64 }),
      smsRemindersEnabled: int("smsRemindersEnabled").default(1).notNull(),
      emailRemindersEnabled: int("emailRemindersEnabled").default(1).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    messages = mysqlTable("staynest_messages", {
      id: int("id").autoincrement().primaryKey(),
      bookingId: int("bookingId").notNull(),
      senderId: int("senderId").notNull(),
      receiverId: int("receiverId").notNull(),
      messageText: text("messageText").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
  }
});

// server/_core/vercelTrpc.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/storage.ts
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
init_schema();
import { z as z2 } from "zod";
import { nanoid as nanoid3 } from "nanoid";
import { TRPCError as TRPCError3 } from "@trpc/server";
import { eq as eq2 } from "drizzle-orm";

// server/db.ts
init_schema();
import { eq, desc, and, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
var _db = null;
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values = { openId: user.openId };
  const updateSet = {};
  for (const field of ["name", "email", "loginMethod"]) {
    if (user[field] !== void 0) {
      const value = user[field] ?? null;
      values[field] = value;
      updateSet[field] = value;
    }
  }
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId || user.email === "wisdomasaare41@gmail.com") {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= /* @__PURE__ */ new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
async function getUserByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const normalizedEmail = email.trim().toLowerCase();
  const result = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  return result[0];
}
async function createOrUpdateLocalUser(params) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const normalizedEmail = params.email.trim().toLowerCase();
  const existing = await getUserByEmail(normalizedEmail);
  const openId = existing?.openId ?? `local_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
  const role = params.role ?? (normalizedEmail === "wisdomasaare41@gmail.com" ? "admin" : existing?.role ?? "user");
  const values = {
    openId,
    name: params.name.trim(),
    email: normalizedEmail,
    loginMethod: "password",
    role,
    lastSignedIn: /* @__PURE__ */ new Date()
  };
  if (params.passwordHash) {
    values.passwordHash = params.passwordHash;
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({
    set: {
      name: params.name,
      ...params.passwordHash ? { passwordHash: params.passwordHash } : {},
      role,
      lastSignedIn: /* @__PURE__ */ new Date()
    }
  });
  return getUserByEmail(normalizedEmail);
}
async function listApprovedHotels() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hotels).where(eq(hotels.approvalStatus, "approved")).orderBy(desc(hotels.createdAt));
}
async function getHotelById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(hotels).where(eq(hotels.id, id)).limit(1);
  return result[0];
}
async function listRoomsForHotel(hotelId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rooms).where(eq(rooms.hotelId, hotelId)).orderBy(desc(rooms.createdAt));
}
function rangesOverlap(start, end, windowStart, windowEnd) {
  return start < windowEnd && end > windowStart;
}
function calculateRoomAvailability(room, bookingRows, blockedRows, checkInDate, checkOutDate) {
  const bookedRooms = bookingRows.filter(
    (booking) => booking.roomId === room.id && ["booked", "checked_in"].includes(booking.bookingStatus) && rangesOverlap(
      booking.checkInDate,
      booking.checkOutDate,
      checkInDate,
      checkOutDate
    )
  ).length;
  const blocked = blockedRows.some(
    (block) => (block.roomId === null || block.roomId === room.id) && rangesOverlap(block.startDate, block.endDate, checkInDate, checkOutDate)
  );
  const blockedRooms = blocked ? room.totalRooms : 0;
  return {
    bookedRooms,
    blockedRooms,
    availableRooms: Math.max(0, room.totalRooms - bookedRooms - blockedRooms)
  };
}
async function listRoomAvailabilityForHotel(input) {
  const [roomRows, bookingRows, blockedRows] = await Promise.all([
    listRoomsForHotel(input.hotelId),
    listBookingsForHotel(input.hotelId),
    listBlockedDates(input.hotelId)
  ]);
  return roomRows.map((room) => ({
    ...room,
    ...calculateRoomAvailability(
      room,
      bookingRows,
      blockedRows,
      input.checkInDate,
      input.checkOutDate
    )
  }));
}
async function createBooking(input) {
  const db = await getDb();
  if (!db) return { id: 0, ...input };
  const result = await db.insert(bookings).values(input);
  return { id: Number(result[0].insertId), ...input };
}
async function getBookingsForUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt));
}
async function getAllBookings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).orderBy(desc(bookings.createdAt));
}
async function getBookingByPaymentReference(paymentReference) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(bookings).where(eq(bookings.paymentReference, paymentReference)).limit(1);
  return result[0];
}
async function cancelBookingForUser(id, userId) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(bookings).set({ bookingStatus: "cancelled" }).where(and(eq(bookings.id, id), eq(bookings.userId, userId)));
  return result[0].affectedRows > 0;
}
async function listHotelsForOwner(ownerId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hotels).where(eq(hotels.ownerId, ownerId)).orderBy(desc(hotels.createdAt));
}
function buildManualHotelValues(input) {
  const slugBase = input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "staynest-property";
  return {
    ownerId: input.ownerId,
    name: input.name.trim(),
    slug: `${slugBase}-${nanoid(6).toLowerCase()}`,
    location: input.location.trim(),
    address: input.address?.trim() || null,
    description: input.description?.trim() || null,
    images: input.images ?? [],
    amenities: input.amenities ?? [],
    lat: input.lat === void 0 ? null : input.lat.toFixed(6),
    lng: input.lng === void 0 ? null : input.lng.toFixed(6),
    isBillflowConnected: 0,
    approvalStatus: "pending"
  };
}
function isHotelOwner(hotel, ownerId) {
  return Boolean(hotel && hotel.ownerId === ownerId);
}
async function createHotelForOwner(input) {
  const db = await getDb();
  const values = buildManualHotelValues(input);
  if (!db) return { id: 0, ...values };
  const result = await db.insert(hotels).values(values);
  return { id: Number(result[0].insertId), ...values };
}
async function updateHotelForOwner(input) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(hotels).set(input.values).where(and(eq(hotels.id, input.id), eq(hotels.ownerId, input.ownerId)));
  return result[0].affectedRows > 0;
}
async function listAllHotels() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hotels).orderBy(desc(hotels.createdAt));
}
async function updateHotelApproval(id, approvalStatus) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(hotels).set({ approvalStatus }).where(eq(hotels.id, id));
  return result[0].affectedRows > 0;
}
async function addReview(input) {
  const db = await getDb();
  if (!db) return { id: 0, ...input };
  const result = await db.insert(reviews).values(input);
  return { id: Number(result[0].insertId), ...input };
}
async function listReviewsForHotel(hotelId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.hotelId, hotelId)).orderBy(desc(reviews.createdAt));
}
async function blockDates(input) {
  const db = await getDb();
  if (!db) return { id: 0, ...input };
  const result = await db.insert(blockedDates).values(input);
  return { id: Number(result[0].insertId), ...input };
}
async function listBlockedDates(hotelId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blockedDates).where(eq(blockedDates.hotelId, hotelId)).orderBy(desc(blockedDates.startDate));
}
async function listBookingsForHotel(hotelId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(eq(bookings.hotelId, hotelId)).orderBy(desc(bookings.createdAt));
}
async function listConflictBookingsForHotel(hotelId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(
    and(
      eq(bookings.hotelId, hotelId),
      eq(bookings.bookingStatus, "conflict_flagged")
    )
  ).orderBy(desc(bookings.createdAt));
}
async function updateBookingStatusForHotel(input) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(bookings).set({
    bookingStatus: input.bookingStatus,
    conflictDetails: input.conflictDetails ?? null
  }).where(and(eq(bookings.id, input.id), eq(bookings.hotelId, input.hotelId)));
  return result[0].affectedRows > 0;
}
async function createRoomForHotel(input) {
  const db = await getDb();
  if (!db) return { id: 0, ...input };
  const result = await db.insert(rooms).values(input);
  return { id: Number(result[0].insertId), ...input };
}
async function updateRoomForHotel(input) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(rooms).set(input.values).where(and(eq(rooms.id, input.id), eq(rooms.hotelId, input.hotelId)));
  return result[0].affectedRows > 0;
}
async function deleteBlockedDateForHotel(id, hotelId) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(blockedDates).where(and(eq(blockedDates.id, id), eq(blockedDates.hotelId, hotelId)));
  return result[0].affectedRows > 0;
}
async function refundBookingForAdmin(id) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(bookings).set({
    paymentStatus: "refunded",
    bookingStatus: "cancelled",
    conflictDetails: "Refunded by StayNest platform operations."
  }).where(eq(bookings.id, id));
  return result[0].affectedRows > 0;
}
async function getBookingForUser(id, userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(bookings).where(and(eq(bookings.id, id), eq(bookings.userId, userId))).limit(1);
  return result[0];
}
async function recordBookingFinance(input) {
  const db = await getDb();
  if (!db) return { ledgerId: 0, payoutId: 0 };
  const ledger = await db.insert((await Promise.resolve().then(() => (init_schema(), schema_exports))).commissionLedger).values({
    bookingId: input.bookingId,
    hotelId: input.hotelId,
    currency: input.currency,
    grossAmount: input.grossAmount.toFixed(2),
    commissionRate: input.commissionRate.toFixed(4),
    commissionAmount: input.commissionAmount.toFixed(2),
    hotelPayoutAmount: input.hotelPayoutAmount.toFixed(2),
    status: "pending"
  });
  const payout = await db.insert((await Promise.resolve().then(() => (init_schema(), schema_exports))).payouts).values({
    hotelId: input.hotelId,
    currency: input.currency,
    amount: input.hotelPayoutAmount.toFixed(2),
    status: "pending"
  });
  return {
    ledgerId: Number(ledger[0].insertId),
    payoutId: Number(payout[0].insertId)
  };
}
async function listPayouts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from((await Promise.resolve().then(() => (init_schema(), schema_exports))).payouts).orderBy(desc((await Promise.resolve().then(() => (init_schema(), schema_exports))).payouts.createdAt));
}
function buildOnboardingPersistencePayload(input) {
  return {
    user: {
      name: input.fullName,
      email: input.email,
      role: input.role === "partner" ? "hotel_owner" : "user"
    },
    profile: {
      userId: input.userId,
      role: input.role,
      fullName: input.fullName,
      email: input.email,
      businessName: input.businessName ?? null
    }
  };
}
async function saveOnboardingProfile(input, injectedStore) {
  const verificationToken = nanoid(40);
  const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
  let store = injectedStore;
  if (!store) {
    const db = await getDb();
    if (!db)
      return {
        id: 0,
        ...input,
        emailVerificationStatus: "pending",
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: verificationExpiresAt
      };
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
      }
    };
  }
  const payload = buildOnboardingPersistencePayload(input);
  const profilePayload = {
    ...payload.profile,
    emailVerificationStatus: "pending",
    emailVerificationToken: verificationToken,
    emailVerificationExpiresAt: verificationExpiresAt
  };
  await store.updateUser(input.userId, payload.user);
  await store.upsertProfile(profilePayload);
  return await store.getProfile(input.userId) ?? { id: 0, ...profilePayload };
}
async function getOnboardingProfileForUser(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(onboardingProfiles).where(eq(onboardingProfiles.userId, userId)).limit(1);
  return result[0];
}
async function resendOnboardingVerification(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const token = nanoid(40);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
  const result = await db.update(onboardingProfiles).set({
    emailVerificationStatus: "pending",
    emailVerificationToken: token,
    emailVerificationExpiresAt: expiresAt,
    emailVerifiedAt: null
  }).where(eq(onboardingProfiles.userId, userId));
  if (!result[0].affectedRows) return void 0;
  return {
    profile: await getOnboardingProfileForUser(userId),
    verificationToken: token
  };
}
async function verifyOnboardingEmail(token) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(onboardingProfiles).set({
    emailVerificationStatus: "verified",
    emailVerificationToken: null,
    emailVerificationExpiresAt: null,
    emailVerifiedAt: /* @__PURE__ */ new Date()
  }).where(
    and(
      eq(onboardingProfiles.emailVerificationToken, token),
      gt(onboardingProfiles.emailVerificationExpiresAt, /* @__PURE__ */ new Date())
    )
  );
  return result[0].affectedRows > 0;
}
async function notifyAdminsOfPartnerApplication(input) {
  const db = await getDb();
  if (!db) return 0;
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  const dedupeKey = `partner-application-${input.userId}`;
  const message = `${input.applicantName} (${input.email}) submitted ${input.businessName ? `${input.businessName} for` : "a"} partner onboarding. Review the application before publishing a property.`;
  for (const admin of admins) {
    await db.insert(notifications).values({
      userId: admin.id,
      type: "partner_application",
      title: "New hotel-partner application",
      message,
      dedupeKey: `${dedupeKey}-${admin.id}`
    }).onDuplicateKeyUpdate({
      set: { title: "New hotel-partner application", message, readAt: null }
    });
  }
  return admins.length;
}
async function listNotificationsForUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}
async function markNotificationRead(id, userId) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(notifications).set({ readAt: /* @__PURE__ */ new Date() }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  return result[0].affectedRows > 0;
}
async function savePayoutAccount(input) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getPayoutAccountForHotel(input.hotelId);
  if (existing) {
    await db.update(partnerPayoutAccounts).set({
      payoutMethod: input.payoutMethod,
      accountName: input.accountName,
      accountNumber: input.accountNumber,
      bankName: input.bankName ?? null,
      networkProvider: input.networkProvider ?? null
    }).where(eq(partnerPayoutAccounts.id, existing.id));
  } else {
    await db.insert(partnerPayoutAccounts).values(input);
  }
  return getPayoutAccountForHotel(input.hotelId);
}
async function getPayoutAccountForHotel(hotelId) {
  const db = await getDb();
  if (!db) return null;
  const res = await db.select().from(partnerPayoutAccounts).where(eq(partnerPayoutAccounts.hotelId, hotelId)).limit(1);
  return res[0] ?? null;
}
async function getUserPreferences(userId) {
  const db = await getDb();
  if (!db) return null;
  const res = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return res[0] ?? null;
}
async function saveUserPreferences(input) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(userPreferences).values({
    userId: input.userId,
    phone: input.phone ?? null,
    smsRemindersEnabled: input.smsRemindersEnabled ?? 1,
    emailRemindersEnabled: input.emailRemindersEnabled ?? 1
  }).onDuplicateKeyUpdate({
    set: {
      phone: input.phone ?? null,
      smsRemindersEnabled: input.smsRemindersEnabled ?? 1,
      emailRemindersEnabled: input.emailRemindersEnabled ?? 1
    }
  });
  return getUserPreferences(input.userId);
}
async function updateUserAvatar(userId, avatarUrl) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(users).set({ avatarUrl }).where(eq(users.id, userId));
  return result[0].affectedRows > 0;
}
async function setPasswordResetToken(email, token, expires) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(users).set({ passwordResetToken: token, passwordResetExpires: expires }).where(eq(users.email, email));
  return result[0].affectedRows > 0;
}
async function getUserByResetToken(token) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.passwordResetToken, token)).limit(1);
  return result[0];
}
async function updateUserPassword(userId, passwordHash) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(users).set({ passwordHash, passwordResetToken: null, passwordResetExpires: null }).where(eq(users.id, userId));
  return result[0].affectedRows > 0;
}
async function addMessage(input) {
  const db = await getDb();
  if (!db) return { id: 0, ...input, createdAt: /* @__PURE__ */ new Date() };
  const result = await db.insert(messages).values(input);
  return { id: Number(result[0].insertId), ...input, createdAt: /* @__PURE__ */ new Date() };
}
async function listMessagesForBooking(bookingId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.bookingId, bookingId)).orderBy(messages.createdAt);
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString2 = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString2(openId) || !isNonEmptyString2(appId) || !isNonEmptyString2(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      if (sessionUserId.startsWith("local_")) {
        throw ForbiddenError("Local user not found");
      }
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/staynest.ts
import { customAlphabet, nanoid as nanoid2 } from "nanoid";
import { SignJWT as SignJWT2, jwtVerify as jwtVerify2 } from "jose";
var STAYNEST_COMMISSION_RATE = 0.15;
var image = {
  city: "/manus-storage/accra-city-hotel_5a17ca62.jpg",
  room: "/manus-storage/boutique-room_db8a7e7f.jpg",
  coast: "/manus-storage/coastal-resort_4b029dc9.jpg"
};
var demoHotels = [
  {
    id: 1,
    name: "The Gold Coast House",
    slug: "the-gold-coast-house",
    location: "Labone, Accra",
    address: "14 Wawa Street, Labone, Accra, Ghana",
    description: "A quiet, design-led stay in the heart of Accra. The Gold Coast House pairs warm Ghanaian craft with crisp contemporary interiors, a shaded courtyard, and thoughtful service.",
    images: [image.city, image.room, image.coast],
    amenities: ["Breakfast included", "Pool", "Airport transfer", "Fast Wi-Fi", "24-hour reception", "On-site dining"],
    rating: null,
    reviewCount: 0,
    isBillflowConnected: true,
    approvalStatus: "approved",
    lat: 5.5672,
    lng: -0.1821,
    rooms: [
      {
        id: 101,
        hotelId: 1,
        name: "Garden King",
        roomType: "Garden King",
        description: "A calm king room opening toward the courtyard garden, with a walk-in rain shower and generous work desk.",
        capacity: 2,
        priceGhs: 2850,
        priceUsd: 185,
        totalRooms: 6,
        amenities: ["King bed", "Courtyard view", "Rain shower", "Workspace"],
        images: [image.room],
        availableRooms: 4,
        liveSource: "billflow"
      },
      {
        id: 102,
        hotelId: 1,
        name: "Terrace Suite",
        roomType: "Terrace Suite",
        description: "A spacious suite with a separate sitting area, private terrace, and evening turn-down service.",
        capacity: 3,
        priceGhs: 4125,
        priceUsd: 268,
        totalRooms: 3,
        amenities: ["King bed", "Private terrace", "Sitting room", "Butler pantry"],
        images: [image.city],
        availableRooms: 2,
        liveSource: "billflow"
      }
    ]
  },
  {
    id: 2,
    name: "Cantonments House",
    slug: "cantonments-house",
    location: "Cantonments, Accra",
    address: "6 Fourth Circular Road, Cantonments, Accra, Ghana",
    description: "A residential-feeling boutique hotel near Accra's diplomatic quarter, with leafy terraces, intimate common spaces, and a slower rhythm.",
    images: [image.room, image.city, image.coast],
    amenities: ["Breakfast included", "Garden terrace", "Concierge", "Fast Wi-Fi", "Fitness studio", "Meeting room"],
    rating: null,
    reviewCount: 0,
    isBillflowConnected: false,
    approvalStatus: "approved",
    lat: 5.5834,
    lng: -0.1763,
    rooms: [
      {
        id: 201,
        hotelId: 2,
        name: "Courtyard Double",
        roomType: "Courtyard Double",
        description: "A bright double room with a private patio looking into the hotel's garden courtyard.",
        capacity: 2,
        priceGhs: 1980,
        priceUsd: 129,
        totalRooms: 8,
        amenities: ["Queen bed", "Private patio", "Rain shower", "Breakfast"],
        images: [image.room],
        availableRooms: 5,
        liveSource: "staynest"
      },
      {
        id: 202,
        hotelId: 2,
        name: "Cantonments Loft",
        roomType: "Cantonments Loft",
        description: "A high-ceilinged loft with a lounge corner and wide windows overlooking the treetops.",
        capacity: 3,
        priceGhs: 3150,
        priceUsd: 205,
        totalRooms: 4,
        amenities: ["King bed", "Lounge corner", "Treetop view", "Breakfast"],
        images: [image.city],
        availableRooms: 3,
        liveSource: "staynest"
      }
    ]
  },
  {
    id: 3,
    name: "Ada Palm Retreat",
    slug: "ada-palm-retreat",
    location: "Ada Foah, Greater Accra",
    address: "Palm Shore Road, Ada Foah, Ghana",
    description: "An unhurried coastal retreat where palm-fringed water, breezy rooms, and warm hospitality make space for a proper reset.",
    images: [image.coast, image.city, image.room],
    amenities: ["Beach access", "Infinity pool", "Breakfast included", "Boat trips", "Outdoor dining", "Spa treatments"],
    rating: null,
    reviewCount: 0,
    isBillflowConnected: true,
    approvalStatus: "approved",
    lat: 5.7878,
    lng: 0.6337,
    rooms: [
      {
        id: 301,
        hotelId: 3,
        name: "Palm Bungalow",
        roomType: "Palm Bungalow",
        description: "A private bungalow tucked under palms, with a shaded deck and a few steps to the lagoon.",
        capacity: 2,
        priceGhs: 3420,
        priceUsd: 222,
        totalRooms: 7,
        amenities: ["King bed", "Outdoor deck", "Lagoon access", "Breakfast"],
        images: [image.coast],
        availableRooms: 2,
        liveSource: "billflow"
      },
      {
        id: 302,
        hotelId: 3,
        name: "Lagoon Villa",
        roomType: "Lagoon Villa",
        description: "A generous villa for longer stays, with a private plunge pool and uninterrupted lagoon views.",
        capacity: 4,
        priceGhs: 5850,
        priceUsd: 380,
        totalRooms: 2,
        amenities: ["Two bedrooms", "Private plunge pool", "Lagoon view", "Living room"],
        images: [image.coast],
        availableRooms: 1,
        liveSource: "billflow"
      }
    ]
  }
];
function calculateCommission(total) {
  const commission = Number((total * STAYNEST_COMMISSION_RATE).toFixed(2));
  return { commission, hotelPayout: Number((total - commission).toFixed(2)) };
}
var bookingReferenceToken = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);
function makeBookingReference() {
  return `SN-${(/* @__PURE__ */ new Date()).getFullYear()}-${bookingReferenceToken()}`;
}
function billflowConfigured() {
  return Boolean(process.env.BILLFLOW_API_BASE_URL && process.env.BILLFLOW_API_KEY);
}
async function billflowRequest(path, init) {
  const baseUrl = process.env.BILLFLOW_API_BASE_URL;
  const apiKey = process.env.BILLFLOW_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("BillFlow integration is not configured yet");
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...init?.headers ?? {}
    }
  });
  if (!response.ok) throw new Error(`BillFlow request failed with ${response.status}`);
  return response.json();
}
async function getLiveAvailability(params) {
  if (!billflowConfigured()) return { source: "demo", availableRooms: null, livePricing: null };
  return billflowRequest("/api/staynest/availability", {
    method: "POST",
    body: JSON.stringify(params)
  });
}
async function createBillFlowReservation(payload) {
  if (!billflowConfigured()) return { source: "demo", reservationId: `demo-${nanoid2(10)}`, conflict: false };
  return billflowRequest("/api/staynest/reservations", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
async function initializePayment(input) {
  if (input.gateway === "paystack") {
    const secret2 = process.env.PAYSTACK_SECRET_KEY;
    if (!secret2) return { configured: false, checkoutUrl: null };
    const response2 = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret2}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: input.email, amount: Math.round(input.amount * 100), currency: input.currency, reference: input.reference, callback_url: input.callbackUrl, metadata: JSON.stringify(input.metadata) })
    });
    const body2 = await response2.json();
    if (!response2.ok || !body2.status) throw new Error("Paystack could not initialize this payment");
    return { configured: true, checkoutUrl: body2.data?.authorization_url ?? null };
  }
  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secret) return { configured: false, checkoutUrl: null };
  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ tx_ref: input.reference, amount: input.amount, currency: input.currency, redirect_url: input.callbackUrl, customer: { email: input.email }, meta: input.metadata })
  });
  const body = await response.json();
  if (!response.ok || body.status !== "success") throw new Error("Flutterwave could not initialize this payment");
  return { configured: true, checkoutUrl: body.data?.link ?? null };
}
function paymentTokenKey() {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? "staynest-development-secret");
}
async function issuePaymentVerificationToken(input) {
  return new SignJWT2({ gateway: input.gateway, reference: input.reference, amount: input.expectedAmount, currency: input.currency, verified: true }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("10m").sign(paymentTokenKey());
}
async function verifyPaymentToken(token, expected) {
  try {
    const { payload } = await jwtVerify2(token, paymentTokenKey());
    return Boolean(payload.verified === true && payload.gateway === expected.gateway && payload.reference === expected.reference && payload.currency === expected.currency && Number(payload.amount) === expected.expectedAmount);
  } catch {
    return false;
  }
}
async function verifyPayment(input) {
  if (input.gateway === "paystack") {
    const secret2 = process.env.PAYSTACK_SECRET_KEY;
    if (!secret2) return { configured: false, verified: false };
    const response2 = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(input.reference)}`, { headers: { Authorization: `Bearer ${secret2}` } });
    const body2 = await response2.json();
    const data2 = body2.data;
    const verified2 = Boolean(response2.ok && body2.status && data2?.status === "success" && data2.reference === input.reference && data2.currency === input.currency && Number(data2.amount) === Math.round(input.expectedAmount * 100));
    return { configured: true, verified: verified2, verificationToken: verified2 ? await issuePaymentVerificationToken(input) : null };
  }
  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secret || !input.transactionId) return { configured: false, verified: false };
  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(input.transactionId)}/verify`, { headers: { Authorization: `Bearer ${secret}` } });
  const body = await response.json();
  const data = body.data;
  const verified = Boolean(response.ok && body.status === "success" && data?.status === "successful" && data.tx_ref === input.reference && data.currency === input.currency && Number(data.amount) === input.expectedAmount);
  return { configured: true, verified, verificationToken: verified ? await issuePaymentVerificationToken(input) : null };
}
function escapeHtml(value) {
  return value.replace(/[&<>'\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}
function buildWelcomeVerificationUrl(token, baseUrl = process.env.APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")) {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/$/, "");
  return normalizedBaseUrl ? `${normalizedBaseUrl}/verify-email?token=${encodeURIComponent(token)}` : null;
}
async function sendWelcomeEmail(input) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { configured: false, sent: false };
  const verifyUrl = buildWelcomeVerificationUrl(input.verificationToken);
  if (!verifyUrl) return { configured: false, sent: false };
  const greeting = input.role === "partner" ? "Your partner workspace is ready to begin." : "Your next considered stay is closer than ever.";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "StayNest <hello@staynest.example>",
      to: [input.to],
      subject: "Welcome to StayNest \xB7 Verify your email",
      html: `<div style="font-family:Arial,sans-serif;color:#183a31;line-height:1.6;max-width:560px"><p style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#b18143;font-weight:700">Welcome to StayNest</p><h1 style="font-family:Georgia,serif;font-size:34px;line-height:1.05">Make room for a better arrival.</h1><p>Hi ${escapeHtml(input.fullName)}, ${greeting}</p><p>Please verify your email to keep your account secure and receive important booking and partner updates.</p><p><a href="${verifyUrl}" style="display:inline-block;background:#183a31;color:#fff;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:700">Verify email</a></p><p style="font-size:12px;color:#718078">This link expires in 24 hours. If you did not create a StayNest account, you can ignore this message.</p></div>`
    })
  });
  return { configured: true, sent: response.ok };
}
async function sendBookingEmail(input) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { configured: false, sent: false };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "StayNest <bookings@staynest.example>",
      to: [input.to],
      subject: `StayNest booking confirmed \xB7 ${input.bookingReference}`,
      html: `<div style="font-family:Arial,sans-serif;color:#183a31;line-height:1.6"><h1 style="font-family:Georgia,serif">Your stay is confirmed.</h1><p>Hi ${input.guestName}, your reservation at <strong>${input.hotelName}</strong> is confirmed.</p><p><strong>${input.roomName}</strong><br>${input.checkInDate} \u2192 ${input.checkOutDate}<br>Total: ${input.currency} ${input.total.toFixed(2)}</p><p>Your booking reference is <strong>${input.bookingReference}</strong>.</p></div>`
    })
  });
  return { configured: true, sent: response.ok };
}
async function cancelBillFlowReservation(payload) {
  if (!billflowConfigured()) return { source: "demo", cancelled: true };
  return billflowRequest("/api/staynest/reservations/cancel", { method: "POST", body: JSON.stringify(payload) });
}

// server/routers.ts
var dateInput = z2.string().min(10).max(32);
var currencyInput = z2.enum(["GHS", "USD"]);
var gatewayInput = z2.enum(["paystack", "flutterwave"]);
var onboardingProfileInput = z2.object({
  role: z2.enum(["guest", "partner"]),
  fullName: z2.string().trim().min(2).max(255),
  email: z2.string().trim().email().max(320),
  businessName: z2.string().trim().max(255).optional()
}).superRefine((value, ctx) => {
  if (value.role === "partner" && !value.businessName) {
    ctx.addIssue({
      code: "custom",
      path: ["businessName"],
      message: "Hotel or business name is required for partners."
    });
  }
});
var catalogInput = z2.object({
  location: z2.string().optional(),
  checkInDate: dateInput.optional(),
  checkOutDate: dateInput.optional(),
  guestsCount: z2.number().int().min(1).max(12).default(2),
  minPrice: z2.number().min(0).optional(),
  maxPrice: z2.number().min(0).optional(),
  minRating: z2.number().min(0).max(5).optional(),
  currency: currencyInput.default("GHS")
});
function normalizeJson(value) {
  if (Array.isArray(value)) return value.map(String);
  return [];
}
function defaultStayDates() {
  const checkIn = /* @__PURE__ */ new Date();
  checkIn.setDate(checkIn.getDate() + 14);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 3);
  return {
    checkInDate: checkIn.toISOString().slice(0, 10),
    checkOutDate: checkOut.toISOString().slice(0, 10)
  };
}
function demoSearch(input) {
  const location = input.location?.trim().toLowerCase();
  return demoHotels.filter(
    (hotel) => !location || `${hotel.name} ${hotel.location}`.toLowerCase().includes(location)
  ).map((hotel) => ({
    ...hotel,
    rooms: hotel.rooms.filter((room) => {
      const amount = input.currency === "GHS" ? room.priceGhs : room.priceUsd;
      return room.capacity >= input.guestsCount && (input.minPrice === void 0 || amount >= input.minPrice) && (input.maxPrice === void 0 || amount <= input.maxPrice);
    })
  })).filter(
    (hotel) => hotel.rooms.length > 0 && (input.minRating === void 0 || (hotel.rating ?? 0) >= input.minRating)
  );
}
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
    localLogin: publicProcedure.input(
      z2.object({
        email: z2.string().trim().toLowerCase().email(),
        password: z2.string().min(1)
      })
    ).mutation(async ({ ctx, input }) => {
      const user = await getUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        throw new TRPCError3({
          code: "UNAUTHORIZED",
          message: "Invalid email or password."
        });
      }
      const bcrypt = await import("bcryptjs");
      const crypto2 = await import("crypto");
      let valid = false;
      if (user.passwordHash.startsWith("$2b$") || user.passwordHash.startsWith("$2a$")) {
        valid = await bcrypt.compare(input.password, user.passwordHash);
      } else {
        const legacyHash = crypto2.createHash("sha256").update(input.password).digest("hex");
        valid = legacyHash === user.passwordHash;
        if (valid) {
          const newHash = await bcrypt.hash(input.password, 10);
          await createOrUpdateLocalUser({
            email: user.email,
            name: user.name || "User",
            passwordHash: newHash
          });
        }
      }
      if (!valid) {
        throw new TRPCError3({
          code: "UNAUTHORIZED",
          message: "Invalid email or password."
        });
      }
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, {
        path: "/",
        secure: true,
        sameSite: "none"
      });
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS
      });
      return { success: true, user };
    }),
    localRegister: publicProcedure.input(
      z2.object({
        email: z2.string().trim().toLowerCase().email(),
        password: z2.string().min(6),
        name: z2.string().trim().min(2),
        role: z2.enum(["user", "hotel_owner"]).default("user")
      })
    ).mutation(async ({ ctx, input }) => {
      const existing = await getUserByEmail(input.email);
      if (existing && existing.passwordHash) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: "An account with this email already exists."
        });
      }
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash(input.password, 10);
      const user = await createOrUpdateLocalUser({
        email: input.email,
        name: input.name,
        passwordHash,
        role: input.email === "wisdomasaare41@gmail.com" ? "admin" : input.role
      });
      if (!user) {
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create account."
        });
      }
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, {
        path: "/",
        secure: true,
        sameSite: "none"
      });
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS
      });
      return { success: true, user };
    }),
    requestPasswordReset: publicProcedure.input(z2.object({ email: z2.string().trim().toLowerCase().email() })).mutation(async ({ input }) => {
      const user = await getUserByEmail(input.email);
      if (!user) {
        return {
          success: true,
          message: "If an account exists with this email, a reset link has been sent."
        };
      }
      const token = nanoid3(32);
      const expires = new Date(Date.now() + 3600 * 1e3);
      await setPasswordResetToken(input.email, token, expires);
      console.log(
        `[Password Reset] Link for ${input.email}: /reset-password?token=${token}`
      );
      return {
        success: true,
        message: "Password reset link generated and sent.",
        debugToken: token
      };
    }),
    resetPassword: publicProcedure.input(
      z2.object({ token: z2.string().min(10), newPassword: z2.string().min(6) })
    ).mutation(async ({ input }) => {
      const user = await getUserByResetToken(input.token);
      if (!user || !user.passwordResetExpires || /* @__PURE__ */ new Date() > user.passwordResetExpires) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: "Invalid or expired password reset token."
        });
      }
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash(input.newPassword, 10);
      await updateUserPassword(user.id, passwordHash);
      return {
        success: true,
        message: "Password successfully updated. You can now sign in."
      };
    }),
    uploadAvatar: protectedProcedure.input(z2.object({ base64Data: z2.string() })).mutation(async ({ ctx, input }) => {
      try {
        const matches = input.base64Data.match(
          /^data:(image\/[a-zA-Z+-]+);base64,(.+)$/
        );
        if (!matches)
          throw new TRPCError3({
            code: "BAD_REQUEST",
            message: "Invalid image data format."
          });
        const mimeType = matches[1].toLowerCase();
        const buffer = Buffer.from(matches[2], "base64");
        if (buffer.length > 5 * 1024 * 1024)
          throw new TRPCError3({
            code: "BAD_REQUEST",
            message: "Avatar exceeds 5MB limit."
          });
        const ext = mimeType.split("/")[1] || "jpg";
        const key = `avatars/${ctx.user.id}-${Date.now()}.${ext}`;
        const stored = await storagePut(key, buffer, mimeType);
        await updateUserAvatar(ctx.user.id, stored.url);
        return { success: true, url: stored.url };
      } catch (err) {
        if (err instanceof TRPCError3) throw err;
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not upload avatar."
        });
      }
    }),
    onboardingProfile: protectedProcedure.query(
      ({ ctx }) => getOnboardingProfileForUser(ctx.user.id)
    ),
    resendVerification: protectedProcedure.mutation(async ({ ctx }) => {
      const result = await resendOnboardingVerification(ctx.user.id);
      if (!result)
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "No onboarding profile found."
        });
      const profile = result.profile;
      const email = profile?.email ?? ctx.user.email ?? "";
      const fullName = profile?.fullName ?? ctx.user.name ?? "Guest";
      const role = profile?.role ?? "guest";
      const welcomeEmail = email ? await sendWelcomeEmail({
        to: email,
        fullName,
        role,
        verificationToken: result.verificationToken
      }) : { configured: false, sent: false };
      return { success: true, welcomeEmail };
    }),
    saveOnboarding: protectedProcedure.input(onboardingProfileInput).mutation(async ({ ctx, input }) => {
      const profile = await saveOnboardingProfile({
        userId: ctx.user.id,
        ...input
      });
      const profileRecord = profile;
      const verificationToken = typeof profileRecord.emailVerificationToken === "string" ? profileRecord.emailVerificationToken : "";
      const welcomeEmail = verificationToken ? await sendWelcomeEmail({
        to: input.email,
        fullName: input.fullName,
        role: input.role,
        verificationToken
      }) : { configured: false, sent: false };
      const adminAlerts = input.role === "partner" ? await notifyAdminsOfPartnerApplication({
        userId: ctx.user.id,
        applicantName: input.fullName,
        email: input.email,
        businessName: input.businessName
      }) : 0;
      return { profile, welcomeEmail, adminAlerts };
    }),
    verifyEmail: publicProcedure.input(z2.object({ token: z2.string().min(20).max(128) })).mutation(({ input }) => verifyOnboardingEmail(input.token)),
    getPreferences: protectedProcedure.query(
      ({ ctx }) => getUserPreferences(ctx.user.id)
    ),
    savePreferences: protectedProcedure.input(
      z2.object({
        phone: z2.string().max(32).optional(),
        smsRemindersEnabled: z2.number().int().min(0).max(1).optional(),
        emailRemindersEnabled: z2.number().int().min(0).max(1).optional()
      })
    ).mutation(
      ({ ctx, input }) => saveUserPreferences({ userId: ctx.user.id, ...input })
    )
  }),
  notifications: router({
    mine: protectedProcedure.query(
      ({ ctx }) => listNotificationsForUser(ctx.user.id)
    ),
    markRead: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(
      ({ ctx, input }) => markNotificationRead(input.id, ctx.user.id)
    )
  }),
  catalog: router({
    search: publicProcedure.input(catalogInput).query(async ({ input }) => {
      const dbHotels = await listApprovedHotels();
      if (!dbHotels.length) return demoSearch(input);
      const result = [];
      for (const hotel of dbHotels) {
        const hotelRooms = await listRoomsForHotel(hotel.id);
        const stayDates = {
          ...defaultStayDates(),
          checkInDate: input.checkInDate ?? defaultStayDates().checkInDate,
          checkOutDate: input.checkOutDate ?? defaultStayDates().checkOutDate
        };
        const manualAvailability = hotel.isBillflowConnected ? /* @__PURE__ */ new Map() : new Map(
          (await listRoomAvailabilityForHotel({
            hotelId: hotel.id,
            ...stayDates
          })).map((room) => [room.id, room])
        );
        const roomsForGuests = hotelRooms.filter((room) => {
          const amount = input.currency === "GHS" ? Number(room.priceGhs) : Number(room.priceUsd);
          return Number(room.capacity) >= input.guestsCount && (input.minPrice === void 0 || amount >= input.minPrice) && (input.maxPrice === void 0 || amount <= input.maxPrice);
        }).map((room) => ({
          id: room.id,
          hotelId: room.hotelId,
          name: room.name,
          roomType: room.roomType,
          description: room.description ?? "",
          capacity: room.capacity,
          priceGhs: Number(room.priceGhs),
          priceUsd: Number(room.priceUsd),
          totalRooms: room.totalRooms,
          availableRooms: manualAvailability.get(room.id)?.availableRooms ?? room.totalRooms,
          amenities: normalizeJson(room.amenities),
          images: normalizeJson(room.images),
          liveSource: hotel.isBillflowConnected ? "billflow" : "staynest"
        }));
        if (!roomsForGuests.length) continue;
        if (input.location && !`${hotel.name} ${hotel.location}`.toLowerCase().includes(input.location.toLowerCase()))
          continue;
        if (input.minRating !== void 0 && Number(hotel.rating ?? 0) < input.minRating)
          continue;
        result.push({
          id: hotel.id,
          name: hotel.name,
          slug: hotel.slug,
          location: hotel.location,
          address: hotel.address ?? "",
          description: hotel.description ?? "",
          images: normalizeJson(hotel.images),
          amenities: normalizeJson(hotel.amenities),
          rating: hotel.rating ? Number(hotel.rating) : null,
          reviewCount: hotel.reviewCount ?? 0,
          isBillflowConnected: Boolean(hotel.isBillflowConnected),
          approvalStatus: hotel.approvalStatus,
          lat: hotel.lat ? Number(hotel.lat) : 5.6037,
          lng: hotel.lng ? Number(hotel.lng) : -0.187,
          rooms: roomsForGuests
        });
      }
      return result;
    }),
    getHotel: publicProcedure.input(z2.object({ id: z2.number().int().positive() })).query(async ({ input }) => {
      const hotel = await getHotelById(input.id);
      const demo = demoHotels.find((item) => item.id === input.id);
      if (!hotel && demo) return demo;
      if (!hotel)
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Hotel not found"
        });
      const hotelRooms = await listRoomsForHotel(hotel.id);
      const stayDates = defaultStayDates();
      const manualAvailability = hotel.isBillflowConnected ? /* @__PURE__ */ new Map() : new Map(
        (await listRoomAvailabilityForHotel({
          hotelId: hotel.id,
          ...stayDates
        })).map((room) => [room.id, room])
      );
      return {
        id: hotel.id,
        name: hotel.name,
        slug: hotel.slug,
        location: hotel.location,
        address: hotel.address ?? "",
        description: hotel.description ?? "",
        images: normalizeJson(hotel.images),
        amenities: normalizeJson(hotel.amenities),
        rating: hotel.rating ? Number(hotel.rating) : null,
        reviewCount: hotel.reviewCount ?? 0,
        isBillflowConnected: Boolean(hotel.isBillflowConnected),
        approvalStatus: hotel.approvalStatus,
        lat: hotel.lat ? Number(hotel.lat) : 5.6037,
        lng: hotel.lng ? Number(hotel.lng) : -0.187,
        rooms: hotelRooms.map((room) => ({
          id: room.id,
          hotelId: room.hotelId,
          name: room.name,
          roomType: room.roomType,
          description: room.description ?? "",
          capacity: room.capacity,
          priceGhs: Number(room.priceGhs),
          priceUsd: Number(room.priceUsd),
          totalRooms: room.totalRooms,
          availableRooms: manualAvailability.get(room.id)?.availableRooms ?? room.totalRooms,
          amenities: normalizeJson(room.amenities),
          images: normalizeJson(room.images),
          liveSource: Boolean(hotel.isBillflowConnected) ? "billflow" : "staynest"
        }))
      };
    }),
    liveAvailability: publicProcedure.input(
      z2.object({
        hotelId: z2.number().int().positive(),
        roomTypeId: z2.number().int().positive(),
        checkInDate: dateInput,
        checkOutDate: dateInput
      })
    ).query(async ({ input }) => {
      const dbHotel = await getHotelById(input.hotelId);
      const demoHotel = demoHotels.find((item) => item.id === input.hotelId);
      const hotel = dbHotel ?? demoHotel;
      const demoRoom = demoHotel?.rooms.find(
        (item) => item.id === input.roomTypeId
      );
      const dbRoom = dbHotel ? (await listRoomsForHotel(dbHotel.id)).find(
        (item) => item.id === input.roomTypeId
      ) : void 0;
      const room = demoRoom ?? dbRoom;
      const connected = Boolean(
        hotel && ("isBillflowConnected" in hotel ? hotel.isBillflowConnected : false)
      );
      const manualAvailability = !connected && dbHotel ? (await listRoomAvailabilityForHotel({
        hotelId: dbHotel.id,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate
      })).find((item) => item.id === input.roomTypeId) : void 0;
      const live = await getLiveAvailability({
        businessId: dbHotel?.isBillflowConnected ? dbHotel.billflowBusinessId ?? `demo-business-${input.hotelId}` : demoHotel?.isBillflowConnected ? `demo-business-${input.hotelId}` : void 0,
        propertyId: dbHotel?.isBillflowConnected ? dbHotel.billflowPropertyId ?? `demo-property-${input.hotelId}` : demoHotel?.isBillflowConnected ? `demo-property-${input.hotelId}` : void 0,
        roomTypeId: String(input.roomTypeId),
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate
      });
      return {
        availableRooms: live.availableRooms ?? demoRoom?.availableRooms ?? manualAvailability?.availableRooms ?? dbRoom?.totalRooms ?? 0,
        livePricing: live.livePricing ?? (demoRoom ? { ghs: demoRoom.priceGhs, usd: demoRoom.priceUsd } : dbRoom ? { ghs: Number(dbRoom.priceGhs), usd: Number(dbRoom.priceUsd) } : null),
        source: live.source === "billflow" ? "billflow" : demoRoom?.liveSource ?? (connected ? "billflow" : "staynest"),
        checkedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }),
    reviews: publicProcedure.input(z2.object({ hotelId: z2.number().int().positive() })).query(({ input }) => listReviewsForHotel(input.hotelId))
  }),
  payments: router({
    initialize: protectedProcedure.input(
      z2.object({
        email: z2.string().email(),
        amount: z2.number().positive(),
        currency: currencyInput,
        gateway: gatewayInput,
        hotelId: z2.number().int().positive(),
        roomId: z2.number().int().positive(),
        checkInDate: dateInput,
        checkOutDate: dateInput,
        guestsCount: z2.number().int().min(1).max(12)
      })
    ).mutation(async ({ ctx, input }) => {
      const reference = makeBookingReference();
      const result = await initializePayment({
        ...input,
        reference,
        callbackUrl: `${process.env.APP_URL ?? ""}/booking/complete?reference=${reference}`,
        metadata: {
          hotelId: input.hotelId,
          roomId: input.roomId,
          userId: ctx.user.id
        }
      });
      return {
        ...result,
        reference,
        commissionRate: STAYNEST_COMMISSION_RATE
      };
    }),
    verify: protectedProcedure.input(
      z2.object({
        gateway: gatewayInput,
        reference: z2.string().min(6),
        transactionId: z2.string().optional(),
        expectedAmount: z2.number().positive(),
        currency: currencyInput
      })
    ).mutation(({ input }) => verifyPayment(input))
  }),
  bookings: router({
    createAfterVerifiedPayment: protectedProcedure.input(
      z2.object({
        hotelId: z2.number().int().positive(),
        roomId: z2.number().int().positive(),
        bookingReference: z2.string().min(6),
        paymentReference: z2.string().min(3),
        paymentGateway: gatewayInput,
        paymentStatus: z2.literal("success"),
        verificationToken: z2.string().min(20),
        currency: currencyInput,
        totalAmount: z2.number().positive(),
        checkInDate: dateInput,
        checkOutDate: dateInput,
        guestsCount: z2.number().int().min(1).max(12),
        guestName: z2.string().min(2),
        guestEmail: z2.string().email(),
        guestPhone: z2.string().min(7).max(32),
        specialRequests: z2.string().max(1e3).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const tokenValid = await verifyPaymentToken(input.verificationToken, {
        gateway: input.paymentGateway,
        reference: input.paymentReference,
        expectedAmount: input.totalAmount,
        currency: input.currency
      });
      if (!tokenValid)
        throw new TRPCError3({
          code: "PRECONDITION_FAILED",
          message: "Payment verification expired or did not match the booking total."
        });
      const existingBooking = await getBookingByPaymentReference(input.paymentReference);
      if (existingBooking)
        throw new TRPCError3({
          code: "CONFLICT",
          message: "This payment reference has already been used. The booking was not charged twice."
        });
      const { commission, hotelPayout } = calculateCommission(
        input.totalAmount
      );
      const dbHotel = await getHotelById(input.hotelId);
      const demoHotel = demoHotels.find((item) => item.id === input.hotelId);
      const hotel = dbHotel ?? demoHotel;
      const availableRooms = dbHotel ? await listRoomsForHotel(dbHotel.id) : demoHotel?.rooms ?? [];
      const room = availableRooms.find((item) => item.id === input.roomId);
      if (!hotel || !room)
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Hotel or room not found"
        });
      const connected = dbHotel ? Boolean(dbHotel.isBillflowConnected) : Boolean(demoHotel?.isBillflowConnected);
      const billflowReservation = await createBillFlowReservation({
        businessId: connected ? dbHotel?.billflowBusinessId ?? `demo-business-${hotel.id}` : void 0,
        propertyId: connected ? dbHotel?.billflowPropertyId ?? `demo-property-${hotel.id}` : void 0,
        roomTypeId: room.roomType,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        channel: "staynest",
        paymentReference: input.paymentReference
      });
      const conflict = Boolean(billflowReservation.conflict);
      const booking = await createBooking({
        bookingReference: input.bookingReference,
        userId: ctx.user.id,
        hotelId: input.hotelId,
        roomId: input.roomId,
        roomNumber: "roomNumber" in billflowReservation ? billflowReservation.roomNumber : null,
        billflowReservationId: billflowReservation.reservationId,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        numberOfNights: Math.max(
          1,
          Math.round(
            (new Date(input.checkOutDate).getTime() - new Date(input.checkInDate).getTime()) / 864e5
          )
        ),
        guestsCount: input.guestsCount,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        currency: input.currency,
        totalAmount: input.totalAmount.toFixed(2),
        commissionAmount: commission.toFixed(2),
        hotelPayoutAmount: hotelPayout.toFixed(2),
        paymentGateway: input.paymentGateway,
        paymentReference: input.paymentReference,
        paymentStatus: "success",
        bookingStatus: conflict ? "conflict_flagged" : "booked",
        specialRequests: input.specialRequests,
        conflictDetails: conflict ? "conflictDetails" in billflowReservation ? billflowReservation.conflictDetails ?? "BillFlow reported a booking conflict. Hotel review is required." : "BillFlow reported a booking conflict. Hotel review is required." : null
      });
      await recordBookingFinance({
        bookingId: booking.id,
        hotelId: input.hotelId,
        currency: input.currency,
        grossAmount: input.totalAmount,
        commissionRate: STAYNEST_COMMISSION_RATE,
        commissionAmount: commission,
        hotelPayoutAmount: hotelPayout
      });
      await sendBookingEmail({
        to: input.guestEmail,
        guestName: input.guestName,
        bookingReference: input.bookingReference,
        hotelName: hotel.name,
        roomName: room.name,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        total: input.totalAmount,
        currency: input.currency
      });
      return {
        ...booking,
        conflict,
        conflictDetails: conflict && "conflictDetails" in billflowReservation ? billflowReservation.conflictDetails : null
      };
    }),
    mine: protectedProcedure.query(
      ({ ctx }) => getBookingsForUser(ctx.user.id)
    ),
    cancel: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const booking = await getBookingForUser(input.id, ctx.user.id);
      if (!booking)
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Booking not found."
        });
      if (booking.bookingStatus === "cancelled" || booking.paymentStatus === "refunded")
        return { success: true, source: "already-cancelled" };
      const hotel = await getHotelById(booking.hotelId);
      const external = await cancelBillFlowReservation({
        businessId: hotel?.billflowBusinessId ?? void 0,
        propertyId: hotel?.billflowPropertyId ?? void 0,
        reservationId: booking.billflowReservationId ?? booking.paymentReference ?? booking.bookingReference,
        bookingReference: booking.bookingReference
      });
      if (!external.cancelled)
        throw new TRPCError3({
          code: "PRECONDITION_FAILED",
          message: "The property system did not acknowledge this cancellation. No local cancellation was applied."
        });
      const success = await cancelBookingForUser(input.id, ctx.user.id);
      return { success, source: external.source };
    }),
    uploadReviewPhoto: protectedProcedure.input(
      z2.object({
        base64Data: z2.string().min(10),
        fileName: z2.string().min(1).max(255)
      })
    ).mutation(async ({ ctx, input }) => {
      try {
        const matches = input.base64Data.match(
          /^data:(image\/(jpeg|png|webp|heic|jpg));base64,(.+)$/i
        );
        if (!matches) {
          throw new TRPCError3({
            code: "BAD_REQUEST",
            message: "Only JPEG, PNG, and WebP image formats are supported."
          });
        }
        const mimeType = matches[1].toLowerCase();
        const rawBase64 = matches[3];
        const buffer = Buffer.from(rawBase64, "base64");
        if (buffer.length > 5 * 1024 * 1024) {
          throw new TRPCError3({
            code: "BAD_REQUEST",
            message: "Photo exceeds 5MB limit."
          });
        }
        const ext = mimeType.split("/")[1] || "jpg";
        const key = `reviews/${ctx.user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const stored = await storagePut(key, buffer, mimeType);
        return { success: true, url: stored.url };
      } catch (error) {
        if (error instanceof TRPCError3) throw error;
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not upload review photo."
        });
      }
    }),
    addReview: protectedProcedure.input(
      z2.object({
        hotelId: z2.number().int().positive(),
        bookingId: z2.number().int().positive(),
        rating: z2.number().int().min(1).max(5),
        comment: z2.string().max(1e3).optional(),
        photoUrls: z2.array(z2.string().url()).max(5).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const booking = await getBookingForUser(input.bookingId, ctx.user.id);
      if (!booking || booking.hotelId !== input.hotelId || booking.paymentStatus !== "success") {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Reviews are only available for confirmed and completed stays."
        });
      }
      const existingReviews = await listReviewsForHotel(input.hotelId);
      const alreadyReviewed = existingReviews.some(
        (r) => r.userId === ctx.user.id && r.bookingId === input.bookingId
      );
      if (alreadyReviewed) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: "You have already reviewed this stay."
        });
      }
      const review = await addReview({
        hotelId: input.hotelId,
        bookingId: input.bookingId,
        rating: input.rating,
        comment: input.comment,
        photoUrls: input.photoUrls ?? [],
        userId: ctx.user.id,
        guestName: ctx.user.name ?? "Guest"
      });
      const updatedReviews = [review, ...existingReviews];
      const avgRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
      const db = await getDb();
      if (db) {
        await db.update(hotels).set({
          rating: avgRating.toFixed(2),
          reviewCount: updatedReviews.length
        }).where(eq2(hotels.id, input.hotelId));
      }
      return {
        success: true,
        review,
        newRating: Number(avgRating.toFixed(2)),
        reviewCount: updatedReviews.length
      };
    }),
    listMessages: protectedProcedure.input(z2.object({ bookingId: z2.number().int().positive() })).query(async ({ ctx, input }) => {
      const booking = await getBookingForUser(input.bookingId, ctx.user.id);
      const hotel = booking ? await getHotelById(booking.hotelId) : null;
      const isOwner = hotel && hotel.ownerId === ctx.user.id;
      const isAdmin = ctx.user.role === "admin";
      if (!booking && !isOwner && !isAdmin) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "You do not have access to this conversation."
        });
      }
      return listMessagesForBooking(input.bookingId);
    }),
    sendMessage: protectedProcedure.input(
      z2.object({
        bookingId: z2.number().int().positive(),
        messageText: z2.string().min(1).max(2e3)
      })
    ).mutation(async ({ ctx, input }) => {
      const booking = await getBookingForUser(input.bookingId, ctx.user.id);
      const hotel = booking ? await getHotelById(booking.hotelId) : null;
      const isOwner = hotel && hotel.ownerId === ctx.user.id;
      const isAdmin = ctx.user.role === "admin";
      if (!booking && !isOwner && !isAdmin) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "You do not have access to this conversation."
        });
      }
      const receiverId = ctx.user.id === booking?.userId ? hotel?.ownerId ?? booking.userId : booking?.userId ?? ctx.user.id;
      const message = await addMessage({
        bookingId: input.bookingId,
        senderId: ctx.user.id,
        receiverId,
        messageText: input.messageText
      });
      return { success: true, message };
    })
  }),
  hotel: router({
    mine: protectedProcedure.query(
      ({ ctx }) => listHotelsForOwner(ctx.user.id)
    ),
    create: protectedProcedure.input(
      z2.object({
        name: z2.string().trim().min(2).max(255),
        location: z2.string().trim().min(2).max(255),
        address: z2.string().trim().max(1e3).optional(),
        description: z2.string().trim().max(2e3).optional(),
        images: z2.array(z2.string().url()).max(20).default([]),
        amenities: z2.array(z2.string().trim().max(80)).max(30).default([]),
        lat: z2.number().min(-90).max(90).optional(),
        lng: z2.number().min(-180).max(180).optional()
      })
    ).mutation(
      ({ ctx, input }) => createHotelForOwner({ ownerId: ctx.user.id, ...input })
    ),
    update: protectedProcedure.input(
      z2.object({
        id: z2.number().int().positive(),
        name: z2.string().trim().min(2).max(255).optional(),
        location: z2.string().trim().min(2).max(255).optional(),
        address: z2.string().trim().max(1e3).nullable().optional(),
        description: z2.string().trim().max(2e3).nullable().optional(),
        images: z2.array(z2.string().url()).max(20).optional(),
        amenities: z2.array(z2.string().trim().max(80)).max(30).optional(),
        lat: z2.number().min(-90).max(90).nullable().optional(),
        lng: z2.number().min(-180).max(180).nullable().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const { id, lat, lng, ...rest } = input;
      const hotel = await getHotelById(id);
      if (!isHotelOwner(hotel, ctx.user.id))
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "You do not manage this property."
        });
      return updateHotelForOwner({
        id,
        ownerId: ctx.user.id,
        values: {
          ...rest,
          lat: lat === void 0 || lat === null ? lat : lat.toFixed(6),
          lng: lng === void 0 || lng === null ? lng : lng.toFixed(6)
        }
      });
    }),
    availability: protectedProcedure.input(
      z2.object({
        hotelId: z2.number().int().positive(),
        checkInDate: dateInput,
        checkOutDate: dateInput
      })
    ).query(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel || hotel.ownerId !== ctx.user.id)
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "You do not manage this property."
        });
      return listRoomAvailabilityForHotel(input);
    }),
    rooms: protectedProcedure.input(z2.object({ hotelId: z2.number().int().positive() })).query(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel || hotel.ownerId !== ctx.user.id)
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "You do not manage this property."
        });
      return listRoomsForHotel(input.hotelId);
    }),
    bookings: protectedProcedure.input(z2.object({ hotelId: z2.number().int().positive() })).query(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel || hotel.ownerId !== ctx.user.id)
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "You do not manage this property."
        });
      return listBookingsForHotel(input.hotelId);
    }),
    conflicts: protectedProcedure.input(z2.object({ hotelId: z2.number().int().positive() })).query(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel || hotel.ownerId !== ctx.user.id)
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "You do not manage this property."
        });
      return listConflictBookingsForHotel(input.hotelId);
    }),
    createRoom: protectedProcedure.input(
      z2.object({
        hotelId: z2.number().int().positive(),
        name: z2.string().min(2).max(255),
        roomType: z2.string().min(2).max(128),
        description: z2.string().max(2e3).optional(),
        capacity: z2.number().int().min(1).max(20),
        priceGhs: z2.number().nonnegative(),
        priceUsd: z2.number().nonnegative(),
        totalRooms: z2.number().int().min(0).max(1e3),
        amenities: z2.array(z2.string().max(80)).max(30).default([]),
        images: z2.array(z2.string().url()).max(20).default([])
      })
    ).mutation(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!isHotelOwner(hotel, ctx.user.id))
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "You do not manage this property."
        });
      return createRoomForHotel({
        ...input,
        priceGhs: input.priceGhs.toFixed(2),
        priceUsd: input.priceUsd.toFixed(2),
        description: input.description ?? null
      });
    }),
    updateRoom: protectedProcedure.input(
      z2.object({
        id: z2.number().int().positive(),
        hotelId: z2.number().int().positive(),
        name: z2.string().min(2).max(255).optional(),
        roomType: z2.string().min(2).max(128).optional(),
        description: z2.string().max(2e3).nullable().optional(),
        priceGhs: z2.number().nonnegative().optional(),
        priceUsd: z2.number().nonnegative().optional(),
        totalRooms: z2.number().int().min(0).max(1e3).optional(),
        capacity: z2.number().int().min(1).max(20).optional(),
        amenities: z2.array(z2.string().trim().max(80)).max(30).optional(),
        images: z2.array(z2.string().url()).max(20).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!isHotelOwner(hotel, ctx.user.id))
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "You do not manage this property."
        });
      const { id, hotelId, priceGhs, priceUsd, ...rest } = input;
      const values = { ...rest };
      if (priceGhs !== void 0) values.priceGhs = priceGhs.toFixed(2);
      if (priceUsd !== void 0) values.priceUsd = priceUsd.toFixed(2);
      return updateRoomForHotel({ id, hotelId, values });
    }),
    updateBookingStatus: protectedProcedure.input(
      z2.object({
        hotelId: z2.number().int().positive(),
        id: z2.number().int().positive(),
        bookingStatus: z2.enum([
          "booked",
          "checked_in",
          "checked_out",
          "cancelled",
          "conflict_flagged"
        ]),
        conflictDetails: z2.string().max(2e3).nullable().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel || hotel.ownerId !== ctx.user.id)
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "You do not manage this property."
        });
      return updateBookingStatusForHotel(input);
    }),
    deleteBlockedDate: protectedProcedure.input(
      z2.object({
        id: z2.number().int().positive(),
        hotelId: z2.number().int().positive()
      })
    ).mutation(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel || hotel.ownerId !== ctx.user.id)
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "You do not manage this property."
        });
      return deleteBlockedDateForHotel(input.id, input.hotelId);
    }),
    blockedDates: protectedProcedure.input(z2.object({ hotelId: z2.number().int().positive() })).query(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel || hotel.ownerId !== ctx.user.id)
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "You do not manage this property."
        });
      return listBlockedDates(input.hotelId);
    }),
    blockDates: protectedProcedure.input(
      z2.object({
        hotelId: z2.number().int().positive(),
        roomId: z2.number().int().positive().optional(),
        startDate: dateInput,
        endDate: dateInput,
        reason: z2.string().max(255).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel || hotel.ownerId !== ctx.user.id)
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "You do not manage this property."
        });
      return blockDates(input);
    }),
    publishToBillFlow: protectedProcedure.input(z2.object({ hotelId: z2.number().int().positive() })).mutation(async ({ input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel)
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Hotel not found"
        });
      return {
        success: true,
        message: "Publish contract queued; add BillFlow credentials to complete the live sync.",
        hotelId: hotel.id
      };
    }),
    getPayoutAccount: protectedProcedure.input(z2.object({ hotelId: z2.number().int().positive() })).query(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel || hotel.ownerId !== ctx.user.id)
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "You do not manage this property."
        });
      return getPayoutAccountForHotel(input.hotelId);
    }),
    savePayoutAccount: protectedProcedure.input(
      z2.object({
        hotelId: z2.number().int().positive(),
        payoutMethod: z2.string().min(2).max(32),
        accountName: z2.string().min(2).max(255),
        accountNumber: z2.string().min(3).max(128),
        bankName: z2.string().max(128).optional(),
        networkProvider: z2.string().max(64).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel || hotel.ownerId !== ctx.user.id)
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "You do not manage this property."
        });
      return savePayoutAccount({ ownerId: ctx.user.id, ...input });
    })
  }),
  admin: router({
    hotels: adminProcedure.query(() => listAllHotels()),
    bookings: adminProcedure.query(() => getAllBookings()),
    payouts: adminProcedure.query(() => listPayouts()),
    refundBooking: adminProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(({ input }) => refundBookingForAdmin(input.id)),
    approveHotel: adminProcedure.input(
      z2.object({
        id: z2.number().int().positive(),
        status: z2.enum(["approved", "rejected", "pending"])
      })
    ).mutation(({ input }) => updateHotelApproval(input.id, input.status)),
    summary: adminProcedure.query(async () => {
      const allHotels = await listAllHotels();
      const allBookings = await getAllBookings();
      const successful = allBookings.filter(
        (booking) => booking.paymentStatus === "success"
      );
      const gross = successful.reduce(
        (sum, booking) => sum + Number(booking.totalAmount),
        0
      );
      const commission = successful.reduce(
        (sum, booking) => sum + Number(booking.commissionAmount),
        0
      );
      return {
        hotelCount: allHotels.length || demoHotels.length,
        bookingCount: allBookings.length,
        gross,
        commission,
        conflictCount: allBookings.filter(
          (booking) => booking.bookingStatus === "conflict_flagged"
        ).length
      };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vercelTrpc.ts
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[tRPC Error] on path '${path}':`, error);
    }
  })
);
app.use((err, req, res, next) => {
  console.error("[Vercel Function Error Uncaught]:", err);
  res.status(500).json({
    error: err?.message || "Internal server error",
    stack: process.env.NODE_ENV === "development" ? err?.stack : void 0
  });
});
async function handler(req, res) {
  if (!req.body && (req.method === "POST" || req.method === "PUT")) {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }
    try {
      if (body) {
        req.body = JSON.parse(body);
      }
    } catch (e) {
    }
  }
  return app(req, res);
}
export {
  handler as default
};
