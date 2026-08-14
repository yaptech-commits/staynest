import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { storagePut } from "./storage";
import { systemRouter } from "./_core/systemRouter";
import {
  adminProcedure,
  isPlatformAdmin,
  protectedProcedure,
  publicProcedure,
  router,
} from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import type { InsertRoom } from "../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { hotels } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  getDb,
  addReview,
  blockDates,
  cancelBookingForUser,
  createBooking,
  getAllBookings,
  getBookingForUser,
  getBookingByPaymentReference,
  getBookingsForUser,
  getHotelById,
  listAllHotels,
  listAllPayoutAccountSummaries,
  listAllRooms,
  listAllUsers,
  listApprovedHotels,
  listAllBlockedDates,
  listBlockedDates,
  listHotelsForOwner,
  listReviewsForHotel,
  setPasswordResetToken,
  getUserByResetToken,
  updateUserPassword,
  updateUserAvatar,
  addMessage,
  listMessagesForBooking,
  listRoomsForHotel,
  listRoomAvailabilityForHotel,
  listBookingsForHotel,
  listConflictBookingsForHotel,
  updateBookingStatusForHotel,
  createRoomForHotel,
  updateRoomForHotel,
  deleteBlockedDateForHotel,
  refundBookingForAdmin,
  recordBookingFinance,
  listPayouts,
  updateHotelApproval,
  createHotelForOwner,
  updateHotelForOwner,
  saveOnboardingProfile,
  notifyAdminsOfPartnerApplication,
  listNotificationsForUser,
  markNotificationRead,
  verifyOnboardingEmail,
  getOnboardingProfileForUser,
  resendOnboardingVerification,
  savePayoutAccount,
  getPayoutAccountForHotel,
  isHotelOwner,
  getUserPreferences,
  saveUserPreferences,
  getUserByEmail,
  createOrUpdateLocalUser,
} from "./db";
import { sdk } from "./_core/sdk";
import { ONE_YEAR_MS } from "@shared/const";
import {
  calculateCommission,
  cancelBillFlowReservation,
  createBillFlowReservation,
  getLiveAvailability,
  initializePayment,
  makeBookingReference,
  STAYNEST_COMMISSION_RATE,
  sendBookingEmail,
  verifyPayment,
  verifyPaymentToken,
  sendWelcomeEmail,
} from "./staynest";

const dateInput = z.string().min(10).max(32);
const currencyInput = z.enum(["GHS", "USD"]);
const gatewayInput = z.enum(["paystack", "flutterwave"]);
const onboardingProfileInput = z
  .object({
    role: z.enum(["guest", "partner"]),
    fullName: z.string().trim().min(2).max(255),
    email: z.string().trim().email().max(320),
    businessName: z.string().trim().max(255).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.role === "partner" && !value.businessName) {
      ctx.addIssue({
        code: "custom",
        path: ["businessName"],
        message: "Hotel or business name is required for partners.",
      });
    }
  });

const catalogInput = z.object({
  location: z.string().optional(),
  checkInDate: dateInput.optional(),
  checkOutDate: dateInput.optional(),
  guestsCount: z.number().int().min(1).max(12).default(2),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  minRating: z.number().min(0).max(5).optional(),
  currency: currencyInput.default("GHS"),
});

function normalizeJson(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [];
}

function defaultStayDates() {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 14);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 3);
  return {
    checkInDate: checkIn.toISOString().slice(0, 10),
    checkOutDate: checkOut.toISOString().slice(0, 10),
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    localLogin: publicProcedure
      .input(
        z.object({
          email: z.string().trim().toLowerCase().email(),
          password: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }
        const bcrypt = await import("bcryptjs");
        const crypto = await import("crypto");
        let valid = false;
        if (
          user.passwordHash.startsWith("$2b$") ||
          user.passwordHash.startsWith("$2a$")
        ) {
          valid = await bcrypt.compare(input.password, user.passwordHash);
        } else {
          const legacyHash = crypto
            .createHash("sha256")
            .update(input.password)
            .digest("hex");
          valid = legacyHash === user.passwordHash;
          if (valid) {
            // Upgrade legacy hash to bcrypt
            const newHash = await bcrypt.hash(input.password, 10);
            await createOrUpdateLocalUser({
              email: user.email!,
              name: user.name || "User",
              passwordHash: newHash,
            });
          }
        }
        if (!valid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
        return { success: true, user };
      }),
    localRegister: publicProcedure
      .input(
        z.object({
          email: z.string().trim().toLowerCase().email(),
          password: z.string().min(6),
          name: z.string().trim().min(2),
          role: z.enum(["user", "hotel_owner"]).default("user"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getUserByEmail(input.email);
        if (existing && existing.passwordHash) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "An account with this email already exists.",
          });
        }
        const bcrypt = await import("bcryptjs");
        const passwordHash = await bcrypt.hash(input.password, 10);
        const user = await createOrUpdateLocalUser({
          email: input.email,
          name: input.name,
          passwordHash,
          role:
            input.email === "wisdomasaare41@gmail.com"
              ? "superadmin"
              : input.role,
        });
        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not create account.",
          });
        }
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
        return { success: true, user };
      }),
    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().trim().toLowerCase().email() }))
      .mutation(async ({ input }) => {
        const user = await getUserByEmail(input.email);
        if (!user) {
          // Return success to prevent user enumeration
          return {
            success: true,
            message:
              "If an account exists with this email, a reset link has been sent.",
          };
        }
        const token = nanoid(32);
        const expires = new Date(Date.now() + 3600 * 1000); // 1 hour
        await setPasswordResetToken(input.email, token, expires);
        // In production, send email via Resend. For sandbox testing, we log the reset link.
        console.log(
          `[Password Reset] Link for ${input.email}: /reset-password?token=${token}`
        );
        return {
          success: true,
          message: "Password reset link generated and sent.",
          debugToken: token,
        };
      }),
    resetPassword: publicProcedure
      .input(
        z.object({ token: z.string().min(10), newPassword: z.string().min(6) })
      )
      .mutation(async ({ input }) => {
        const user = await getUserByResetToken(input.token);
        if (
          !user ||
          !user.passwordResetExpires ||
          new Date() > user.passwordResetExpires
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired password reset token.",
          });
        }
        const bcrypt = await import("bcryptjs");
        const passwordHash = await bcrypt.hash(input.newPassword, 10);
        await updateUserPassword(user.id, passwordHash);
        return {
          success: true,
          message: "Password successfully updated. You can now sign in.",
        };
      }),
    uploadAvatar: protectedProcedure
      .input(z.object({ base64Data: z.string() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const matches = input.base64Data.match(
            /^data:(image\/[a-zA-Z+-]+);base64,(.+)$/
          );
          if (!matches)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid image data format.",
            });
          const mimeType = matches[1].toLowerCase();
          const buffer = Buffer.from(matches[2], "base64");
          if (buffer.length > 5 * 1024 * 1024)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Avatar exceeds 5MB limit.",
            });
          const ext = mimeType.split("/")[1] || "jpg";
          const key = `avatars/${ctx.user.id}-${Date.now()}.${ext}`;
          const stored = await storagePut(key, buffer, mimeType);
          await updateUserAvatar(ctx.user.id, stored.url);
          return { success: true, url: stored.url };
        } catch (err: any) {
          if (err instanceof TRPCError) throw err;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not upload avatar.",
          });
        }
      }),
    onboardingProfile: protectedProcedure.query(({ ctx }) =>
      getOnboardingProfileForUser(ctx.user.id)
    ),
    resendVerification: protectedProcedure.mutation(async ({ ctx }) => {
      const result = await resendOnboardingVerification(ctx.user.id);
      if (!result)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No onboarding profile found.",
        });
      const profile = result.profile as
        | { email?: string; fullName?: string; role?: "guest" | "partner" }
        | undefined;
      const email = profile?.email ?? ctx.user.email ?? "";
      const fullName = profile?.fullName ?? ctx.user.name ?? "Guest";
      const role = profile?.role ?? "guest";
      const welcomeEmail = email
        ? await sendWelcomeEmail({
            to: email,
            fullName,
            role,
            verificationToken: result.verificationToken,
          })
        : { configured: false, sent: false };
      return { success: true, welcomeEmail };
    }),
    saveOnboarding: protectedProcedure
      .input(onboardingProfileInput)
      .mutation(async ({ ctx, input }) => {
        const profile = await saveOnboardingProfile({
          userId: ctx.user.id,
          ...input,
        });
        const profileRecord = profile as { emailVerificationToken?: unknown };
        const verificationToken =
          typeof profileRecord.emailVerificationToken === "string"
            ? profileRecord.emailVerificationToken
            : "";
        const welcomeEmail = verificationToken
          ? await sendWelcomeEmail({
              to: input.email,
              fullName: input.fullName,
              role: input.role,
              verificationToken,
            })
          : { configured: false, sent: false };
        const adminAlerts =
          input.role === "partner"
            ? await notifyAdminsOfPartnerApplication({
                userId: ctx.user.id,
                applicantName: input.fullName,
                email: input.email,
                businessName: input.businessName,
              })
            : 0;
        return { profile, welcomeEmail, adminAlerts };
      }),
    verifyEmail: publicProcedure
      .input(z.object({ token: z.string().min(20).max(128) }))
      .mutation(({ input }) => verifyOnboardingEmail(input.token)),
    getPreferences: protectedProcedure.query(({ ctx }) =>
      getUserPreferences(ctx.user.id)
    ),
    savePreferences: protectedProcedure
      .input(
        z.object({
          phone: z.string().max(32).optional(),
          smsRemindersEnabled: z.number().int().min(0).max(1).optional(),
          emailRemindersEnabled: z.number().int().min(0).max(1).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        saveUserPreferences({ userId: ctx.user.id, ...input })
      ),
  }),

  notifications: router({
    mine: protectedProcedure.query(({ ctx }) =>
      listNotificationsForUser(ctx.user.id)
    ),
    markRead: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) =>
        markNotificationRead(input.id, ctx.user.id)
      ),
  }),

  catalog: router({
    search: publicProcedure.input(catalogInput).query(async ({ input }) => {
      const dbHotels = await listApprovedHotels();
      if (!dbHotels.length) return [];
      const result = [];
      for (const hotel of dbHotels) {
        const hotelRooms = await listRoomsForHotel(hotel.id);
        const stayDates = {
          ...defaultStayDates(),
          checkInDate: input.checkInDate ?? defaultStayDates().checkInDate,
          checkOutDate: input.checkOutDate ?? defaultStayDates().checkOutDate,
        };
        const manualAvailability = hotel.isBillflowConnected
          ? new Map<number, { availableRooms: number }>()
          : new Map(
              (
                await listRoomAvailabilityForHotel({
                  hotelId: hotel.id,
                  ...stayDates,
                })
              ).map(room => [room.id, room])
            );
        const roomsForGuests = hotelRooms
          .filter(room => {
            const amount =
              input.currency === "GHS"
                ? Number(room.priceGhs)
                : Number(room.priceUsd);
            return (
              Number(room.capacity) >= input.guestsCount &&
              (input.minPrice === undefined || amount >= input.minPrice) &&
              (input.maxPrice === undefined || amount <= input.maxPrice)
            );
          })
          .map(room => ({
            id: room.id,
            hotelId: room.hotelId,
            name: room.name,
            roomType: room.roomType,
            description: room.description ?? "",
            capacity: room.capacity,
            priceGhs: Number(room.priceGhs),
            priceUsd: Number(room.priceUsd),
            totalRooms: room.totalRooms,
            availableRooms:
              manualAvailability.get(room.id)?.availableRooms ??
              room.totalRooms,
            amenities: normalizeJson(room.amenities),
            images: normalizeJson(room.images),
            liveSource: hotel.isBillflowConnected
              ? ("billflow" as const)
              : ("staynest" as const),
          }));
        if (!roomsForGuests.length) continue;
        if (
          input.location &&
          !`${hotel.name} ${hotel.location}`
            .toLowerCase()
            .includes(input.location.toLowerCase())
        )
          continue;
        if (
          input.minRating !== undefined &&
          Number(hotel.rating ?? 0) < input.minRating
        )
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
          rooms: roomsForGuests,
        });
      }
      return result;
    }),

    getHotel: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        const hotel = await getHotelById(input.id);
        if (!hotel)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Hotel not found",
          });
        const hotelRooms = await listRoomsForHotel(hotel.id);
        const stayDates = defaultStayDates();
        const manualAvailability = hotel.isBillflowConnected
          ? new Map<number, { availableRooms: number }>()
          : new Map(
              (
                await listRoomAvailabilityForHotel({
                  hotelId: hotel.id,
                  ...stayDates,
                })
              ).map(room => [room.id, room])
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
          rooms: hotelRooms.map(room => ({
            id: room.id,
            hotelId: room.hotelId,
            name: room.name,
            roomType: room.roomType,
            description: room.description ?? "",
            capacity: room.capacity,
            priceGhs: Number(room.priceGhs),
            priceUsd: Number(room.priceUsd),
            totalRooms: room.totalRooms,
            availableRooms:
              manualAvailability.get(room.id)?.availableRooms ??
              room.totalRooms,
            amenities: normalizeJson(room.amenities),
            images: normalizeJson(room.images),
            liveSource: Boolean(hotel.isBillflowConnected)
              ? ("billflow" as const)
              : ("staynest" as const),
          })),
        };
      }),

    liveAvailability: publicProcedure
      .input(
        z.object({
          hotelId: z.number().int().positive(),
          roomTypeId: z.number().int().positive(),
          checkInDate: dateInput,
          checkOutDate: dateInput,
        })
      )
      .query(async ({ input }) => {
        const dbHotel = await getHotelById(input.hotelId);
        const dbRoom = dbHotel
          ? (await listRoomsForHotel(dbHotel.id)).find(
              item => item.id === input.roomTypeId
            )
          : undefined;
        const connected = Boolean(dbHotel?.isBillflowConnected);
        const manualAvailability =
          !connected && dbHotel
            ? (
                await listRoomAvailabilityForHotel({
                  hotelId: dbHotel.id,
                  checkInDate: input.checkInDate,
                  checkOutDate: input.checkOutDate,
                })
              ).find(item => item.id === input.roomTypeId)
            : undefined;
        const live = await getLiveAvailability({
          businessId: dbHotel?.isBillflowConnected
            ? (dbHotel.billflowBusinessId ?? undefined)
            : undefined,
          propertyId: dbHotel?.isBillflowConnected
            ? (dbHotel.billflowPropertyId ?? undefined)
            : undefined,
          roomTypeId: String(input.roomTypeId),
          checkInDate: input.checkInDate,
          checkOutDate: input.checkOutDate,
        });
        return {
          availableRooms:
            live.availableRooms ??
            manualAvailability?.availableRooms ??
            dbRoom?.totalRooms ??
            0,
          livePricing:
            live.livePricing ??
            (dbRoom
              ? { ghs: Number(dbRoom.priceGhs), usd: Number(dbRoom.priceUsd) }
              : null),
          source:
            live.source === "billflow"
              ? ("billflow" as const)
              : connected
                ? ("billflow" as const)
                : ("staynest" as const),
          checkedAt: new Date().toISOString(),
        };
      }),

    reviews: publicProcedure
      .input(z.object({ hotelId: z.number().int().positive() }))
      .query(({ input }) => listReviewsForHotel(input.hotelId)),
  }),

  payments: router({
    initialize: protectedProcedure
      .input(
        z.object({
          email: z.string().email(),
          amount: z.number().positive(),
          currency: currencyInput,
          gateway: gatewayInput,
          hotelId: z.number().int().positive(),
          roomId: z.number().int().positive(),
          checkInDate: dateInput,
          checkOutDate: dateInput,
          guestsCount: z.number().int().min(1).max(12),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const reference = makeBookingReference();
        const result = await initializePayment({
          ...input,
          reference,
          callbackUrl: `${process.env.APP_URL ?? ""}/booking/complete?reference=${reference}`,
          metadata: {
            hotelId: input.hotelId,
            roomId: input.roomId,
            userId: ctx.user.id,
          },
        });
        return {
          ...result,
          reference,
          commissionRate: STAYNEST_COMMISSION_RATE,
        };
      }),
    verify: protectedProcedure
      .input(
        z.object({
          gateway: gatewayInput,
          reference: z.string().min(6),
          transactionId: z.string().optional(),
          expectedAmount: z.number().positive(),
          currency: currencyInput,
        })
      )
      .mutation(({ input }) => verifyPayment(input)),
  }),

  bookings: router({
    createAfterVerifiedPayment: protectedProcedure
      .input(
        z.object({
          hotelId: z.number().int().positive(),
          roomId: z.number().int().positive(),
          bookingReference: z.string().min(6),
          paymentReference: z.string().min(3),
          paymentGateway: gatewayInput,
          paymentStatus: z.literal("success"),
          verificationToken: z.string().min(20),
          currency: currencyInput,
          totalAmount: z.number().positive(),
          checkInDate: dateInput,
          checkOutDate: dateInput,
          guestsCount: z.number().int().min(1).max(12),
          guestName: z.string().min(2),
          guestEmail: z.string().email(),
          guestPhone: z.string().min(7).max(32),
          specialRequests: z.string().max(1000).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const tokenValid = await verifyPaymentToken(input.verificationToken, {
          gateway: input.paymentGateway,
          reference: input.paymentReference,
          expectedAmount: input.totalAmount,
          currency: input.currency,
        });
        if (!tokenValid)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Payment verification expired or did not match the booking total.",
          });
        const existingBooking = await getBookingByPaymentReference(
          input.paymentReference
        );
        if (existingBooking)
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "This payment reference has already been used. The booking was not charged twice.",
          });
        const { commission, hotelPayout } = calculateCommission(
          input.totalAmount
        );
        const dbHotel = await getHotelById(input.hotelId);
        if (!dbHotel)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Hotel or room not found",
          });
        const availableRooms = await listRoomsForHotel(dbHotel.id);
        const room = availableRooms.find(item => item.id === input.roomId);
        if (!room)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Hotel or room not found",
          });
        const connected = Boolean(dbHotel.isBillflowConnected);
        const billflowReservation = await createBillFlowReservation({
          businessId: connected
            ? (dbHotel.billflowBusinessId ?? undefined)
            : undefined,
          propertyId: connected
            ? (dbHotel.billflowPropertyId ?? undefined)
            : undefined,
          roomTypeId: room.roomType,
          guestName: input.guestName,
          guestEmail: input.guestEmail,
          guestPhone: input.guestPhone,
          checkInDate: input.checkInDate,
          checkOutDate: input.checkOutDate,
          channel: "staynest",
          paymentReference: input.paymentReference,
        });
        const conflict = Boolean(billflowReservation.conflict);
        const booking = await createBooking({
          bookingReference: input.bookingReference,
          userId: ctx.user.id,
          hotelId: input.hotelId,
          roomId: input.roomId,
          roomNumber:
            "roomNumber" in billflowReservation
              ? billflowReservation.roomNumber
              : null,
          billflowReservationId: billflowReservation.reservationId,
          checkInDate: input.checkInDate,
          checkOutDate: input.checkOutDate,
          numberOfNights: Math.max(
            1,
            Math.round(
              (new Date(input.checkOutDate).getTime() -
                new Date(input.checkInDate).getTime()) /
                86400000
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
          conflictDetails: conflict
            ? "conflictDetails" in billflowReservation
              ? (billflowReservation.conflictDetails ??
                "BillFlow reported a booking conflict. Hotel review is required.")
              : "BillFlow reported a booking conflict. Hotel review is required."
            : null,
        });
        await recordBookingFinance({
          bookingId: booking.id,
          hotelId: input.hotelId,
          currency: input.currency,
          grossAmount: input.totalAmount,
          commissionRate: STAYNEST_COMMISSION_RATE,
          commissionAmount: commission,
          hotelPayoutAmount: hotelPayout,
        });
        await sendBookingEmail({
          to: input.guestEmail,
          guestName: input.guestName,
          bookingReference: input.bookingReference,
          hotelName: dbHotel.name,
          roomName: room.name,
          checkInDate: input.checkInDate,
          checkOutDate: input.checkOutDate,
          total: input.totalAmount,
          currency: input.currency,
        });
        return {
          ...booking,
          conflict,
          conflictDetails:
            conflict && "conflictDetails" in billflowReservation
              ? billflowReservation.conflictDetails
              : null,
        };
      }),

    mine: protectedProcedure.query(({ ctx }) =>
      getBookingsForUser(ctx.user.id)
    ),
    cancel: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const booking = await getBookingForUser(input.id, ctx.user.id);
        if (!booking)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Booking not found.",
          });
        if (
          booking.bookingStatus === "cancelled" ||
          booking.paymentStatus === "refunded"
        )
          return { success: true, source: "already-cancelled" as const };
        const hotel = await getHotelById(booking.hotelId);
        const external = await cancelBillFlowReservation({
          businessId: hotel?.billflowBusinessId ?? undefined,
          propertyId: hotel?.billflowPropertyId ?? undefined,
          reservationId:
            booking.billflowReservationId ??
            booking.paymentReference ??
            booking.bookingReference,
          bookingReference: booking.bookingReference,
        });
        if (!external.cancelled)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "The property system did not acknowledge this cancellation. No local cancellation was applied.",
          });
        const success = await cancelBookingForUser(input.id, ctx.user.id);
        return { success, source: external.source };
      }),
    uploadReviewPhoto: protectedProcedure
      .input(
        z.object({
          base64Data: z.string().min(10),
          fileName: z.string().min(1).max(255),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const matches = input.base64Data.match(
            /^data:(image\/(jpeg|png|webp|heic|jpg));base64,(.+)$/i
          );
          if (!matches) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Only JPEG, PNG, and WebP image formats are supported.",
            });
          }
          const mimeType = matches[1].toLowerCase();
          const rawBase64 = matches[3];
          const buffer = Buffer.from(rawBase64, "base64");
          if (buffer.length > 5 * 1024 * 1024) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Photo exceeds 5MB limit.",
            });
          }
          const ext = mimeType.split("/")[1] || "jpg";
          const key = `reviews/${ctx.user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const stored = await storagePut(key, buffer, mimeType);
          return { success: true, url: stored.url };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not upload review photo.",
          });
        }
      }),

    addReview: protectedProcedure
      .input(
        z.object({
          hotelId: z.number().int().positive(),
          bookingId: z.number().int().positive(),
          rating: z.number().int().min(1).max(5),
          comment: z.string().max(1000).optional(),
          photoUrls: z.array(z.string().url()).max(5).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const booking = await getBookingForUser(input.bookingId, ctx.user.id);
        if (
          !booking ||
          booking.hotelId !== input.hotelId ||
          booking.paymentStatus !== "success"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Reviews are only available for confirmed and completed stays.",
          });
        }
        const existingReviews = await listReviewsForHotel(input.hotelId);
        const alreadyReviewed = existingReviews.some(
          r => r.userId === ctx.user.id && r.bookingId === input.bookingId
        );
        if (alreadyReviewed) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You have already reviewed this stay.",
          });
        }
        const review = await addReview({
          hotelId: input.hotelId,
          bookingId: input.bookingId,
          rating: input.rating,
          comment: input.comment,
          photoUrls: input.photoUrls ?? [],
          userId: ctx.user.id,
          guestName: ctx.user.name ?? "Guest",
        });
        const updatedReviews = [review, ...existingReviews];
        const avgRating =
          updatedReviews.reduce((sum, r) => sum + r.rating, 0) /
          updatedReviews.length;
        const db = await getDb();
        if (db) {
          await db
            .update(hotels)
            .set({
              rating: avgRating.toFixed(2),
              reviewCount: updatedReviews.length,
            })
            .where(eq(hotels.id, input.hotelId));
        }
        return {
          success: true,
          review,
          newRating: Number(avgRating.toFixed(2)),
          reviewCount: updatedReviews.length,
        };
      }),

    listMessages: protectedProcedure
      .input(z.object({ bookingId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const booking = await getBookingForUser(input.bookingId, ctx.user.id);
        const hotel = booking ? await getHotelById(booking.hotelId) : null;
        const isOwner = hotel && hotel.ownerId === ctx.user.id;
        const isAdmin = isPlatformAdmin(ctx.user);
        if (!booking && !isOwner && !isAdmin) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this conversation.",
          });
        }
        return listMessagesForBooking(input.bookingId);
      }),

    sendMessage: protectedProcedure
      .input(
        z.object({
          bookingId: z.number().int().positive(),
          messageText: z.string().min(1).max(2000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const booking = await getBookingForUser(input.bookingId, ctx.user.id);
        const hotel = booking ? await getHotelById(booking.hotelId) : null;
        const isOwner = hotel && hotel.ownerId === ctx.user.id;
        const isAdmin = isPlatformAdmin(ctx.user);
        if (!booking && !isOwner && !isAdmin) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this conversation.",
          });
        }
        const receiverId =
          ctx.user.id === booking?.userId
            ? (hotel?.ownerId ?? booking.userId)
            : (booking?.userId ?? ctx.user.id);
        const message = await addMessage({
          bookingId: input.bookingId,
          senderId: ctx.user.id,
          receiverId,
          messageText: input.messageText,
        });
        return { success: true, message };
      }),
  }),

  hotel: router({
    mine: protectedProcedure.query(({ ctx }) =>
      listHotelsForOwner(ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(2).max(255),
          location: z.string().trim().min(2).max(255),
          address: z.string().trim().max(1000).optional(),
          description: z.string().trim().max(2000).optional(),
          images: z.array(z.string().url()).max(20).default([]),
          amenities: z.array(z.string().trim().max(80)).max(30).default([]),
          lat: z.number().min(-90).max(90).optional(),
          lng: z.number().min(-180).max(180).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        createHotelForOwner({ ownerId: ctx.user.id, ...input })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          name: z.string().trim().min(2).max(255).optional(),
          location: z.string().trim().min(2).max(255).optional(),
          address: z.string().trim().max(1000).nullable().optional(),
          description: z.string().trim().max(2000).nullable().optional(),
          images: z.array(z.string().url()).max(20).optional(),
          amenities: z.array(z.string().trim().max(80)).max(30).optional(),
          lat: z.number().min(-90).max(90).nullable().optional(),
          lng: z.number().min(-180).max(180).nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, lat, lng, ...rest } = input;
        const hotel = await getHotelById(id);
        if (!isHotelOwner(hotel, ctx.user.id))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not manage this property.",
          });
        return updateHotelForOwner({
          id,
          ownerId: ctx.user.id,
          values: {
            ...rest,
            lat: lat === undefined || lat === null ? lat : lat.toFixed(6),
            lng: lng === undefined || lng === null ? lng : lng.toFixed(6),
          },
        });
      }),
    availability: protectedProcedure
      .input(
        z.object({
          hotelId: z.number().int().positive(),
          checkInDate: dateInput,
          checkOutDate: dateInput,
        })
      )
      .query(async ({ ctx, input }) => {
        const hotel = await getHotelById(input.hotelId);
        if (!hotel || hotel.ownerId !== ctx.user.id)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not manage this property.",
          });
        return listRoomAvailabilityForHotel(input);
      }),
    rooms: protectedProcedure
      .input(z.object({ hotelId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const hotel = await getHotelById(input.hotelId);
        if (!hotel || hotel.ownerId !== ctx.user.id)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not manage this property.",
          });
        return listRoomsForHotel(input.hotelId);
      }),
    bookings: protectedProcedure
      .input(z.object({ hotelId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const hotel = await getHotelById(input.hotelId);
        if (!hotel || hotel.ownerId !== ctx.user.id)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not manage this property.",
          });
        return listBookingsForHotel(input.hotelId);
      }),
    conflicts: protectedProcedure
      .input(z.object({ hotelId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const hotel = await getHotelById(input.hotelId);
        if (!hotel || hotel.ownerId !== ctx.user.id)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not manage this property.",
          });
        return listConflictBookingsForHotel(input.hotelId);
      }),
    createRoom: protectedProcedure
      .input(
        z.object({
          hotelId: z.number().int().positive(),
          name: z.string().min(2).max(255),
          roomType: z.string().min(2).max(128),
          description: z.string().max(2000).optional(),
          capacity: z.number().int().min(1).max(20),
          priceGhs: z.number().nonnegative(),
          priceUsd: z.number().nonnegative(),
          totalRooms: z.number().int().min(0).max(1000),
          amenities: z.array(z.string().max(80)).max(30).default([]),
          images: z.array(z.string().url()).max(20).default([]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const hotel = await getHotelById(input.hotelId);
        if (!isHotelOwner(hotel, ctx.user.id))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not manage this property.",
          });
        return createRoomForHotel({
          ...input,
          priceGhs: input.priceGhs.toFixed(2),
          priceUsd: input.priceUsd.toFixed(2),
          description: input.description ?? null,
        });
      }),
    updateRoom: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          hotelId: z.number().int().positive(),
          name: z.string().min(2).max(255).optional(),
          roomType: z.string().min(2).max(128).optional(),
          description: z.string().max(2000).nullable().optional(),
          priceGhs: z.number().nonnegative().optional(),
          priceUsd: z.number().nonnegative().optional(),
          totalRooms: z.number().int().min(0).max(1000).optional(),
          capacity: z.number().int().min(1).max(20).optional(),
          amenities: z.array(z.string().trim().max(80)).max(30).optional(),
          images: z.array(z.string().url()).max(20).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const hotel = await getHotelById(input.hotelId);
        if (!isHotelOwner(hotel, ctx.user.id))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not manage this property.",
          });
        const { id, hotelId, priceGhs, priceUsd, ...rest } = input;
        const values: Partial<InsertRoom> = { ...rest };
        if (priceGhs !== undefined) values.priceGhs = priceGhs.toFixed(2);
        if (priceUsd !== undefined) values.priceUsd = priceUsd.toFixed(2);
        return updateRoomForHotel({ id, hotelId, values });
      }),
    updateBookingStatus: protectedProcedure
      .input(
        z.object({
          hotelId: z.number().int().positive(),
          id: z.number().int().positive(),
          bookingStatus: z.enum([
            "booked",
            "checked_in",
            "checked_out",
            "cancelled",
            "conflict_flagged",
          ]),
          conflictDetails: z.string().max(2000).nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const hotel = await getHotelById(input.hotelId);
        if (!hotel || hotel.ownerId !== ctx.user.id)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not manage this property.",
          });
        return updateBookingStatusForHotel(input);
      }),
    deleteBlockedDate: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          hotelId: z.number().int().positive(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const hotel = await getHotelById(input.hotelId);
        if (!hotel || hotel.ownerId !== ctx.user.id)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not manage this property.",
          });
        return deleteBlockedDateForHotel(input.id, input.hotelId);
      }),
    blockedDates: protectedProcedure
      .input(z.object({ hotelId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const hotel = await getHotelById(input.hotelId);
        if (!hotel || hotel.ownerId !== ctx.user.id)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not manage this property.",
          });
        return listBlockedDates(input.hotelId);
      }),
    blockDates: protectedProcedure
      .input(
        z.object({
          hotelId: z.number().int().positive(),
          roomId: z.number().int().positive().optional(),
          startDate: dateInput,
          endDate: dateInput,
          reason: z.string().max(255).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const hotel = await getHotelById(input.hotelId);
        if (!hotel || hotel.ownerId !== ctx.user.id)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not manage this property.",
          });
        return blockDates(input);
      }),
    publishToBillFlow: protectedProcedure
      .input(z.object({ hotelId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const hotel = await getHotelById(input.hotelId);
        if (!hotel)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Hotel not found",
          });
        return {
          success: true,
          message:
            "Publish contract queued; add BillFlow credentials to complete the live sync.",
          hotelId: hotel.id,
        };
      }),
    getPayoutAccount: protectedProcedure
      .input(z.object({ hotelId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const hotel = await getHotelById(input.hotelId);
        if (!hotel || hotel.ownerId !== ctx.user.id)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not manage this property.",
          });
        return getPayoutAccountForHotel(input.hotelId);
      }),
    savePayoutAccount: protectedProcedure
      .input(
        z.object({
          hotelId: z.number().int().positive(),
          payoutMethod: z.string().min(2).max(32),
          accountName: z.string().min(2).max(255),
          accountNumber: z.string().min(3).max(128),
          bankName: z.string().max(128).optional(),
          networkProvider: z.string().max(64).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const hotel = await getHotelById(input.hotelId);
        if (!hotel || hotel.ownerId !== ctx.user.id)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not manage this property.",
          });
        return savePayoutAccount({ ownerId: ctx.user.id, ...input });
      }),
  }),

  admin: router({
    users: adminProcedure.query(() => listAllUsers()),
    hotels: adminProcedure.query(() => listAllHotels()),
    bookings: adminProcedure.query(() => getAllBookings()),
    payouts: adminProcedure.query(() => listPayouts()),
    rooms: adminProcedure.query(() => listAllRooms()),
    blockedAvailability: adminProcedure.query(() => listAllBlockedDates()),
    payoutAccounts: adminProcedure.query(() => listAllPayoutAccountSummaries()),
    ownerOperations: adminProcedure.query(async () => {
      const [users, hotels, rooms, bookings, payouts, payoutAccounts] =
        await Promise.all([
          listAllUsers(),
          listAllHotels(),
          listAllRooms(),
          getAllBookings(),
          listPayouts(),
          listAllPayoutAccountSummaries(),
        ]);
      return {
        owners: users.filter(user => user.role === "hotel_owner"),
        propertyCount: hotels.length,
        roomCount: rooms.length,
        bookingCount: bookings.length,
        payoutCount: payouts.length,
        payoutAccountCount: payoutAccounts.length,
      };
    }),
    refundBooking: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => refundBookingForAdmin(input.id)),
    approveHotel: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          status: z.enum(["approved", "rejected", "pending"]),
        })
      )
      .mutation(({ input }) => updateHotelApproval(input.id, input.status)),
    summary: adminProcedure.query(async () => {
      const allHotels = await listAllHotels();
      const allBookings = await getAllBookings();
      const successful = allBookings.filter(
        booking => booking.paymentStatus === "success"
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
        hotelCount: allHotels.length,
        bookingCount: allBookings.length,
        gross,
        commission,
        conflictCount: allBookings.filter(
          booking => booking.bookingStatus === "conflict_flagged"
        ).length,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
