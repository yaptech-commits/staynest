import { customAlphabet, nanoid } from "nanoid";
import { SignJWT, jwtVerify } from "jose";

export const STAYNEST_COMMISSION_RATE = 0.15;
export type Currency = "GHS" | "USD";
export type PaymentGateway = "paystack" | "flutterwave";

export function calculateCommission(total: number) {
  const commission = Number((total * STAYNEST_COMMISSION_RATE).toFixed(2));
  return { commission, hotelPayout: Number((total - commission).toFixed(2)) };
}

const bookingReferenceToken = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  8
);

export function makeBookingReference() {
  return `SN-${new Date().getFullYear()}-${bookingReferenceToken()}`;
}

function billflowConfigured() {
  return Boolean(
    process.env.BILLFLOW_API_BASE_URL && process.env.BILLFLOW_API_KEY
  );
}

async function billflowRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const baseUrl = process.env.BILLFLOW_API_BASE_URL;
  const apiKey = process.env.BILLFLOW_API_KEY;
  if (!baseUrl || !apiKey)
    throw new Error("BillFlow integration is not configured yet");
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok)
    throw new Error(`BillFlow request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

export async function getLiveAvailability(params: {
  businessId?: string;
  propertyId?: string;
  roomTypeId?: string;
  checkInDate: string;
  checkOutDate: string;
}) {
  if (!billflowConfigured())
    return {
      source: "staynest" as const,
      availableRooms: null,
      livePricing: null,
    };
  return billflowRequest<{
    source: "billflow";
    availableRooms: number;
    livePricing?: { ghs?: number; usd?: number };
  }>("/api/staynest/availability", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function publishHotelToBillFlow(payload: Record<string, unknown>) {
  return billflowRequest<{ success: boolean; propertyId?: string }>(
    "/api/staynest/publish",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function createBillFlowReservation(
  payload: Record<string, unknown>
) {
  if (!billflowConfigured())
    return {
      source: "staynest" as const,
      reservationId: `staynest-${nanoid(10)}`,
      conflict: false,
    };
  return billflowRequest<{
    source: "billflow";
    reservationId: string;
    roomNumber?: string;
    conflict?: boolean;
    conflictDetails?: string;
  }>("/api/staynest/reservations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function initializePayment(input: {
  gateway: PaymentGateway;
  email: string;
  amount: number;
  currency: Currency;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  if (input.gateway === "paystack") {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return { configured: false, checkoutUrl: null };
    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: input.email,
          amount: Math.round(input.amount * 100),
          currency: input.currency,
          reference: input.reference,
          callback_url: input.callbackUrl,
          metadata: JSON.stringify(input.metadata),
        }),
      }
    );
    const body = (await response.json()) as {
      status: boolean;
      data?: { authorization_url?: string };
    };
    if (!response.ok || !body.status)
      throw new Error("Paystack could not initialize this payment");
    return {
      configured: true,
      checkoutUrl: body.data?.authorization_url ?? null,
    };
  }

  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secret) return { configured: false, checkoutUrl: null };
  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: input.reference,
      amount: input.amount,
      currency: input.currency,
      redirect_url: input.callbackUrl,
      customer: { email: input.email },
      meta: input.metadata,
    }),
  });
  const body = (await response.json()) as {
    status: string;
    data?: { link?: string };
  };
  if (!response.ok || body.status !== "success")
    throw new Error("Flutterwave could not initialize this payment");
  return { configured: true, checkoutUrl: body.data?.link ?? null };
}

function paymentTokenKey() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? "staynest-development-secret"
  );
}

async function issuePaymentVerificationToken(input: {
  gateway: PaymentGateway;
  reference: string;
  expectedAmount: number;
  currency: Currency;
}) {
  return new SignJWT({
    gateway: input.gateway,
    reference: input.reference,
    amount: input.expectedAmount,
    currency: input.currency,
    verified: true,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(paymentTokenKey());
}

export async function verifyPaymentToken(
  token: string,
  expected: {
    gateway: PaymentGateway;
    reference: string;
    expectedAmount: number;
    currency: Currency;
  }
) {
  try {
    const { payload } = await jwtVerify(token, paymentTokenKey());
    return Boolean(
      payload.verified === true &&
        payload.gateway === expected.gateway &&
        payload.reference === expected.reference &&
        payload.currency === expected.currency &&
        Number(payload.amount) === expected.expectedAmount
    );
  } catch {
    return false;
  }
}

export async function verifyPayment(input: {
  gateway: PaymentGateway;
  reference: string;
  transactionId?: string;
  expectedAmount: number;
  currency: Currency;
}) {
  if (input.gateway === "paystack") {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return { configured: false, verified: false };
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(input.reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } }
    );
    const body = (await response.json()) as {
      status: boolean;
      data?: {
        status?: string;
        amount?: number;
        currency?: string;
        reference?: string;
      };
    };
    const data = body.data;
    const verified = Boolean(
      response.ok &&
        body.status &&
        data?.status === "success" &&
        data.reference === input.reference &&
        data.currency === input.currency &&
        Number(data.amount) === Math.round(input.expectedAmount * 100)
    );
    return {
      configured: true,
      verified,
      verificationToken: verified
        ? await issuePaymentVerificationToken(input)
        : null,
    };
  }
  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secret || !input.transactionId)
    return { configured: false, verified: false };
  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(input.transactionId)}/verify`,
    { headers: { Authorization: `Bearer ${secret}` } }
  );
  const body = (await response.json()) as {
    status: string;
    data?: {
      status?: string;
      amount?: number;
      currency?: string;
      tx_ref?: string;
    };
  };
  const data = body.data;
  const verified = Boolean(
    response.ok &&
      body.status === "success" &&
      data?.status === "successful" &&
      data.tx_ref === input.reference &&
      data.currency === input.currency &&
      Number(data.amount) === input.expectedAmount
  );
  return {
    configured: true,
    verified,
    verificationToken: verified
      ? await issuePaymentVerificationToken(input)
      : null,
  };
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'\"]/g,
    character =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ] ?? character
  );
}

export function buildWelcomeVerificationUrl(
  token: string,
  baseUrl = process.env.APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
) {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/$/, "");
  return normalizedBaseUrl
    ? `${normalizedBaseUrl}/verify-email?token=${encodeURIComponent(token)}`
    : null;
}

export async function sendWelcomeEmail(input: {
  to: string;
  fullName: string;
  role: "guest" | "partner";
  verificationToken: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { configured: false, sent: false };
  const verifyUrl = buildWelcomeVerificationUrl(input.verificationToken);
  if (!verifyUrl) return { configured: false, sent: false };

  const greeting =
    input.role === "partner"
      ? "Your partner workspace is ready to begin."
      : "Your next considered stay is closer than ever.";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "StayNest <hello@staynest.example>",
      to: [input.to],
      subject: "Welcome to StayNest · Verify your email",
      html: `<div style="font-family:Arial,sans-serif;color:#183a31;line-height:1.6;max-width:560px"><p style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#b18143;font-weight:700">Welcome to StayNest</p><h1 style="font-family:Georgia,serif;font-size:34px;line-height:1.05">Make room for a better arrival.</h1><p>Hi ${escapeHtml(input.fullName)}, ${greeting}</p><p>Please verify your email to keep your account secure and receive important booking and partner updates.</p><p><a href="${verifyUrl}" style="display:inline-block;background:#183a31;color:#fff;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:700">Verify email</a></p><p style="font-size:12px;color:#718078">This link expires in 24 hours. If you did not create a StayNest account, you can ignore this message.</p></div>`,
    }),
  });
  return { configured: true, sent: response.ok };
}

export async function sendBookingEmail(input: {
  to: string;
  guestName: string;
  bookingReference: string;
  hotelName: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  total: number;
  currency: Currency;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { configured: false, sent: false };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "StayNest <bookings@staynest.example>",
      to: [input.to],
      subject: `StayNest booking confirmed · ${input.bookingReference}`,
      html: `<div style="font-family:Arial,sans-serif;color:#183a31;line-height:1.6"><h1 style="font-family:Georgia,serif">Your stay is confirmed.</h1><p>Hi ${input.guestName}, your reservation at <strong>${input.hotelName}</strong> is confirmed.</p><p><strong>${input.roomName}</strong><br>${input.checkInDate} → ${input.checkOutDate}<br>Total: ${input.currency} ${input.total.toFixed(2)}</p><p>Your booking reference is <strong>${input.bookingReference}</strong>.</p></div>`,
    }),
  });
  return { configured: true, sent: response.ok };
}

export async function cancelBillFlowReservation(payload: {
  businessId?: string;
  propertyId?: string;
  reservationId: string;
  bookingReference: string;
}) {
  if (!billflowConfigured())
    return { source: "staynest" as const, cancelled: true };
  return billflowRequest<{ source: "billflow"; cancelled: boolean }>(
    "/api/staynest/reservations/cancel",
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function sendCheckInReminderEmail(input: {
  to: string;
  guestName: string;
  bookingReference: string;
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { configured: false, sent: false };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "StayNest <reminders@staynest.example>",
      to: [input.to],
      subject: `Upcoming check-in reminder · ${input.hotelName}`,
      html: `<div style="font-family:Arial,sans-serif;color:#183a31;line-height:1.6"><h1 style="font-family:Georgia,serif">Your stay is coming up soon.</h1><p>Hi ${input.guestName}, we're looking forward to welcoming you at <strong>${input.hotelName}</strong> on <strong>${input.checkInDate}</strong>.</p><p>Booking Reference: <strong>${input.bookingReference}</strong><br>Check-out: ${input.checkOutDate}</p><p>Have a wonderful journey!</p></div>`,
    }),
  });
  return { configured: true, sent: response.ok };
}

export async function sendSmsReminder(input: {
  phone: string;
  message: string;
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { configured: false, sent: false };
  }

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
      "base64"
    );
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: input.phone,
          From: fromNumber,
          Body: input.message,
        }),
      }
    );
    return { configured: true, sent: res.ok };
  } catch {
    return { configured: true, sent: false };
  }
}
