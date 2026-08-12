# StayNest Integration Notes

## Payment verification

Paystack's current Transaction API documents server-side initialization at `POST https://api.paystack.co/transaction/initialize` with a bearer secret and JSON fields including customer email, amount in currency subunits, optional currency, reference, callback URL, channels, and metadata. The response provides an authorization URL. StayNest must call Paystack's verify transaction endpoint after the customer returns and confirm a successful status, matching reference, currency, and expected amount before creating a confirmed booking.

Reference: [Paystack Transaction API](https://paystack.com/docs/api/transaction/)

Flutterwave Standard documents a server-side create-payment request that returns a hosted checkout link. The customer is redirected back with `status`, `tx_ref`, and `transaction_id`; Flutterwave also recommends webhook delivery when enabled. StayNest must verify the final transaction on the server and compare successful status, reference, amount, and currency before issuing confirmation.

Reference: [Flutterwave Standard](https://developer.flutterwave.com/v3.0/docs/flutterwave-standard-1)

## BillFlow source-of-truth contract

The existing BillFlow repository contains hotel data structures and helpers in `lib/db.ts`, including room types, reservations, rate plans, date-overlap availability checks, and `createExternalChannelReservation`. The StayNest integration should treat BillFlow as authoritative for connected hotels and use explicit endpoints for publishing inventory, querying live rates and availability, creating reservations atomically, cancelling reservations, and returning conflict details. StayNest should not maintain a second sellable availability ledger for BillFlow-connected inventory.

## Maps

The project has a pre-built `MapView` component and a managed Google Maps proxy. No user-supplied Google Maps API key is required. Property pages should use the frontend map component and initialize markers, nearby places, and directions in its `onMapReady` callback.

Reference: `/home/ubuntu/skills/webdev-maps-integration/SKILL.md`

## Storage and scheduled reminders

Hotel and room photos should be uploaded via the server-side S3 helper and only the returned storage URL/key should be stored in the database. Scheduled reminders must use `/api/scheduled/*` Heartbeat handlers; in-process timers and `setInterval` are forbidden. The reminder handler should be idempotent and only be scheduled after a deployment is available.

References: `/home/ubuntu/skills/webdev-file-storage/SKILL.md`, `/home/ubuntu/skills/webdev-periodic-updates/SKILL.md`
