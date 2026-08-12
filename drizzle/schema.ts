import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "hotel_owner", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const hotels = mysqlTable("staynest_hotels", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  location: varchar("location", { length: 255 }).notNull(), // e.g. "East Legon, Accra"
  address: text("address"),
  lat: decimal("lat", { precision: 10, scale: 6 }),
  lng: decimal("lng", { precision: 10, scale: 6 }),
  images: json("images").notNull(), // array of image URLs
  amenities: json("amenities").notNull(), // array of strings
  rating: decimal("rating", { precision: 3, scale: 2 }).default("4.80"),
  reviewCount: int("reviewCount").default(0),
  isBillflowConnected: int("isBillflowConnected").default(0), // 1 for connected, 0 for manual
  billflowBusinessId: varchar("billflowBusinessId", { length: 128 }),
  billflowPropertyId: varchar("billflowPropertyId", { length: 128 }),
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Hotel = typeof hotels.$inferSelect;
export type InsertHotel = typeof hotels.$inferInsert;

export const rooms = mysqlTable("staynest_rooms", {
  id: int("id").autoincrement().primaryKey(),
  hotelId: int("hotelId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g. "Deluxe Executive King"
  roomType: varchar("roomType", { length: 128 }).notNull(),
  description: text("description"),
  capacity: int("capacity").default(2).notNull(),
  priceGhs: decimal("priceGhs", { precision: 10, scale: 2 }).notNull(),
  priceUsd: decimal("priceUsd", { precision: 10, scale: 2 }).notNull(),
  totalRooms: int("totalRooms").default(5).notNull(),
  amenities: json("amenities"),
  images: json("images"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;

export const bookings = mysqlTable("staynest_bookings", {
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
  commissionAmount: decimal("commissionAmount", { precision: 10, scale: 2 }).notNull(), // 15% flat
  hotelPayoutAmount: decimal("hotelPayoutAmount", { precision: 10, scale: 2 }).notNull(),
  paymentGateway: varchar("paymentGateway", { length: 32 }).default("paystack").notNull(), // paystack or flutterwave
  paymentReference: varchar("paymentReference", { length: 128 }),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "success", "failed", "refunded"]).default("pending").notNull(),
  bookingStatus: mysqlEnum("bookingStatus", ["booked", "checked_in", "checked_out", "cancelled", "conflict_flagged"]).default("booked").notNull(),
  specialRequests: text("specialRequests"),
  conflictDetails: text("conflictDetails"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

export const reviews = mysqlTable("staynest_reviews", {
  id: int("id").autoincrement().primaryKey(),
  hotelId: int("hotelId").notNull(),
  userId: int("userId").notNull(),
  bookingId: int("bookingId").notNull(),
  rating: int("rating").notNull(), // 1 to 5
  comment: text("comment"),
  guestName: varchar("guestName", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

export const blockedDates = mysqlTable("staynest_blocked_dates", {
  id: int("id").autoincrement().primaryKey(),
  hotelId: int("hotelId").notNull(),
  roomId: int("roomId"),
  startDate: varchar("startDate", { length: 32 }).notNull(),
  endDate: varchar("endDate", { length: 32 }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlockedDate = typeof blockedDates.$inferSelect;
export type InsertBlockedDate = typeof blockedDates.$inferInsert;

export const ratePlans = mysqlTable("staynest_rate_plans", {
  id: int("id").autoincrement().primaryKey(),
  hotelId: int("hotelId").notNull(),
  roomId: int("roomId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull(),
  nightlyAmount: decimal("nightlyAmount", { precision: 10, scale: 2 }).notNull(),
  cancellationPolicyId: int("cancellationPolicyId"),
  billflowRatePlanId: varchar("billflowRatePlanId", { length: 128 }),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RatePlan = typeof ratePlans.$inferSelect;
export type InsertRatePlan = typeof ratePlans.$inferInsert;

export const availabilityEvents = mysqlTable("staynest_availability_events", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AvailabilityEvent = typeof availabilityEvents.$inferSelect;
export type InsertAvailabilityEvent = typeof availabilityEvents.$inferInsert;

export const commissionLedger = mysqlTable("staynest_commission_ledger", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  hotelId: int("hotelId").notNull(),
  currency: varchar("currency", { length: 8 }).notNull(),
  grossAmount: decimal("grossAmount", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 4 }).notNull(),
  commissionAmount: decimal("commissionAmount", { precision: 10, scale: 2 }).notNull(),
  hotelPayoutAmount: decimal("hotelPayoutAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "payable", "paid", "refunded"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommissionLedger = typeof commissionLedger.$inferSelect;
export type InsertCommissionLedger = typeof commissionLedger.$inferInsert;

export const payouts = mysqlTable("staynest_payouts", {
  id: int("id").autoincrement().primaryKey(),
  hotelId: int("hotelId").notNull(),
  currency: varchar("currency", { length: 8 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "paid", "failed"]).default("pending").notNull(),
  processorReference: varchar("processorReference", { length: 128 }),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payout = typeof payouts.$inferSelect;
export type InsertPayout = typeof payouts.$inferInsert;

export const cancellationPolicies = mysqlTable("staynest_cancellation_policies", {
  id: int("id").autoincrement().primaryKey(),
  hotelId: int("hotelId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  freeCancellationHours: int("freeCancellationHours").default(48).notNull(),
  refundPercentageAfterWindow: int("refundPercentageAfterWindow").default(0).notNull(),
  isNonRefundable: int("isNonRefundable").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CancellationPolicy = typeof cancellationPolicies.$inferSelect;
export type InsertCancellationPolicy = typeof cancellationPolicies.$inferInsert;

export const notifications = mysqlTable("staynest_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bookingId: int("bookingId"),
  type: varchar("type", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  readAt: timestamp("readAt"),
  dedupeKey: varchar("dedupeKey", { length: 255 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;


export const onboardingProfiles = mysqlTable("staynest_onboarding_profiles", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OnboardingProfile = typeof onboardingProfiles.$inferSelect;
export type InsertOnboardingProfile = typeof onboardingProfiles.$inferInsert;

export const partnerPayoutAccounts = mysqlTable("staynest_payout_accounts", {
  id: int("id").autoincrement().primaryKey(),
  hotelId: int("hotelId").notNull(),
  ownerId: int("ownerId").notNull(),
  payoutMethod: varchar("payoutMethod", { length: 32 }).notNull(), // "bank" | "mobile_money" | "cash"
  accountName: varchar("accountName", { length: 255 }).notNull(),
  accountNumber: varchar("accountNumber", { length: 128 }).notNull(),
  bankName: varchar("bankName", { length: 128 }),
  networkProvider: varchar("networkProvider", { length: 64 }), // e.g. "MTN Mobile Money"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PartnerPayoutAccount = typeof partnerPayoutAccounts.$inferSelect;
export type InsertPartnerPayoutAccount = typeof partnerPayoutAccounts.$inferInsert;

export const userPreferences = mysqlTable("staynest_user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  phone: varchar("phone", { length: 64 }),
  smsRemindersEnabled: int("smsRemindersEnabled").default(1).notNull(),
  emailRemindersEnabled: int("emailRemindersEnabled").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;


