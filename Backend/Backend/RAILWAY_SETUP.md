# Railway backend configuration

## PostgreSQL and migrations

The backend reads Railway PostgreSQL variables `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD`. Reference them from Railway's PostgreSQL service in the backend service variables. Prefer the internal host when both services are in the same Railway project. Credentials must remain backend-only.

Flyway migrations run before Hibernate. V1 extends the payment purpose check; V2 creates `listing_photo_assets` for Cloudinary metadata. Both preserve existing listing and payment data. Review `flyway_schema_history` and take a backup before any separately authorized production rollout. Do not reset the database. `ddl-auto=update` does not replace migrations.

## Listing photo storage with Cloudinary

New listing photos are uploaded by the backend to Cloudinary as `authenticated` image assets. This protects originals and derived assets from anonymous delivery. PostgreSQL stores only the generated app object key, Cloudinary public ID, content type, and format in `listing_photo_assets`; image bytes are not stored in Railway's ephemeral filesystem or PostgreSQL. The existing `/api/listings/images/{key}` route remains the app URL and continues to enforce listing ownership, visibility, and buyer entitlement before fetching the protected image server-side. The Cloudinary URL and credentials are never sent to the browser.

Required backend-only Railway variables for new uploads:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Create a Cloudinary account/product environment, then set the cloud name and API credentials in the Railway backend service variables. Never use a Cloudinary upload preset that makes these assets public. New uploads fail with HTTP 503 until all three variables are configured. No real Cloudinary upload has been verified from this development environment because production credentials are not available here.

The backend accepts JPG, PNG, or WEBP only, validates file signatures/content, allows up to 8 images per upload with a 5 MB per-file limit, and generates random asset IDs. Uploads that cannot be recorded in PostgreSQL are deleted from Cloudinary on a best-effort basis. App image URLs remain stable; the database metadata points to Cloudinary for retrieval. Cloudinary availability and account storage/bandwidth limits apply.

Older S3-backed objects can still be read when the optional `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, and `S3_PATH_STYLE` settings and credentials are present. Older local `/listing-images/<filename>` references remain readable from `LISTING_IMAGE_DIRECTORY` while the files exist. Use the ADMIN legacy-image migration endpoint while source files are available; the migrated objects are uploaded to Cloudinary. Existing local photos must be migrated before the old container files disappear.

## Required backend variables

Required in Railway: `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `JWT_SECRET`, `CORS_ALLOWED_ORIGIN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. `PGPORT` defaults to `5432`; Railway supplies `PORT`. `JWT_SECRET` must contain at least 32 bytes. Database credentials and Cloudinary credentials must never be placed in frontend variables.

Optional application variables include `LISTING_FEE_PAISE`, `LISTING_UNLOCK_PRICE_PAISE`, `CREDIT_PACK_PAISE`, `CREDIT_PACK_CREDITS`, `SHOW_SQL`, `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`, and `LISTING_IMAGE_DIRECTORY` (legacy local reads/migration only).

## Previously exposed database credential

A PostgreSQL credential was present in repository configuration and must be treated as compromised. Rotate it in Railway, update the backend `PGPASSWORD` (and `PGUSER` if Railway issues a replacement), and coordinate restart/verification as a separate authorized production operation. This code change does not rotate credentials or modify Railway.
