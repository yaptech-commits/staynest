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

- [x] Add hotel-partner completion banner and first-property setup wizard in the partner dashboard.
- [x] Add email verification state and welcome-email notification support.
- [x] Add admin notifications for new hotel-partner onboarding applications.

- [x] Update onboarding persistence assertions to cover verification state without comparing generated token values exactly.

- [x] Update partner post-onboarding routing to `/hotel-dashboard?onboarding=complete` and verify the banner through the real flow.
- [x] Expose email-verification status in account/partner UI, add a resend-verification action, and require a configured production base URL for welcome links.
- [x] Add tests for completion-banner routing and verification-link generation.

- [x] Apply the onboarding completion query parameter even when post-auth navigation is already on `/hotel-dashboard` or `/account`, and test the same-path redirect behavior.
- [x] Show verification status and resend controls in the partner no-property wizard state.
- [x] Surface email configuration or delivery failures instead of reporting verification email success when delivery is unavailable.
- [x] Add automated coverage for same-path completion-banner routing and the no-property verification state contract.

- [x] Add production email provider configuration support and delivery diagnostics.
- [x] Build partner payout-account capture (bank transfer and mobile money) in the hotel dashboard with admin visibility.
- [x] Add SMS notification provider contracts and check-in reminder preferences for guests and hotel partners.

- [x] Commit all current StayNest implementations and push the complete repository to GitHub (`yaptech-commits/staynest`).

- [x] Add explicit non-BillFlow property and room-type management (create/edit property, add/edit rooms, set nightly rates and capacity).
- [x] Build a comprehensive non-BillFlow owner dashboard showing all rooms, current rates, available inventory, upcoming bookings, conflict alerts, and property details.
- [x] Add automated Vitest coverage for non-BillFlow property creation, room inventory management, and dashboard availability checks.

- [x] Add automated coverage for non-BillFlow availability math, owner-scoped property updates, and manual inventory responses.

- [x] Add Vitest tests for non-BillFlow property creation and room create/update helpers or router procedures, including ownership enforcement.
- [x] Add tests for manual inventory responses and dashboard availability queries covering overlapping bookings and blocked dates.
- [x] Add tests for owner-scoped property updates and rejection of unauthorized hotel mutations.

- [x] Add mocked-db tests for `createHotelForOwner`, `createRoomForHotel`, `updateRoomForHotel`, and `updateHotelForOwner` success paths.
- [x] Add router-path tests proving unauthorized `hotel.update`, room mutations, and availability queries are rejected.
- [x] Add mocked query tests for `listRoomAvailabilityForHotel` and the manual catalog/live-availability mapping.

- [x] Add Vitest coverage for non-BillFlow catalog, property, and live-availability router mapping, including manual available-room propagation and `source: "staynest"` fallback behavior.
- [x] Add router-level guest-facing tests verifying overlapping bookings and blocked dates through catalog/property/live-availability outputs.

- [x] Add router-level catalog/property/live-availability cases that derive reduced availability from overlapping active bookings and room/property blocks.
- [x] Verify that guest-facing manual inventory mappings expose zero available rooms when a room or property is blocked.

- [x] Add a guest-facing router test where a room-specific blocked period drives `availableRooms: 0` through the catalog/property/live-availability mapping.

- [x] Refactor StayNest frontend to adopt Booking.com's high-density search bar, property result list layout, sticky filter sidebar, badge highlights, and structured guest review display.
- [x] Refactor StayNest frontend to adopt Booking.com's high-density search bar, property result list layout, sticky filter sidebar, badge highlights, and structured guest review display.

- [x] Preserve the official StayNest logo across header, footer, favicon, metadata, and mobile navigation, with a repository safeguard and verification test.

- [x] Use the user-provided IMG_3886.PNG as a responsive background overlay behind the “Arrive somewhere wonderful” hero section while preserving contrast and search readability.

- [x] Fix deployed header logo rendering as a missing-image placeholder and verify the corrected asset path on mobile and desktop.

- [x] Fix deployed header logo rendering as a missing-image placeholder and verify the corrected asset path on mobile and desktop.
- [x] Remove the user-provided screenshot overlay from the “Arrive somewhere wonderful” hero section while preserving the intended hero background treatment.

- [x] Implement interactive guest reviews and rating submissions with eligibility validation, persistence, and live property rating aggregation.

- [x] Replace the failing deployed logo storage references with a deployment-safe in-repository logo asset and verify actual rendered delivery.
- [x] Permanently remove the unwanted screenshot overlay from the hero section and guard against reintroducing it.

- [x] Allow verified guests to attach photos of their property experience when submitting a review, using S3 storage and responsive gallery rendering.

- [x] Implement multi-currency rate switching (GHS/USD) across search results, property pages, and partner rate management.
- [x] Implement automated check-in reminder scheduling and notification workflows.
- [x] Build an interactive photo lightbox viewer for guest review photos on property detail pages.

- [x] Restore IMG_3886.PNG as the approved responsive hero overlay behind “Arrive somewhere wonderful,” preserving text and search contrast.

- [x] Replace the current hero overlay with IMG_3909.JPG as a full-bleed image-first background treatment with readable StayNest content.

- [x] Fix IMG_3909 production delivery by replacing the failing managed-storage hero URL with a repository-served asset path and verify the live image renders.

- [x] Push the repository-served /hero/hero-background.jpg change to GitHub and verify Vercel production loads it.
- [x] Capture production response evidence showing /hero/hero-background.jpg is served as an image before closing the hero delivery fix.

- [x] Generate a clear, attractive wide hero image asset and integrate it as the full-view StayNest hero background.

- [x] Integrate repository-served custom-hero.jpg hero asset with verified local tests and checkpoint.
- [x] Verify local responsive rendering across mobile and desktop breakpoints.

- [x] Integrate IMG_3911.JPG without stretching or distortion, preserving its original 800×598 aspect ratio in the responsive hero.

- [x] Soften IMG_3911 photo edges with a subtle blur/fade treatment while preserving the full image and original aspect ratio.

- [x] Feather the actual IMG_3911 photo edges while keeping its interior sharp and leaving the background layer unchanged.

- [x] Move IMG_3911 upward behind “Arrive somewhere wonderful” and feather the photo edges into the background without stretching.

- [x] Create and verify StayNest administrator account for wisdomasaare41@gmail.com with full platform oversight over all hotels, guest houses, guests, and bookings.

- [x] Ensure seamless GitHub and Vercel synchronization for StayNest without requiring repeated terminal device authentication.

- [x] Fix mobile sign-in button not responding on StayNest production.

- [x] Fix OAuth portal URL destination returning 404 Route Not Found in production.

- [x] Replace Manus OAuth with StayNest-native email/password authentication and branded sign-in modal/page.

- [x] Upgrade password hashing to secure bcrypt and add automated tests for local registration, login, logout, and role-based permissions.
- [x] Clean up remaining legacy Manus session references across client auth hooks and bootstrap handlers.

- [x] Verify Vercel production is deploying the latest GitHub `main` commit `5a0e306` and correct the GitHub-to-Vercel sync if needed.

- [x] Fix the native sign-in form error `The string did not match the expected pattern` when the superadmin submits valid credentials.
- [x] Add automated coverage proving `auth.localLogin` succeeds for `wisdomasaare41@gmail.com` with normalized valid credentials.
- [ ] Verify the superadmin sign-in flow in the browser after deployment and confirm a session is created without the validation error.
- [x] Normalize and trim email consistently in server-side local login and registration lookups if required by the end-to-end test.
- [ ] Fix the deployed native sign-in request failing with `Unexpected end of JSON input` after form submission.
- [x] Disable Vercel Deployment Protection for the public StayNest production project so native API authentication is reachable by guests and owners.
- [x] Add a Vercel-compatible serverless entrypoint for `/api/trpc` so mutations do not fall through to the static index page.
- [ ] Add Vercel routing configuration and verify the public deployed native superadmin login creates a session.
- [x] Remove the invalid explicit Vercel function runtime override that caused the d6ffc29 build to fail.
- [ ] Exclude `/api` paths from Vercel’s SPA fallback rewrite so the tRPC function receives public mutation requests.
