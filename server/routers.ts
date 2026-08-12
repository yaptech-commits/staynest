import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import type { InsertRoom } from "../drizzle/schema";
import { TRPCError } from "@trpc/server";
import {
  addReview,
  blockDates,
  cancelBookingForUser,
  createBooking,
  getAllBookings,
  getBookingForUser,
  getBookingsForUser,
  getHotelById,
  listAllHotels,
  listApprovedHotels,
  listBlockedDates,
  listHotelsForOwner,
  listReviewsForHotel,
  listRoomsForHotel,
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
} from "./db";
import {
  calculateCommission,
  cancelBillFlowReservation,
  createBillFlowReservation,
  demoHotels,
  getLiveAvailability,
  initializePayment,
  makeBookingReference,
  STAYNEST_COMMISSION_RATE,
  sendBookingEmail,
  verifyPayment,
  verifyPaymentToken,
} from "./staynest";

const dateInput = z.string().min(10).max(32);
const currencyInput = z.enum(["GHS", "USD"]);
const gatewayInput = z.enum(["paystack", "flutterwave"]);

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

function demoSearch(input: z.infer<typeof catalogInput>) {
  const location = input.location?.trim().toLowerCase();
  return demoHotels
    .filter((hotel) => !location || `${hotel.name} ${hotel.location}`.toLowerCase().includes(location))
    .map((hotel) => ({
      ...hotel,
      rooms: hotel.rooms.filter((room) => {
        const amount = input.currency === "GHS" ? room.priceGhs : room.priceUsd;
        return room.capacity >= input.guestsCount && (input.minPrice === undefined || amount >= input.minPrice) && (input.maxPrice === undefined || amount <= input.maxPrice);
      }),
    }))
    .filter((hotel) => hotel.rooms.length > 0 && (input.minRating === undefined || (hotel.rating ?? 0) >= input.minRating));
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
  }),

  catalog: router({
    search: publicProcedure.input(catalogInput).query(async ({ input }) => {
      const dbHotels = await listApprovedHotels();
      if (!dbHotels.length) return demoSearch(input);
      const result = [];
      for (const hotel of dbHotels) {
        const hotelRooms = await listRoomsForHotel(hotel.id);
        const roomsForGuests = hotelRooms.filter((room) => {
          const amount = input.currency === "GHS" ? Number(room.priceGhs) : Number(room.priceUsd);
          return Number(room.capacity) >= input.guestsCount && (input.minPrice === undefined || amount >= input.minPrice) && (input.maxPrice === undefined || amount <= input.maxPrice);
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
          availableRooms: room.totalRooms,
          amenities: normalizeJson(room.amenities),
          images: normalizeJson(room.images),
          liveSource: hotel.isBillflowConnected ? "billflow" as const : "staynest" as const,
        }));
        if (!roomsForGuests.length) continue;
        if (input.location && !`${hotel.name} ${hotel.location}`.toLowerCase().includes(input.location.toLowerCase())) continue;
        if (input.minRating !== undefined && Number(hotel.rating ?? 0) < input.minRating) continue;
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
          lng: hotel.lng ? Number(hotel.lng) : -0.1870,
          rooms: roomsForGuests,
        });
      }
      return result;
    }),

    getHotel: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      const hotel = await getHotelById(input.id);
      const demo = demoHotels.find((item) => item.id === input.id);
      if (!hotel && demo) return demo;
      if (!hotel) throw new TRPCError({ code: "NOT_FOUND", message: "Hotel not found" });
      const hotelRooms = await listRoomsForHotel(hotel.id);
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
        lng: hotel.lng ? Number(hotel.lng) : -0.1870,
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
          availableRooms: room.totalRooms,
          amenities: normalizeJson(room.amenities),
          images: normalizeJson(room.images),
          liveSource: Boolean(hotel.isBillflowConnected) ? "billflow" as const : "staynest" as const,
        })),
      };
    }),

    liveAvailability: publicProcedure.input(z.object({
      hotelId: z.number().int().positive(),
      roomTypeId: z.number().int().positive(),
      checkInDate: dateInput,
      checkOutDate: dateInput,
    })).query(async ({ input }) => {
      const dbHotel = await getHotelById(input.hotelId);
      const demoHotel = demoHotels.find((item) => item.id === input.hotelId);
      const hotel = dbHotel ?? demoHotel;
      const demoRoom = demoHotel?.rooms.find((item) => item.id === input.roomTypeId);
      const dbRoom = dbHotel ? (await listRoomsForHotel(dbHotel.id)).find((item) => item.id === input.roomTypeId) : undefined;
      const room = demoRoom ?? dbRoom;
      const connected = Boolean(hotel && ("isBillflowConnected" in hotel ? hotel.isBillflowConnected : false));
      const live = await getLiveAvailability({
        businessId: dbHotel?.isBillflowConnected ? dbHotel.billflowBusinessId ?? `demo-business-${input.hotelId}` : demoHotel?.isBillflowConnected ? `demo-business-${input.hotelId}` : undefined,
        propertyId: dbHotel?.isBillflowConnected ? dbHotel.billflowPropertyId ?? `demo-property-${input.hotelId}` : demoHotel?.isBillflowConnected ? `demo-property-${input.hotelId}` : undefined,
        roomTypeId: String(input.roomTypeId),
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
      });
      return {
        availableRooms: live.availableRooms ?? (demoRoom?.availableRooms ?? dbRoom?.totalRooms ?? 0),
        livePricing: live.livePricing ?? (demoRoom ? { ghs: demoRoom.priceGhs, usd: demoRoom.priceUsd } : dbRoom ? { ghs: Number(dbRoom.priceGhs), usd: Number(dbRoom.priceUsd) } : null),
        source: live.source === "billflow" ? "billflow" as const : demoRoom?.liveSource ?? (connected ? "billflow" as const : "staynest" as const),
        checkedAt: new Date().toISOString(),
      };
    }),

    reviews: publicProcedure.input(z.object({ hotelId: z.number().int().positive() })).query(({ input }) => listReviewsForHotel(input.hotelId)),
  }),

  payments: router({
    initialize: protectedProcedure.input(z.object({
      email: z.string().email(),
      amount: z.number().positive(),
      currency: currencyInput,
      gateway: gatewayInput,
      hotelId: z.number().int().positive(),
      roomId: z.number().int().positive(),
      checkInDate: dateInput,
      checkOutDate: dateInput,
      guestsCount: z.number().int().min(1).max(12),
    })).mutation(async ({ ctx, input }) => {
      const reference = makeBookingReference();
      const result = await initializePayment({
        ...input,
        reference,
        callbackUrl: `${process.env.APP_URL ?? ""}/booking/complete?reference=${reference}`,
        metadata: { hotelId: input.hotelId, roomId: input.roomId, userId: ctx.user.id },
      });
      return { ...result, reference, commissionRate: STAYNEST_COMMISSION_RATE };
    }),
    verify: protectedProcedure.input(z.object({
      gateway: gatewayInput,
      reference: z.string().min(6),
      transactionId: z.string().optional(),
      expectedAmount: z.number().positive(),
      currency: currencyInput,
    })).mutation(({ input }) => verifyPayment(input)),
  }),

  bookings: router({
    createAfterVerifiedPayment: protectedProcedure.input(z.object({
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
    })).mutation(async ({ ctx, input }) => {
      const tokenValid = await verifyPaymentToken(input.verificationToken, { gateway: input.paymentGateway, reference: input.paymentReference, expectedAmount: input.totalAmount, currency: input.currency });
      if (!tokenValid) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Payment verification expired or did not match the booking total." });
      const { commission, hotelPayout } = calculateCommission(input.totalAmount);
      const dbHotel = await getHotelById(input.hotelId);
      const demoHotel = demoHotels.find((item) => item.id === input.hotelId);
      const hotel = dbHotel ?? demoHotel;
      const availableRooms = dbHotel ? await listRoomsForHotel(dbHotel.id) : demoHotel?.rooms ?? [];
      const room = availableRooms.find((item) => item.id === input.roomId);
      if (!hotel || !room) throw new TRPCError({ code: "NOT_FOUND", message: "Hotel or room not found" });
      const connected = dbHotel ? Boolean(dbHotel.isBillflowConnected) : Boolean(demoHotel?.isBillflowConnected);
      const billflowReservation = await createBillFlowReservation({
        businessId: connected ? dbHotel?.billflowBusinessId ?? `demo-business-${hotel.id}` : undefined,
        propertyId: connected ? dbHotel?.billflowPropertyId ?? `demo-property-${hotel.id}` : undefined,
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
        roomNumber: "roomNumber" in billflowReservation ? billflowReservation.roomNumber : null,
        billflowReservationId: billflowReservation.reservationId,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        numberOfNights: Math.max(1, Math.round((new Date(input.checkOutDate).getTime() - new Date(input.checkInDate).getTime()) / 86400000)),
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
        conflictDetails: conflict ? ("conflictDetails" in billflowReservation ? billflowReservation.conflictDetails ?? "BillFlow reported a booking conflict. Hotel review is required." : "BillFlow reported a booking conflict. Hotel review is required.") : null,
      });
      await recordBookingFinance({ bookingId: booking.id, hotelId: input.hotelId, currency: input.currency, grossAmount: input.totalAmount, commissionRate: STAYNEST_COMMISSION_RATE, commissionAmount: commission, hotelPayoutAmount: hotelPayout });
      await sendBookingEmail({ to: input.guestEmail, guestName: input.guestName, bookingReference: input.bookingReference, hotelName: hotel.name, roomName: room.name, checkInDate: input.checkInDate, checkOutDate: input.checkOutDate, total: input.totalAmount, currency: input.currency });
      return { ...booking, conflict, conflictDetails: conflict && "conflictDetails" in billflowReservation ? billflowReservation.conflictDetails : null };
    }),

    mine: protectedProcedure.query(({ ctx }) => getBookingsForUser(ctx.user.id)),
    cancel: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const booking = await getBookingForUser(input.id, ctx.user.id);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
      if (booking.bookingStatus === "cancelled" || booking.paymentStatus === "refunded") return { success: true, source: "already-cancelled" as const };
      const hotel = await getHotelById(booking.hotelId);
      const external = await cancelBillFlowReservation({ businessId: hotel?.billflowBusinessId ?? undefined, propertyId: hotel?.billflowPropertyId ?? undefined, reservationId: booking.billflowReservationId ?? booking.paymentReference ?? booking.bookingReference, bookingReference: booking.bookingReference });
      if (!external.cancelled) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The property system did not acknowledge this cancellation. No local cancellation was applied." });
      const success = await cancelBookingForUser(input.id, ctx.user.id);
      return { success, source: external.source };
    }),
    addReview: protectedProcedure.input(z.object({
      hotelId: z.number().int().positive(),
      bookingId: z.number().int().positive(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().max(1000).optional(),
    })).mutation(({ ctx, input }) => addReview({ ...input, userId: ctx.user.id, guestName: ctx.user.name ?? "Guest" })),
  }),

  hotel: router({
    mine: protectedProcedure.query(({ ctx }) => listHotelsForOwner(ctx.user.id)),
    rooms: protectedProcedure.input(z.object({ hotelId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel || hotel.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You do not manage this property." });
      return listRoomsForHotel(input.hotelId);
    }),
    bookings: protectedProcedure.input(z.object({ hotelId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel || hotel.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You do not manage this property." });
      return listBookingsForHotel(input.hotelId);
    }),
    conflicts: protectedProcedure.input(z.object({ hotelId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel || hotel.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You do not manage this property." });
      return listConflictBookingsForHotel(input.hotelId);
    }),
    createRoom: protectedProcedure.input(z.object({
      hotelId: z.number().int().positive(), name: z.string().min(2).max(255), roomType: z.string().min(2).max(128), description: z.string().max(2000).optional(), capacity: z.number().int().min(1).max(20), priceGhs: z.number().nonnegative(), priceUsd: z.number().nonnegative(), totalRooms: z.number().int().min(0).max(1000), amenities: z.array(z.string().max(80)).max(30).default([]), images: z.array(z.string().url()).max(20).default([]),
    })).mutation(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel || hotel.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You do not manage this property." });
      return createRoomForHotel({ ...input, priceGhs: input.priceGhs.toFixed(2), priceUsd: input.priceUsd.toFixed(2), description: input.description ?? null });
    }),
    updateRoom: protectedProcedure.input(z.object({ id: z.number().int().positive(), hotelId: z.number().int().positive(), name: z.string().min(2).max(255).optional(), priceGhs: z.number().nonnegative().optional(), priceUsd: z.number().nonnegative().optional(), totalRooms: z.number().int().min(0).max(1000).optional(), capacity: z.number().int().min(1).max(20).optional() })).mutation(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel || hotel.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You do not manage this property." });
      const { id, hotelId, name, priceGhs, priceUsd, totalRooms, capacity } = input;
      const values: Partial<InsertRoom> = { name, totalRooms, capacity };
      if (priceGhs !== undefined) values.priceGhs = priceGhs.toFixed(2);
      if (priceUsd !== undefined) values.priceUsd = priceUsd.toFixed(2);
      return updateRoomForHotel({ id, hotelId, values });
    }),
    updateBookingStatus: protectedProcedure.input(z.object({ hotelId: z.number().int().positive(), id: z.number().int().positive(), bookingStatus: z.enum(["booked", "checked_in", "checked_out", "cancelled", "conflict_flagged"]), conflictDetails: z.string().max(2000).nullable().optional() })).mutation(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel || hotel.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You do not manage this property." });
      return updateBookingStatusForHotel(input);
    }),
    deleteBlockedDate: protectedProcedure.input(z.object({ id: z.number().int().positive(), hotelId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel || hotel.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You do not manage this property." });
      return deleteBlockedDateForHotel(input.id, input.hotelId);
    }),
    blockedDates: protectedProcedure.input(z.object({ hotelId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel || hotel.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You do not manage this property." });
      return listBlockedDates(input.hotelId);
    }),
    blockDates: protectedProcedure.input(z.object({
      hotelId: z.number().int().positive(),
      roomId: z.number().int().positive().optional(),
      startDate: dateInput,
      endDate: dateInput,
      reason: z.string().max(255).optional(),
    })).mutation(async ({ ctx, input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel || hotel.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You do not manage this property." });
      return blockDates(input);
    }),
    publishToBillFlow: protectedProcedure.input(z.object({ hotelId: z.number().int().positive() })).mutation(async ({ input }) => {
      const hotel = await getHotelById(input.hotelId);
      if (!hotel) throw new TRPCError({ code: "NOT_FOUND", message: "Hotel not found" });
      return { success: true, message: "Publish contract queued; add BillFlow credentials to complete the live sync.", hotelId: hotel.id };
    }),
  }),

  admin: router({
    hotels: adminProcedure.query(() => listAllHotels()),
    bookings: adminProcedure.query(() => getAllBookings()),
    payouts: adminProcedure.query(() => listPayouts()),
    refundBooking: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => refundBookingForAdmin(input.id)),
    approveHotel: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["approved", "rejected", "pending"]) })).mutation(({ input }) => updateHotelApproval(input.id, input.status)),
    summary: adminProcedure.query(async () => {
      const allHotels = await listAllHotels();
      const allBookings = await getAllBookings();
      const successful = allBookings.filter((booking) => booking.paymentStatus === "success");
      const gross = successful.reduce((sum, booking) => sum + Number(booking.totalAmount), 0);
      const commission = successful.reduce((sum, booking) => sum + Number(booking.commissionAmount), 0);
      return { hotelCount: allHotels.length || demoHotels.length, bookingCount: allBookings.length, gross, commission, conflictCount: allBookings.filter((booking) => booking.bookingStatus === "conflict_flagged").length };
    }),
  }),
});

export type AppRouter = typeof appRouter;
