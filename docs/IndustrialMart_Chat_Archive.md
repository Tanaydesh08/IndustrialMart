# Industrial Mart Chat and Work Archive

Updated: 2026-10-26

This file records the requirements, decisions, completed implementation context, and verification history from the Industrial Mart work in this chat. Sensitive credential values are intentionally omitted.

## Project

- Frontend: `D:\IndustrialMart\frontend` (React, Vite, Tailwind)
- Backend: `D:\IndustrialMart\Backend\Backend` (Java 21, Spring Boot, Spring Security/JWT, PostgreSQL)
- Deployment target: Railway
- Production actions such as deploy, restart, changing settings, database writes/migrations, commit, or push require separate authorization. No such actions have been taken in this turn.

## User requirements captured

### Industrial Mart full-stack implementation

- Fully integrate the existing frontend and backend while preserving existing data and working functionality.
- Require sign-in for every application feature; only Login, Create Account, and necessary auth endpoints are public. Enforce auth and roles in Spring Security and backend services, not only in UI state.
- Support buyer, seller, and admin capabilities with backend role checks and listing ownership validation. Self-registration cannot create ADMIN accounts.
- Use “Deals” as the user-facing label instead of “Marketplace.” Keep internal routes/classes where practical.
- Provide a persisted, immediate English / Hindi Roman (Hinglish) language switch. Centralize strings; leave user-generated listing content unchanged. Keep Login and Create Account unchanged.
- Preserve existing category IDs and slugs; present slug `truck` as “Trucks & Vehicles.”
- Buyers unlock approved listing details with a simulated, configured ₹99 payment per listing; entitlement belongs to that buyer/listing, persists, and prevents repeat charges. Keep private listing details protected.
- Sellers pay the existing listing fee through a distinct simulated payment and still undergo moderation. Payment outcomes must be backend-owned, transactional, and retry-safe; no real payment gateway.
- Validate and display uploaded listing photos, use durable Railway-suitable object storage, and keep credentials backend-only.
- Configure PostgreSQL and JWT secrets via environment variables; do not disclose secrets or reset production data.
- Add and run relevant frontend/backend tests and builds; do not claim unrun checks.

### Production unlock incident and current task

- Reported endpoint pair: `POST /api/prototype/payments/listing-unlock?listingId=5` returns 500; `GET /api/prototype/buyer/listings/5/details` returns 403.
- Railway log-confirmed root cause for POST: PostgreSQL constraint `payment_transactions_purpose_check` rejected `LISTING_UNLOCK` when `PrototypePaymentService.createListingUnlockPayment()` inserted the simulated payment.
- The GET response is separately controlled by buyer authentication/role and a persisted buyer-specific unlock entitlement. A 403 before payment/entitlement exists is expected. No authorization bypass should be added.
- Current task forbids commit, push, deployment, Railway restart/settings changes, or applying the migration to production. Provide the migration and rollout instructions for review first.

## Implementation context

Earlier work in this project implemented mandatory auth and role guards, listing moderation and ownership checks, the buyer ₹99 simulated unlock flow, seller fee simulation, centralized English/Hindi Roman labels, Trucks & Vehicles category presentation, and private S3-compatible listing-image support with a legacy local-image migration path. Tests cover route/API alignment and a number of role/payment flows. Refer to source and `Backend/Backend/RAILWAY_SETUP.md` for current implementation details.

Current changes for the confirmed production issue:

- Added Flyway core and PostgreSQL database support dependencies.
- Added Java versioned migration `V1__AllowListingUnlockPaymentPurpose` in `Backend/Backend/src/main/java/db/migration/`. It replaces the specific CHECK constraint with the current enum values `CREDIT_PACK`, `LISTING_FEE`, and `LISTING_UNLOCK`. It does not rewrite or delete existing transaction records. It safely no-ops on an empty database before Hibernate creates the tables.
- Added entity column definition for a fresh schema so it uses the same supported payment purposes.
- Enabled Flyway at startup. Since this repository did not have prior migration history, existing databases with no Flyway history are configured to baseline at version 0, then execute V1. If production already has Flyway history, inspect it before rollout; do not baseline/reset it blindly.
- Added H2 regression tests proving existing credit-pack/listing-fee rows survive, LISTING_UNLOCK inserts, unsupported values remain rejected, and empty DB migration startup is safe.
- Added anonymous unlock-payment POST coverage. Existing service/HTTP tests cover buyer entitlement, repeat/concurrent retries, failed payments, payment/entitlement rollback, buyer identity derived from authentication, and role denial.
- Backend datasource configuration now references Railway PostgreSQL environment variables instead of a source-embedded credential. The earlier value must be treated as compromised and rotated manually in Railway; it was not rotated here.
- Added a step-by-step migration verification process in `Backend/Backend/RAILWAY_SETUP.md`.

## Relevant files changed for current task

- `Backend/Backend/pom.xml`
- `Backend/Backend/src/main/resources/application.properties`
- `Backend/Backend/src/main/java/com/IndustrialMart/Backend/payment/PaymentTransaction.java`
- `Backend/Backend/src/main/java/db/migration/V1__AllowListingUnlockPaymentPurpose.java`
- `Backend/Backend/src/test/resources/application.properties`
- `Backend/Backend/src/test/java/com/IndustrialMart/Backend/AuthenticationSecurityTests.java`
- `Backend/Backend/src/test/java/com/IndustrialMart/Backend/PaymentPurposeMigrationTests.java`
- `Backend/Backend/RAILWAY_SETUP.md`

## Verification record

Current run (2026-10-26):

- Backend command: Maven `test` using the project wrapper distribution and local Maven repository. Result: **BUILD SUCCESS**, 25 tests, 0 failures, 0 errors, 0 skipped. Included migration (2), payment service (9), role authorization (7), security (2), storage (4), and application context (1) suites.
- Frontend command: `npm.cmd test`. Result: **4 passed, 0 failed**. Tests cover translation labels, protected routes, and frontend unlock/details API route alignment.
- Frontend command: `npm.cmd run build -- --outDir ..\build-check`. Result: **Vite production build succeeded** (1657 modules). Output was directed to a temporary workspace folder, not deployed.
- No Railway database migration, signed-in production test, provider credential verification, production settings change, deploy, restart, push, or commit was performed.

Prior verification from the earlier implementation work (as reported in the earlier chat): frontend tests/build and backend tests were also run successfully at that time. Those earlier counts are historical and the current run above is the authoritative verification for this change.

## Required production rollout after review/authorization

1. Review this code and take/confirm a normal Railway PostgreSQL backup.
2. Check Railway's `flyway_schema_history`. If absent on the existing non-empty database, the configured baseline at version 0 permits V1. If history exists, inspect its version/checksum first and adjust rollout planning rather than resetting it.
3. Separately authorize deployment of the reviewed backend. Flyway runs before Hibernate and applies V1.
4. Confirm V1 success in startup logs and inspect the resulting constraint. It must accept all three current payment enum purposes.
5. With an approved listing, sign in as a buyer; create the ₹99 simulated unlock, complete it, and load details. Verify payment purpose/status and buyer/listing entitlement. Confirm another buyer remains locked and an unauthenticated request remains rejected.
6. Rotate the previously exposed PostgreSQL credential in Railway, update the backend `PGPASSWORD` reference, and coordinate its restart through the authorized production process. The rotation is not completed by this work.

## Never disclose

The earlier repository configuration contained a database credential. Do not copy its value into this archive, chat, logs, or documentation. Rotate it through Railway as an independent authorized operation.

## Follow-up: buyer unlock calls, page refreshes, and language toggle (2026-10-26)

### Inspection findings

- `frontend/src/pages/ListingDetailsPage.jsx` contained no `location.reload()` after unlock; it already fetched protected details and updated React state. It did, however, always fetch the generic listing first and then the protected details endpoint for a buyer, including buyers who already had access.
- The detail loading effect did not abort on unmount/route changes or guard state updates from stale responses. The disabled button was controlled only by React state, which may not update before a rapid double click.
- `PrototypePaymentService.createListingUnlockPayment()` locked the listing and reused a pending transaction, but returned HTTP conflict when an entitlement already existed, even when the successful payment record was available. It did not create another charge, but it was not a successful idempotent retry response.
- The shared header used a two-option language `<select>`, not a single toggle.

### Changes

- Buyer detail loading now asks the protected endpoint first. Only a successful backend response marks details as unlocked. A 403/404 falls back to the public preview, cached in memory only; cache is never used as proof of entitlement. Reopened already-unlocked listings need only the protected request.
- Listing reads accept an AbortSignal. The page aborts old loads and uses request/flow sequence guards to prevent stale results from replacing current state.
- A synchronous in-flight ref guards unlock creation and simulation against rapid duplicate clicks. A failed simulation clears its payment so a new retry creates a new transaction. After success, React state renders protected details in place. If the payment succeeds but details cannot be fetched, the UI keeps the successful transaction and offers a details-only retry without another payment.
- Repeated backend unlock-payment creation for an existing entitlement returns its latest successful `LISTING_UNLOCK` transaction. If entitlement data exists without a successful payment record, it returns conflict and does not create a new payment.
- The header language selector is now one accessible English/Hindi (Roman) toggle. The selected language still persists through the existing app context.
- Added tests for failed-payment retry, repeated successful access without a second charge, and frontend in-place/request-guard/toggle contracts.

### Files changed in this follow-up

- Frontend: `src/pages/ListingDetailsPage.jsx`, `src/api/listingApi.js`, `src/api/unlockApi.js`, `src/components/layout/SiteLayout.jsx`, `src/i18n/labels.js`, `src/i18n/labels.test.js`
- Backend: `src/main/java/com/IndustrialMart/Backend/payment/PrototypePaymentService.java`, `src/test/java/com/IndustrialMart/Backend/PrototypePaymentServiceTests.java`

### Follow-up verification

- Frontend: `npm.cmd test` — **5 passed, 0 failed**.
- Frontend: `npm.cmd run build -- --outDir ..\build-check` — **Vite production build succeeded** (1657 modules); temporary output removed afterward.
- Backend: Maven `test` — **BUILD SUCCESS**, 26 tests, 0 failures, 0 errors, 0 skipped. Includes buyer payment retry/idempotency and entitlement rollback tests.
- `git diff --check` passed. The only remaining `window.location.assign('/login')` is the separate expired-session redirect in `AppContext`; no page reload or full-page navigation is used after unlocking.
- No deployment, production data change, Railway setting change, commit, or push occurred.

## Follow-up: require listing photos (2026-10-26)

The seller form previously permitted zero photos and skipped upload in that case. The image-storage upload endpoint already validates a batch of 1–8 images, but the listing-fee payment service did not require a saved image reference.

Changes:

- New listing form now requires at least one selected photo and supports multiple JPG/PNG/WEBP photos up to the existing maximum of 8, 5 MB each. It shows photo-count/type validation errors and has English/Hindi Roman labels.
- If listing creation succeeds but photo upload fails, the form keeps the created listing ID and lets the seller retry upload against that same listing. It does not create another listing on retry.
- Backend listing-fee initiation rejects a listing with no saved photo URL, so the seller cannot proceed through payment without a photo. Existing stored records and database schema are unchanged.
- Added frontend form-contract coverage and a backend test proving that fee payment is rejected without a photo; seller-fee tests now include a saved photo.

Files changed: `frontend/src/pages/CreateListingPage.jsx`, `frontend/src/i18n/labels.js`, `frontend/src/i18n/labels.test.js`, `Backend/Backend/src/main/java/com/IndustrialMart/Backend/payment/PrototypePaymentService.java`, and `Backend/Backend/src/test/java/com/IndustrialMart/Backend/PrototypePaymentServiceTests.java`.

Verification: `npm.cmd test` **6 passed**; `npm.cmd run build -- --outDir ..\build-check` succeeded (1657 modules); Maven `test` **BUILD SUCCESS, 27 tests, 0 failures/errors/skips**; `git diff --check` passed. Temporary build output was removed. No production deployment, data change, or settings change was performed.

## Follow-up: store new listing photos in PostgreSQL (2026-10-26)

The production image upload returned 503 because S3 bucket storage was not configured, and the user confirmed they do not have AWS. New uploads now persist image bytes in a PostgreSQL `BYTEA` table named `listing_photo_blobs`, with content type and generated object key. The existing listing image URL shape and authorized photo controller remain unchanged. The image controller still checks listing association, visibility, and buyer entitlement before returning bytes.

Added non-destructive Flyway migration `V2__Create_listing_photo_blobs.sql`; it creates the binary photo table without resetting or altering existing listings/payments. New uploads and local legacy-photo migration save to PostgreSQL. Optional S3 reads are retained solely for old object references if a prior bucket is configured; no S3 setting is required for new photos. Docs now note that database/WAL/backups grow with photos (up to 8 × 5 MB per listing).

Files changed: `Backend/Backend/src/main/java/com/IndustrialMart/Backend/listing/ListingPhotoBlob.java`, `ListingPhotoBlobRepository.java`, `ListingImageStorage.java`, `Backend/Backend/src/main/resources/db/migration/V2__Create_listing_photo_blobs.sql`, `Backend/Backend/src/test/java/com/IndustrialMart/Backend/ListingImageStorageTests.java`, `ListingPhotoDatabaseTests.java`, `RoleAuthorizationTests.java`, `application.properties`, and `RAILWAY_SETUP.md`.

Verification: Maven `test` **BUILD SUCCESS, 28 tests, 0 failures/errors/skips**. This includes a relational H2 persistence/read test without AWS configuration. `git diff --check` was also run. This is local/test verification only: V2 has not been applied to Railway, and no settings, production data, deployment, commit, or push were changed.

## Follow-up: Cloudinary photo storage selection (2026-10-26)

The user selected Cloudinary for listing photos because AWS is unavailable. This supersedes the immediately preceding PostgreSQL `BYTEA` photo-storage proposal. No Cloudinary account credentials were provided and no Cloudinary live upload was performed.

Implementation in the current workspace:

- New photos upload from the backend to Cloudinary with `type=authenticated`; originals and derivatives are not anonymously deliverable.
- PostgreSQL stores metadata only in the pending Flyway V2 table `listing_photo_assets`: app object key, Cloudinary public ID, content type, and extension/format. Image bytes are not stored locally or in PostgreSQL.
- The existing app image URL remains stable. Its existing protected controller continues checking listing visibility, seller ownership/admin access, and buyer entitlement before it reads the Cloudinary asset and returns the bytes. Cloudinary URLs and credentials are not sent to the browser.
- New image uploads require backend variables `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`; missing configuration yields HTTP 503. The backend validates image signature/content, permits JPG/PNG/WEBP, up to 8 photos per batch and 5 MB each, and generates opaque random asset names. Cloudinary objects are best-effort deleted if their metadata save fails.
- Existing local images can be migrated while their source files still exist using the existing ADMIN migration flow. Optional legacy S3 reads remain supported if configured. An actual image migration may be needed for old durable references.
- `application.properties` was updated to Railway `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, and `JWT_SECRET` environment references. Previously exposed database credential is treated as compromised; it has not been rotated in Railway. No production settings/data were changed.
- Pending Flyway V2 now creates `listing_photo_assets`. This workspace-only migration has not been applied to any production database. Review Flyway history and backup before any separately authorized deployment; it preserves existing listing/payment data.

Files changed for this follow-up: `Backend/Backend/pom.xml`, `Backend/Backend/RAILWAY_SETUP.md`, `Backend/Backend/src/main/resources/application.properties`, `Backend/Backend/src/main/resources/db/migration/V2__Create_listing_photo_assets.sql`, `Backend/Backend/src/main/java/com/IndustrialMart/Backend/config/CloudinaryConfig.java`, `CloudinaryAssetClientImpl.java`, `Backend/Backend/src/main/java/com/IndustrialMart/Backend/listing/CloudinaryAssetClient.java`, `ListingImageStorage.java`, `ListingPhotoBlob.java`, `Backend/Backend/src/test/java/com/IndustrialMart/Backend/ListingImageStorageTests.java`, and `ListingPhotoDatabaseTests.java`.

Verification: backend Maven `test` completed **BUILD SUCCESS**, 29 tests, 0 failures, 0 errors, and 0 skipped. Cloudinary calls were mocked; no real Cloudinary request was made. No frontend source changed for this provider switch. No deployment, push, commit, Railway configuration change, database migration, or credential rotation occurred.

Safe setup/release after review: create a Cloudinary account/product environment; add the three Cloudinary variables only to Railway's backend service; ensure the configured environment is the one intended for listing photos and keep delivery authenticated; take a PostgreSQL backup and inspect Flyway history; separately authorize deployment; verify V2 in Flyway history; then test a signed-in seller upload of one and several valid photos, confirm stored app URLs and public-ID metadata without direct public Cloudinary delivery, load authorized listing images, confirm unauthorized requests remain denied, and verify images survive a backend restart/redeploy. Do not claim storage is operational until that live test succeeds.
