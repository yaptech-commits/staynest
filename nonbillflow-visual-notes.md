# Non-BillFlow Owner Visual Verification

The desktop `/hotel-dashboard` view renders the existing first-property setup wizard clearly with the supplied StayNest wordmark, step indicator, property fields, submission CTA, privacy note, and partner footer. The mobile 390px view preserves the same hierarchy, keeps the wordmark and menu control separated, stacks the property fields without horizontal overflow, and keeps the submission button readable. The authenticated owner dashboard and the new inventory workspace require an authenticated partner session to exercise interactively; TypeScript and Vitest checks provide the current non-browser verification for those paths.

The non-BillFlow implementation now includes an owner-scoped property editor, amenity/photo URL fields, optional map coordinates, a full room-type editor, manual availability by date range, and computed availability that subtracts overlapping booked rooms and blocked periods.
