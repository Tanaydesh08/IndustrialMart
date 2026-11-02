# Industrial Mart — Project Specification

**Target completion date:** November 8, 2026  
**Status:** Final implementation and verification

## 1. Project Overview
Industrial Mart is a marketplace for rice mill and industrial goods. It supports buyers, sellers, and administrators with listing management, paid listing access, and moderation.

## 2. Technology Stack
- **Backend:** Java 21, Spring Boot
- **Database:** PostgreSQL (Railway)
- **Frontend:** React, Vite, Tailwind CSS
- **Authentication:** JWT
- **Image storage:** Cloudinary for new uploads; preserve legacy S3/local compatibility
- **Hosting:** Railway (frontend and backend)

## 3. User Roles
- `BUYER`
- `SELLER`
- `ADMIN`

Implement role-based access control throughout the application. Do not bypass or weaken authentication, authorization, ownership checks, or payment checks.

## 4. Authentication and Access
- The initial public experience must be Login / Register.
- Protect all application features that require authentication.
- Do not expose protected marketplace actions or details to guests.
- Sellers must be able to view and manage their own listings.
- Admin-only moderation actions must remain restricted to administrators.

## 5. Marketplace Listings

### 5.1 Listing Preview
Before unlocking a listing, buyers may see:
- Listing name/title
- Listing thumbnail/image
- Category
- Other explicitly approved preview fields

Do not expose complete listing details before successful unlock.

### 5.2 Listing Unlock
- Simulated buyer unlock fee: **₹99 per listing**
- A successful unlock grants access to full listing details.
- Repeated access to an already-unlocked listing must not charge again.
- Reject unlock attempts when payment is unsuccessful.
- Keep buyer unlock payments separate from seller listing fees.
- Do not combine or double-charge the legacy credit-wallet/credit-pack flow with the ₹99 unlock flow.

### 5.3 Categories
- Display listing categories clearly in the marketplace.
- Support category filtering where applicable.
- Keep category information consistent between listing creation, preview, and detail views.

### 5.4 Seller Access
- Sellers can view full details of their own listings without buyer unlock.
- Enforce listing ownership on backend endpoints, not only in the frontend.

## 6. Admin Moderation
- Admins can access the moderation queue and approve or reject listings.
- Investigate and fix moderation **403 Forbidden** errors.
- Investigate and fix moderation **409 Conflict** errors.
- Verify JWT, role assignment, request headers, security route rules, state transitions, duplicate requests, and transaction handling as applicable.
- Preserve correct authorization and moderation state rules; do not bypass checks or suppress errors.

## 7. Frontend and Responsive UX
- Make the complete application responsive and mobile-friendly.
- Verify layouts at these viewport sizes:
  - 360 × 800
  - 390 × 844
  - 768 × 1024
  - 1024 × 768
  - 1440 × 900
- Ensure cards, buttons, forms, dialogs, navigation, and page content remain visible and usable on mobile.
- Make marketplace cards and actions easy to navigate and tap.
- Keep navigation simple, consistent, and understandable.
- Avoid unnecessary UI elements, redesigns, or feature additions.

## 8. API and Feature Verification
- Audit frontend API calls against backend endpoints.
- Ensure every required feature is connected to the correct API.
- Verify request payloads, response handling, authentication headers, error handling, and loading/empty states.
- Test login, registration, role-based access, listing creation, listing preview, buyer unlock, unlocked details, seller listing access, and admin moderation.
- Confirm persistence after backend restart where applicable.
- Add or update focused tests where useful.

## 9. Image Uploads and Storage
- Use Cloudinary for new image uploads.
- Diagnose and resolve image-upload failures (including HTTP 503 responses).
- Verify required Cloudinary environment variables are configured in the deployment environment without exposing their values.
- Preserve legacy S3/local storage compatibility unless proven unnecessary and removal is explicitly approved.
- Do not hardcode credentials or secrets.

## 10. Production Safety and Change Constraints
- **Do not modify `application.properties`**—including values, formatting, or unrelated configuration.
- Do not make unrelated code changes, broad refactors, or unnecessary dependency additions.
- Do not rewrite working modules without a demonstrated need.
- Do not weaken JWT, authorization, role checks, ownership checks, or payment checks.
- Do not perform destructive database operations, reset data, or introduce migrations without approval.
- Do not commit, push, deploy, or restart production unless explicitly authorized.
- Keep changes focused, minimal, and testable.

## 11. Completion Criteria
The project is complete when:
- Login and registration work correctly.
- Protected features require valid authentication and appropriate roles.
- Listing previews show approved preview information only.
- ₹99 buyer unlock works and grants full details.
- Existing unlocks do not charge repeatedly.
- Seller listing access and ownership checks work.
- Categories display and filter correctly.
- Admin moderation queue, approval, and rejection work without unexplained 403/409 errors.
- Image uploads work through Cloudinary and legacy compatibility remains intact.
- Frontend is usable at all specified viewport sizes.
- Required frontend/backend APIs are integrated and verified.
- Relevant tests pass, and remaining limitations are documented.

## 12. Final Report
At completion, report:
1. Files changed.
2. Features completed.
3. Tests and verification performed, with results.
4. Known issues or limitations.
5. Any required Railway environment configuration (names only; never values).
6. Any manual steps still required.

**Do not claim a feature or test is complete unless it has actually been implemented and verified.**
