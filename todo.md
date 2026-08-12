# StayNest TODO

- [x] Database Schema Setup (Hotels, Rooms, Rates, Availability, Bookings, Reviews, Commissions, Payouts)
- [x] BillFlow Integration API (External synchronization, live rate & availability check, two-way sync)
- [x] Guest-Facing Search & Filters (Location, dates, guests, price range, ratings, list/grid view)
- [x] Hotel Property Page (Photos, description, amenities, live room pricing, Google Maps integration)
- [x] Step-by-Step Booking Flow (Room selection, guest details, Paystack/Flutterwave payment, confirmation)
- [x] Guest Accounts (Sign up/login, booking history, view/cancel upcoming bookings)
- [x] Non-BillFlow Hotel Dashboard (Manual room/rate/availability setup, booking management, date blocking)
- [x] Platform Admin Dashboard (Hotel onboarding/approval, booking oversight, revenue/commission tracking)
- [x] Commission & Payouts Engine (15% flat commission calculation, payout tracking, cancellation/refund policy)
- [x] Conflict Detection & Alerting (Double-booking conflict flagging for hotel review)
- [x] Notifications & S3 Storage (Email/in-app notifications, S3-backed photo uploads)
- [x] Automated Unit Tests (Vitest specs for availability sync, booking creation, commission calculation)

- [x] Add dedicated rate plans, availability event, commission ledger, payout, and cancellation policy models.
- [x] Complete BillFlow reservation create/cancel and inbound booking/cancellation event contracts.
- [x] Add price-range and rating filters plus a working list/grid toggle.
- [x] Render live BillFlow pricing in room cards and add nearby landmarks to the map experience.
- [x] Add verified payment return/webhook handling, confirmation page, and email trigger after success.
- [x] Build manual hotel room/rate/availability CRUD and booking confirm/reject controls.
- [x] Add admin booking oversight and payout/refund management views.
- [x] Add hotel-facing conflict inbox and explicit resolution workflow.
- [x] Expand automated tests for live availability and verified booking creation.

- [x] Replace StayNest's temporary branding with the user-provided square emblem and horizontal wordmark across header, footer, favicon, and app metadata.

- [x] Create a new private GitHub repository for StayNest and push the repository code.
- [x] Prepare Vercel deployment configuration and deploy StayNest.
- [x] Prepare Firebase hosting configuration and deploy StayNest to Firebase.

- [x] Verify that `yaptech-commits/staynest` is private and record the repository visibility.
- [x] Verify the full-stack Express/tRPC API, authentication, and booking flows on the Vercel deployment; add runtime configuration if needed.
- [x] Decide and configure a Firebase backend deployment path for Express/tRPC, BillFlow, payments, auth, and booking APIs; static Firebase Hosting alone is not sufficient.

- [x] Configure Vercel to host the full StayNest application (frontend + Express/tRPC backend) and connect Firebase database services as the persistent datastore.

- [x] Assign and verify the Vercel hostname `staynest.vercel.app` for the StayNest project.

- [x] Add a dedicated StayNest onboarding page with guest and hotel-partner registration, validation, terms acceptance, and role-based post-sign-up routing.

- [x] Fix mobile onboarding header spacing so the wordmark and sign-in link remain clearly separated at narrow widths.

- [x] Fix the existing booking-reference generator so it matches the documented alphanumeric format and restores the full test suite.

- [x] Consume the stored onboarding intent after OAuth and route guests to `/account` and hotel partners to `/hotel-dashboard`.
- [x] Apply onboarding profile details after authentication and cover post-sign-up routing with an automated test.

- [x] Add automated coverage for OAuth onboarding-intent consumption, mutation invocation, and role-based redirect behavior.
- [x] Add server-side coverage for onboarding profile upsert and hotel_owner role promotion without inserting test records into the production database.

- [x] Add a mocked-database server test for `saveOnboardingProfile()` covering guest saves, partner promotion, and repeated-user upsert behavior without real database writes.
