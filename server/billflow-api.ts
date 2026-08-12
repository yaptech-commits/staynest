import type { Express, Request, Response } from "express";
import { getDb } from "./db";
import { hotels, rooms } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { recordAvailabilityEvent, updateBookingFromBillFlow } from "./db";

function authorized(req: Request) {
  const secret = process.env.BILLFLOW_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.header("x-billflow-signature") === secret || req.header("authorization") === `Bearer ${secret}`;
}

function rejectIfUnauthorized(req: Request, res: Response) {
  if (authorized(req)) return false;
  res.status(401).json({ ok: false, error: "BillFlow integration signature is invalid or not configured." });
  return true;
}

export function registerBillFlowRoutes(app: Express) {
  app.get("/api/integrations/billflow/health", (req, res) => {
    if (rejectIfUnauthorized(req, res)) return;
    res.json({ ok: true, service: "staynest-billflow-integration", availabilitySource: "billflow", commissionRate: 0.15 });
  });

  app.post("/api/integrations/billflow/publish", async (req, res) => {
    if (rejectIfUnauthorized(req, res)) return;
    try {
      const { ownerId = 0, businessId, propertyId, hotel, roomTypes } = req.body ?? {};
      if (!businessId || !propertyId || !hotel?.name || !hotel?.location || !Array.isArray(roomTypes)) {
        return res.status(400).json({ ok: false, error: "businessId, propertyId, hotel, and roomTypes are required." });
      }
      const db = await getDb();
      if (!db) return res.json({ ok: true, mode: "contract-only", message: "StayNest received the publish payload. Database is not available in this environment." });
      const result = await db.insert(hotels).values({
        ownerId: Number(ownerId),
        name: String(hotel.name),
        slug: String(hotel.slug ?? `${String(hotel.name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${propertyId}`),
        description: String(hotel.description ?? ""),
        location: String(hotel.location),
        address: String(hotel.address ?? ""),
        lat: hotel.lat ? String(hotel.lat) : null,
        lng: hotel.lng ? String(hotel.lng) : null,
        images: Array.isArray(hotel.images) ? hotel.images : [],
        amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
        rating: null,
        reviewCount: 0,
        isBillflowConnected: 1,
        billflowBusinessId: String(businessId),
        billflowPropertyId: String(propertyId),
        approvalStatus: "pending",
      });
      const localHotelId = Number(result[0].insertId);
      for (const room of roomTypes) {
        await db.insert(rooms).values({
          hotelId: localHotelId,
          name: String(room.name ?? room.roomType ?? "Room"),
          roomType: String(room.roomType ?? room.id ?? "room"),
          description: String(room.description ?? ""),
          capacity: Number(room.capacity ?? 2),
          priceGhs: String(room.priceGhs ?? 0),
          priceUsd: String(room.priceUsd ?? 0),
          totalRooms: Number(room.totalRooms ?? 0),
          amenities: Array.isArray(room.amenities) ? room.amenities : [],
          images: Array.isArray(room.images) ? room.images : [],
        });
      }
      return res.json({ ok: true, localHotelId, approvalStatus: "pending", message: "Property received and queued for platform approval." });
    } catch (error) {
      console.error("[BillFlow] publish failed", error);
      return res.status(500).json({ ok: false, error: "Unable to publish this BillFlow property." });
    }
  });

  app.post("/api/uploads/hotel-photo", async (req, res) => {
    if (rejectIfUnauthorized(req, res)) return;
    try {
      const { fileName, contentType, dataBase64, scope = "hotel" } = req.body ?? {};
      if (!fileName || !contentType || !dataBase64) return res.status(400).json({ ok: false, error: "fileName, contentType, and dataBase64 are required." });
      const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, "-");
      const result = await storagePut(`staynest/${String(scope)}/${safeName}`, Buffer.from(String(dataBase64).replace(/^data:[^;]+;base64,/, ""), "base64"), String(contentType));
      return res.json({ ok: true, ...result });
    } catch (error) {
      console.error("[Storage] hotel photo upload failed", error);
      return res.status(500).json({ ok: false, error: "Unable to upload hotel photo." });
    }
  });

  app.post("/api/integrations/billflow/events", async (req, res) => {
    if (rejectIfUnauthorized(req, res)) return;
    const { eventType, businessId, propertyId, roomId, checkInDate, checkOutDate, bookingReference, details, payload } = req.body ?? {};
    if (!eventType || !propertyId || !checkInDate || !checkOutDate) return res.status(400).json({ ok: false, error: "eventType, propertyId, checkInDate, and checkOutDate are required." });
    const conflict = eventType === "availability.conflict" || eventType === "reservation.conflict";
    const cancellation = eventType === "reservation.cancelled";
    const event = await recordAvailabilityEvent({ hotelId: Number(propertyId), roomId: Number(roomId ?? 0), source: "billflow", eventType: String(eventType), checkInDate: String(checkInDate), checkOutDate: String(checkOutDate), externalReference: bookingReference ? String(bookingReference) : null, payload: payload ?? { businessId, propertyId, details }, conflictFlagged: conflict ? 1 : 0 });
    const bookingUpdated = bookingReference ? await updateBookingFromBillFlow({ bookingReference: String(bookingReference), bookingStatus: conflict ? "conflict_flagged" : cancellation ? "cancelled" : "booked", conflictDetails: conflict ? String(details ?? "BillFlow reported a conflict. Hotel review is required.") : null }) : false;
    if (conflict && bookingReference) await notifyOwner({ title: "StayNest booking conflict detected", content: `BillFlow event ${eventType} for ${bookingReference}: ${String(details ?? "Review required.")}` });
    return res.json({ ok: true, eventId: event.id, bookingUpdated, conflictFlagged: conflict, cancellationApplied: cancellation });
  });

  app.post("/api/integrations/billflow/conflict", async (req, res) => {
    if (rejectIfUnauthorized(req, res)) return;
    const { propertyId, bookingReference, details } = req.body ?? {};
    if (!propertyId || !bookingReference || !details) return res.status(400).json({ ok: false, error: "propertyId, bookingReference, and details are required." });
    const delivered = await notifyOwner({
      title: "StayNest booking conflict detected",
      content: `BillFlow reported a conflict for property ${propertyId}. Booking ${bookingReference}: ${details}. Review the reservation in the hotel workspace; StayNest did not silently resolve it.`,
    });
    return res.json({ ok: true, conflictFlagged: true, ownerAlertDelivered: delivered });
  });
}
