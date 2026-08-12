import { nanoid } from "nanoid";
import { SignJWT, jwtVerify } from "jose";

export const STAYNEST_COMMISSION_RATE = 0.15;
export type Currency = "GHS" | "USD";
export type PaymentGateway = "paystack" | "flutterwave";

export type StayNestRoom = {
  id: number;
  hotelId: number;
  name: string;
  roomType: string;
  description: string;
  capacity: number;
  priceGhs: number;
  priceUsd: number;
  totalRooms: number;
  amenities: string[];
  images: string[];
  availableRooms: number;
  liveSource: "billflow" | "staynest";
};

export type StayNestHotel = {
  id: number;
  name: string;
  slug: string;
  location: string;
  address: string;
  description: string;
  images: string[];
  amenities: string[];
  rating: number | null;
  reviewCount: number;
  isBillflowConnected: boolean;
  approvalStatus: "pending" | "approved" | "rejected";
  lat: number;
  lng: number;
  rooms: StayNestRoom[];
};

const image = {
  city: "/manus-storage/accra-city-hotel_5a17ca62.jpg",
  room: "/manus-storage/boutique-room_db8a7e7f.jpg",
  coast: "/manus-storage/coastal-resort_4b029dc9.jpg",
};

export const demoHotels: StayNestHotel[] = [
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
        liveSource: "billflow",
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
        liveSource: "billflow",
      },
    ],
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
        liveSource: "staynest",
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
        liveSource: "staynest",
      },
    ],
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
        liveSource: "billflow",
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
        liveSource: "billflow",
      },
    ],
  },
];

export function calculateCommission(total: number) {
  const commission = Number((total * STAYNEST_COMMISSION_RATE).toFixed(2));
  return { commission, hotelPayout: Number((total - commission).toFixed(2)) };
}

export function makeBookingReference() {
  return `SN-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`;
}

function billflowConfigured() {
  return Boolean(process.env.BILLFLOW_API_BASE_URL && process.env.BILLFLOW_API_KEY);
}

async function billflowRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = process.env.BILLFLOW_API_BASE_URL;
  const apiKey = process.env.BILLFLOW_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("BillFlow integration is not configured yet");
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`BillFlow request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

export async function getLiveAvailability(params: { businessId?: string; propertyId?: string; roomTypeId?: string; checkInDate: string; checkOutDate: string }) {
  if (!billflowConfigured()) return { source: "demo" as const, availableRooms: null, livePricing: null };
  return billflowRequest<{ source: "billflow"; availableRooms: number; livePricing?: { ghs?: number; usd?: number } }>("/api/staynest/availability", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function publishHotelToBillFlow(payload: Record<string, unknown>) {
  return billflowRequest<{ success: boolean; propertyId?: string }>("/api/staynest/publish", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createBillFlowReservation(payload: Record<string, unknown>) {
  if (!billflowConfigured()) return { source: "demo" as const, reservationId: `demo-${nanoid(10)}`, conflict: false };
  return billflowRequest<{ source: "billflow"; reservationId: string; roomNumber?: string; conflict?: boolean; conflictDetails?: string }>("/api/staynest/reservations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function initializePayment(input: { gateway: PaymentGateway; email: string; amount: number; currency: Currency; reference: string; callbackUrl: string; metadata: Record<string, unknown> }) {
  if (input.gateway === "paystack") {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return { configured: false, checkoutUrl: null };
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: input.email, amount: Math.round(input.amount * 100), currency: input.currency, reference: input.reference, callback_url: input.callbackUrl, metadata: JSON.stringify(input.metadata) }),
    });
    const body = await response.json() as { status: boolean; data?: { authorization_url?: string } };
    if (!response.ok || !body.status) throw new Error("Paystack could not initialize this payment");
    return { configured: true, checkoutUrl: body.data?.authorization_url ?? null };
  }

  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secret) return { configured: false, checkoutUrl: null };
  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ tx_ref: input.reference, amount: input.amount, currency: input.currency, redirect_url: input.callbackUrl, customer: { email: input.email }, meta: input.metadata }),
  });
  const body = await response.json() as { status: string; data?: { link?: string } };
  if (!response.ok || body.status !== "success") throw new Error("Flutterwave could not initialize this payment");
  return { configured: true, checkoutUrl: body.data?.link ?? null };
}

function paymentTokenKey() { return new TextEncoder().encode(process.env.JWT_SECRET ?? "staynest-development-secret"); }

async function issuePaymentVerificationToken(input: { gateway: PaymentGateway; reference: string; expectedAmount: number; currency: Currency }) {
  return new SignJWT({ gateway: input.gateway, reference: input.reference, amount: input.expectedAmount, currency: input.currency, verified: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(paymentTokenKey());
}

export async function verifyPaymentToken(token: string, expected: { gateway: PaymentGateway; reference: string; expectedAmount: number; currency: Currency }) {
  try {
    const { payload } = await jwtVerify(token, paymentTokenKey());
    return Boolean(payload.verified === true && payload.gateway === expected.gateway && payload.reference === expected.reference && payload.currency === expected.currency && Number(payload.amount) === expected.expectedAmount);
  } catch {
    return false;
  }
}

export async function verifyPayment(input: { gateway: PaymentGateway; reference: string; transactionId?: string; expectedAmount: number; currency: Currency }) {
  if (input.gateway === "paystack") {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return { configured: false, verified: false };
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(input.reference)}`, { headers: { Authorization: `Bearer ${secret}` } });
    const body = await response.json() as { status: boolean; data?: { status?: string; amount?: number; currency?: string; reference?: string } };
    const data = body.data;
    const verified = Boolean(response.ok && body.status && data?.status === "success" && data.reference === input.reference && data.currency === input.currency && Number(data.amount) === Math.round(input.expectedAmount * 100));
    return { configured: true, verified, verificationToken: verified ? await issuePaymentVerificationToken(input) : null };
  }
  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secret || !input.transactionId) return { configured: false, verified: false };
  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(input.transactionId)}/verify`, { headers: { Authorization: `Bearer ${secret}` } });
  const body = await response.json() as { status: string; data?: { status?: string; amount?: number; currency?: string; tx_ref?: string } };
  const data = body.data;
  const verified = Boolean(response.ok && body.status === "success" && data?.status === "successful" && data.tx_ref === input.reference && data.currency === input.currency && Number(data.amount) === input.expectedAmount);
  return { configured: true, verified, verificationToken: verified ? await issuePaymentVerificationToken(input) : null };
}

export async function sendBookingEmail(input: { to: string; guestName: string; bookingReference: string; hotelName: string; roomName: string; checkInDate: string; checkOutDate: string; total: number; currency: Currency }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { configured: false, sent: false };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "StayNest <bookings@staynest.example>",
      to: [input.to],
      subject: `StayNest booking confirmed · ${input.bookingReference}`,
      html: `<div style="font-family:Arial,sans-serif;color:#183a31;line-height:1.6"><h1 style="font-family:Georgia,serif">Your stay is confirmed.</h1><p>Hi ${input.guestName}, your reservation at <strong>${input.hotelName}</strong> is confirmed.</p><p><strong>${input.roomName}</strong><br>${input.checkInDate} → ${input.checkOutDate}<br>Total: ${input.currency} ${input.total.toFixed(2)}</p><p>Your booking reference is <strong>${input.bookingReference}</strong>.</p></div>`,
    }),
  });
  return { configured: true, sent: response.ok };
}

export async function cancelBillFlowReservation(payload: { businessId?: string; propertyId?: string; reservationId: string; bookingReference: string }) {
  if (!billflowConfigured()) return { source: "demo" as const, cancelled: true };
  return billflowRequest<{ source: "billflow"; cancelled: boolean }>("/api/staynest/reservations/cancel", { method: "POST", body: JSON.stringify(payload) });
}
